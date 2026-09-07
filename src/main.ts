import { Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	DailyTrackerView,
	VIEW_TYPE_DAILY_TRACKER,
} from './dailyTrackerView';
import {
	addDays,
	formatDateKey,
	parseDateKey,
	startOfWeek,
} from './dateUtils';
import { parseFolderList, matchesFolderFilter } from './folderFilter';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from './settings';
import {
	buildWordCountSnapshot,
	countWordsWrittenToday,
} from './wordCount';

export interface DayRecord {
	ticked: boolean;
	wordCount: number;
}

/** Per-file word counts captured at the start of each calendar day. */
export type DayStartSnapshots = Record<string, Record<string, number>>;

interface PluginPersistedData {
	settings?: Partial<MyPluginSettings>;
	dayRecords?: Record<string, DayRecord>;
	dayStartSnapshots?: DayStartSnapshots;
}

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	dayRecords: Record<string, DayRecord> = {};
	dayStartSnapshots: DayStartSnapshots = {};
	private updateDebounce: ReturnType<typeof setTimeout> | null = null;
	private isUpdatingToday = false;

	async onload() {
		await this.loadSettings();
		this.ensureTrackingStarted();

		this.registerView(
			VIEW_TYPE_DAILY_TRACKER,
			(leaf: WorkspaceLeaf) => new DailyTrackerView(leaf, this),
		);

		this.addRibbonIcon('calendar-check', '每日字數追蹤', () => {
			this.activateTrackerView();
		});

		this.addCommand({
			id: 'open-daily-word-tracker',
			name: '開啟每日字數追蹤',
			callback: () => {
				this.activateTrackerView();
			},
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile) this.handleVaultChange(file);
			}),
		);
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile) this.handleVaultChange(file);
			}),
		);
		this.registerEvent(
			this.app.vault.on('delete', () => {
				this.scheduleTodayUpdate();
			}),
		);
		this.registerEvent(
			this.app.workspace.on('editor-change', () => {
				this.scheduleTodayUpdate();
			}),
		);

		await this.updateTodayRecord();
	}

	onunload() {
		if (this.updateDebounce) clearTimeout(this.updateDebounce);
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_DAILY_TRACKER)
			.forEach((leaf) => leaf.detach());
	}

	ensureTrackingStarted(): void {
		if (this.settings.trackingWeekStart) return;

		const weekStart = startOfWeek(new Date());
		this.settings.trackingWeekStart = formatDateKey(weekStart);
		this.saveAllData();
	}

	getTrackingWeekStart(): Date {
		const parsed = parseDateKey(this.settings.trackingWeekStart);
		if (parsed) return parsed;
		return startOfWeek(new Date());
	}

	isWithinTrackingPeriod(date: Date): boolean {
		return date.getTime() >= this.getTrackingWeekStart().getTime();
	}

	handleVaultChange(file: TFile): void {
		if (!file.path.endsWith('.md')) return;
		const include = parseFolderList(this.settings.includeFolders);
		const exclude = parseFolderList(this.settings.excludeFolders);
		if (!matchesFolderFilter(file.path, include, exclude)) return;
		this.scheduleTodayUpdate();
	}

	async activateTrackerView(): Promise<void> {
		this.ensureTrackingStarted();
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_DAILY_TRACKER)[0];

		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (!rightLeaf) return;
			leaf = rightLeaf;
			await leaf.setViewState({
				type: VIEW_TYPE_DAILY_TRACKER,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}

	getDayRecord(dateKey: string): DayRecord {
		const record = this.dayRecords[dateKey];
		if (record) return record;
		return { ticked: false, wordCount: 0 };
	}

	async setDayRecord(dateKey: string, record: DayRecord): Promise<void> {
		this.dayRecords[dateKey] = record;
		await this.saveAllData();
	}

	scheduleTodayUpdate(): void {
		if (this.updateDebounce) clearTimeout(this.updateDebounce);
		this.updateDebounce = setTimeout(() => {
			this.updateTodayRecord();
		}, 400);
	}

	async ensureDayStartSnapshot(dateKey: string): Promise<Record<string, number>> {
		const existing = this.dayStartSnapshots[dateKey];
		if (existing) return existing;

		const include = parseFolderList(this.settings.includeFolders);
		const exclude = parseFolderList(this.settings.excludeFolders);
		const snapshot = await buildWordCountSnapshot(
			this.app,
			include,
			exclude,
		);

		this.dayStartSnapshots[dateKey] = snapshot;
		await this.saveAllData();
		return snapshot;
	}

	async resetTodaySnapshot(): Promise<void> {
		const dateKey = formatDateKey(new Date());
		delete this.dayStartSnapshots[dateKey];
		await this.ensureDayStartSnapshot(dateKey);
		await this.updateTodayRecord();
		this.refreshTrackerViews();
	}

	async updateTodayRecord(): Promise<void> {
		if (this.isUpdatingToday) return;
		this.isUpdatingToday = true;

		try {
			const today = new Date();
			if (!this.isWithinTrackingPeriod(today)) return;

			const dateKey = formatDateKey(today);
			const include = parseFolderList(this.settings.includeFolders);
			const exclude = parseFolderList(this.settings.excludeFolders);
			const snapshot = await this.ensureDayStartSnapshot(dateKey);
			const words = await countWordsWrittenToday(
				this.app,
				include,
				exclude,
				snapshot,
			);

			const record = this.getDayRecord(dateKey);
			const ticked = words > 0;
			if (record.ticked === ticked && record.wordCount === words) return;

			await this.setDayRecord(dateKey, { ticked, wordCount: words });
			this.refreshTrackerViews();
		} finally {
			this.isUpdatingToday = false;
		}
	}

	async updateDayRecord(date: Date): Promise<void> {
		if (!this.isWithinTrackingPeriod(date)) return;

		const dateKey = formatDateKey(date);
		const include = parseFolderList(this.settings.includeFolders);
		const exclude = parseFolderList(this.settings.excludeFolders);
		const todayKey = formatDateKey(new Date());
		const words =
			dateKey === todayKey
				? await countWordsWrittenToday(
						this.app,
						include,
						exclude,
						await this.ensureDayStartSnapshot(dateKey),
					)
				: this.getDayRecord(dateKey).wordCount;

		const ticked = words > 0;
		await this.setDayRecord(dateKey, { ticked, wordCount: words });
	}

	async recalculateAllTickedDays(): Promise<void> {
		const include = parseFolderList(this.settings.includeFolders);
		const exclude = parseFolderList(this.settings.excludeFolders);
		const trackingStart = this.getTrackingWeekStart();
		const today = new Date();

		const todayKey = formatDateKey(today);

		for (
			let cursor = new Date(trackingStart);
			cursor.getTime() <= today.getTime();
			cursor = addDays(cursor, 1)
		) {
			const dateKey = formatDateKey(cursor);
			const record = this.getDayRecord(dateKey);

			if (dateKey === todayKey) {
				const snapshot = await this.ensureDayStartSnapshot(dateKey);
				record.wordCount = await countWordsWrittenToday(
					this.app,
					include,
					exclude,
					snapshot,
				);
			}

			record.ticked = record.wordCount > 0;
			this.dayRecords[dateKey] = record;
		}

		await this.saveAllData();
		this.refreshTrackerViews();
	}

	refreshTrackerViews(): void {
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_DAILY_TRACKER)
			.forEach((leaf) => {
				const view = leaf.view;
				if (view instanceof DailyTrackerView) {
					view.render();
				}
			});
	}

	async loadSettings() {
		const data = (await this.loadData()) as PluginPersistedData | null;
		if (!data) {
			this.settings = Object.assign({}, DEFAULT_SETTINGS);
			this.dayRecords = {};
			this.dayStartSnapshots = {};
			return;
		}

		if (data.settings) {
			this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
		} else {
			const { dayRecords: _dayRecords, ...legacy } = data as PluginPersistedData &
				Partial<MyPluginSettings>;
			this.settings = Object.assign({}, DEFAULT_SETTINGS, legacy);
		}

		this.dayRecords = data.dayRecords ?? {};
		this.dayStartSnapshots = data.dayStartSnapshots ?? {};
	}

	async saveSettings() {
		await this.saveAllData();
	}

	async saveAllData() {
		await this.saveData({
			settings: this.settings,
			dayRecords: this.dayRecords,
			dayStartSnapshots: this.dayStartSnapshots,
		});
	}
}
