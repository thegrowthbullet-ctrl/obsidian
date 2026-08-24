import { ItemView, WorkspaceLeaf } from 'obsidian';
import MyPlugin from './main';
import {
	addDays,
	formatDateKey,
	formatDateKeyShort,
	formatWeekRange,
	isBeforeDay,
	startOfWeek,
} from './dateUtils';
import { parseFolderList } from './folderFilter';

export const VIEW_TYPE_DAILY_TRACKER = 'daily-word-tracker';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export class DailyTrackerView extends ItemView {
	plugin: MyPlugin;
	displayWeekStart: Date;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.displayWeekStart = startOfWeek(new Date());
	}

	getViewType(): string {
		return VIEW_TYPE_DAILY_TRACKER;
	}

	getDisplayText(): string {
		return '每日字數';
	}

	getIcon(): string {
		return 'calendar-check';
	}

	async onOpen(): Promise<void> {
		this.plugin.ensureTrackingStarted();
		await this.render();
	}

	async onClose(): Promise<void> {
		this.containerEl.empty();
	}

	async render(): Promise<void> {
		const container = this.containerEl;
		container.empty();
		container.addClass('daily-word-tracker-root');

		const trackingStart = this.plugin.getTrackingWeekStart();
		const canGoPrev = isBeforeDay(trackingStart, this.displayWeekStart);

		const header = container.createDiv({ cls: 'dwt-header' });
		const prevBtn = header.createEl('button', {
			text: '◀',
			cls: 'dwt-nav-btn',
		});
		prevBtn.disabled = !canGoPrev;
		if (!canGoPrev) prevBtn.addClass('dwt-nav-btn-disabled');

		const title = header.createEl('h2', { cls: 'dwt-title' });
		title.setText(formatWeekRange(this.displayWeekStart));

		const nextBtn = header.createEl('button', {
			text: '▶',
			cls: 'dwt-nav-btn',
		});

		prevBtn.addEventListener('click', () => {
			if (!canGoPrev) return;
			this.changeWeek(-1);
		});
		nextBtn.addEventListener('click', () => {
			this.changeWeek(1);
		});

		const calendar = container.createDiv({ cls: 'dwt-calendar' });

		const weekdayRow = calendar.createDiv({ cls: 'dwt-weekdays' });
		for (const label of WEEKDAY_LABELS) {
			weekdayRow.createDiv({ text: label, cls: 'dwt-weekday' });
		}

		const grid = calendar.createDiv({ cls: 'dwt-grid dwt-grid-week' });
		this.buildWeekGrid(grid, trackingStart);

		const scoreboard = container.createDiv({ cls: 'dwt-scoreboard' });
		this.buildScoreboard(scoreboard, trackingStart);
	}

	changeWeek(delta: number): void {
		const next = addDays(this.displayWeekStart, delta * 7);
		const trackingStart = this.plugin.getTrackingWeekStart();
		if (isBeforeDay(next, trackingStart) && delta < 0) return;
		this.displayWeekStart = next;
		this.render();
	}

	buildWeekGrid(gridEl: HTMLElement, trackingStart: Date): void {
		for (let i = 0; i < 7; i++) {
			const date = addDays(this.displayWeekStart, i);
			const dateKey = formatDateKey(date);
			const inTracking = !isBeforeDay(date, trackingStart);
			const record = this.plugin.getDayRecord(dateKey);
			const isToday = dateKey === formatDateKey(new Date());

			const cell = gridEl.createDiv({
				cls: `dwt-cell${record.ticked ? ' dwt-cell-ticked' : ''}${!inTracking ? ' dwt-cell-disabled' : ''}${isToday ? ' dwt-cell-today' : ''}`,
			});

			const topRow = cell.createDiv({ cls: 'dwt-cell-top' });
			topRow.createSpan({
				text: `${date.getMonth() + 1}/${date.getDate()}`,
				cls: 'dwt-day-num',
			});

			const check = topRow.createEl('input', {
				type: 'checkbox',
				cls: 'dwt-checkbox',
			});
			check.checked = record.ticked;
			check.disabled = !inTracking;

			const countEl = cell.createDiv({ cls: 'dwt-cell-count' });
			if (!inTracking) {
				countEl.setText('—');
			} else if (record.ticked) {
				countEl.setText(this.formatCount(record.wordCount));
			} else {
				countEl.setText('—');
			}

			if (!inTracking) continue;

			const toggle = async (): Promise<void> => {
				if (check.checked) {
					await this.plugin.updateDayRecord(date);
				} else {
					await this.plugin.setDayRecord(dateKey, {
						ticked: false,
						wordCount: 0,
					});
				}
				await this.render();
			};

			check.addEventListener('change', () => {
				toggle();
			});

			cell.addEventListener('click', (evt) => {
				if ((evt.target as HTMLElement).tagName === 'INPUT') return;
				check.checked = !check.checked;
				toggle();
			});
		}
	}

	buildScoreboard(scoreboardEl: HTMLElement, trackingStart: Date): void {
		const today = new Date();
		let tickedDays = 0;
		const rows: { dateKey: string; words: number; cumulative: number }[] =
			[];
		let runningTotal = 0;

		for (
			let cursor = new Date(trackingStart);
			!isBeforeDay(today, cursor);
			cursor = addDays(cursor, 1)
		) {
			const dateKey = formatDateKey(cursor);
			const record = this.plugin.getDayRecord(dateKey);
			if (!record.ticked) continue;

			tickedDays += 1;
			runningTotal += record.wordCount;
			rows.push({
				dateKey,
				words: record.wordCount,
				cumulative: runningTotal,
			});
		}

		const cumulative = runningTotal;

		rows.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

		scoreboardEl.createEl('h3', { text: 'Scoreboard' });
		scoreboardEl.createDiv({
			cls: 'dwt-score-summary',
			text: `${this.formatCount(cumulative)} 字 · ${tickedDays} 天`,
		});

		if (rows.length === 0) return;

		const tableWrap = scoreboardEl.createDiv({ cls: 'dwt-score-table-wrap' });
		const table = tableWrap.createEl('table', { cls: 'dwt-score-table' });
		const thead = table.createEl('thead');
		const headRow = thead.createEl('tr');
		headRow.createEl('th', { text: '日期' });
		headRow.createEl('th', { text: '當日字數' });
		headRow.createEl('th', { text: '累積字數' });

		const tbody = table.createEl('tbody');
		for (const row of rows) {
			const tr = tbody.createEl('tr');
			tr.createEl('td', { text: formatDateKeyShort(row.dateKey) });
			tr.createEl('td', { text: this.formatCount(row.words) });
			tr.createEl('td', { text: this.formatCount(row.cumulative) });
		}
	}

	formatCount(n: number): string {
		return n.toLocaleString();
	}
}
