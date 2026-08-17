import { Plugin, WorkspaceLeaf } from 'obsidian';
import {
	DailyTrackerView,
	VIEW_TYPE_DAILY_TRACKER,
} from './dailyTrackerView';
import { parseFolderList } from './folderFilter';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from './settings';
import { countWordsForDay, formatDateKey } from './wordCount';

export interface DayRecord {
	ticked: boolean;
	wordCount: number;
}

interface PluginPersistedData {
	settings?: Partial<MyPluginSettings>;
	dayRecords?: Record<string, DayRecord>;
}

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	dayRecords: Record<string, DayRecord> = {};

	async onload() {
		await this.loadSettings();

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
	}

	onunload() {
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_DAILY_TRACKER)
			.forEach((leaf) => leaf.detach());
	}

	async activateTrackerView(): Promise<void> {
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

	async recalculateAllTickedDays(): Promise<void> {
		const include = parseFolderList(this.settings.includeFolders);
		const exclude = parseFolderList(this.settings.excludeFolders);

		for (const [dateKey, record] of Object.entries(this.dayRecords)) {
			if (!record.ticked) continue;

			const parts = dateKey.split('-').map(Number);
			const year = parts[0];
			const month = parts[1];
			const day = parts[2];
			if (!year || !month || !day) continue;

			const date = new Date(year, month - 1, day);
			record.wordCount = await countWordsForDay(
				this.app,
				date,
				include,
				exclude,
			);
		}

		await this.saveAllData();
		this.refreshTrackerViews();
	}

	refreshTrackerViews(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_TRACKER).forEach(
			(leaf) => {
				const view = leaf.view;
				if (view instanceof DailyTrackerView) {
					view.render();
				}
			},
		);
	}

	async loadSettings() {
		const data = (await this.loadData()) as PluginPersistedData | null;
		if (!data) {
			this.settings = Object.assign({}, DEFAULT_SETTINGS);
			this.dayRecords = {};
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
	}

	async saveSettings() {
		await this.saveAllData();
	}

	async saveAllData() {
		await this.saveData({
			settings: this.settings,
			dayRecords: this.dayRecords,
		});
	}
}
