import { ItemView, WorkspaceLeaf } from 'obsidian';
import MyPlugin from './main';
import { parseFolderList } from './folderFilter';
import {
	countWordsForDay,
	formatDateKey,
} from './wordCount';

export const VIEW_TYPE_DAILY_TRACKER = 'daily-word-tracker';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export class DailyTrackerView extends ItemView {
	plugin: MyPlugin;
	displayYear: number;
	displayMonth: number;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
		const now = new Date();
		this.displayYear = now.getFullYear();
		this.displayMonth = now.getMonth();
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
		await this.render();
	}

	async onClose(): Promise<void> {
		this.containerEl.empty();
	}

	async render(): Promise<void> {
		const container = this.containerEl;
		container.empty();
		container.addClass('daily-word-tracker-root');

		const header = container.createDiv({ cls: 'dwt-header' });
		const prevBtn = header.createEl('button', {
			text: '◀',
			cls: 'dwt-nav-btn',
		});
		const title = header.createEl('h2', {
			cls: 'dwt-title',
		});
		title.setText(`${this.displayYear} 年 ${this.displayMonth + 1} 月`);
		const nextBtn = header.createEl('button', {
			text: '▶',
			cls: 'dwt-nav-btn',
		});

		prevBtn.addEventListener('click', () => {
			this.changeMonth(-1);
		});
		nextBtn.addEventListener('click', () => {
			this.changeMonth(1);
		});

		const weekdayRow = container.createDiv({ cls: 'dwt-weekdays' });
		for (const label of WEEKDAY_LABELS) {
			weekdayRow.createDiv({ text: label, cls: 'dwt-weekday' });
		}

		const grid = container.createDiv({ cls: 'dwt-grid' });
		this.buildMonthGrid(grid);

		const scoreboard = container.createDiv({ cls: 'dwt-scoreboard' });
		this.buildScoreboard(scoreboard);
	}

	changeMonth(delta: number): void {
		this.displayMonth += delta;
		if (this.displayMonth < 0) {
			this.displayMonth = 11;
			this.displayYear -= 1;
		} else if (this.displayMonth > 11) {
			this.displayMonth = 0;
			this.displayYear += 1;
		}
		this.render();
	}

	buildMonthGrid(gridEl: HTMLElement): void {
		const firstDay = new Date(this.displayYear, this.displayMonth, 1);
		const daysInMonth = new Date(
			this.displayYear,
			this.displayMonth + 1,
			0,
		).getDate();
		const startWeekday = firstDay.getDay();

		for (let i = 0; i < startWeekday; i++) {
			gridEl.createDiv({ cls: 'dwt-cell dwt-cell-empty' });
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(this.displayYear, this.displayMonth, day);
			const dateKey = formatDateKey(date);
			const record = this.plugin.getDayRecord(dateKey);

			const cell = gridEl.createDiv({
				cls: `dwt-cell${record.ticked ? ' dwt-cell-ticked' : ''}`,
			});

			const topRow = cell.createDiv({ cls: 'dwt-cell-top' });
			topRow.createSpan({ text: String(day), cls: 'dwt-day-num' });

			const check = topRow.createEl('input', {
				type: 'checkbox',
				cls: 'dwt-checkbox',
			});
			check.checked = record.ticked;

			const countEl = cell.createDiv({ cls: 'dwt-cell-count' });
			if (record.ticked) {
				countEl.setText(this.formatCount(record.wordCount));
			} else {
				countEl.setText('—');
			}

			const toggle = async (): Promise<void> => {
				if (check.checked) {
					const include = parseFolderList(
						this.plugin.settings.includeFolders,
					);
					const exclude = parseFolderList(
						this.plugin.settings.excludeFolders,
					);
					const words = await countWordsForDay(
						this.app,
						date,
						include,
						exclude,
					);
					await this.plugin.setDayRecord(dateKey, {
						ticked: true,
						wordCount: words,
					});
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

	buildScoreboard(scoreboardEl: HTMLElement): void {
		const daysInMonth = new Date(
			this.displayYear,
			this.displayMonth + 1,
			0,
		).getDate();

		let cumulative = 0;
		let tickedDays = 0;
		const rows: { dateKey: string; day: number; words: number }[] = [];

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(this.displayYear, this.displayMonth, day);
			const dateKey = formatDateKey(date);
			const record = this.plugin.getDayRecord(dateKey);
			if (!record.ticked) continue;

			tickedDays += 1;
			cumulative += record.wordCount;
			rows.push({ dateKey, day, words: record.wordCount });
		}

		scoreboardEl.createEl('h3', { text: '累積 Scoreboard' });
		scoreboardEl.createDiv({
			cls: 'dwt-score-summary',
			text: `本月已剔 ${tickedDays} 天 · 累積 ${this.formatCount(cumulative)} 字`,
		});

		if (rows.length === 0) {
			scoreboardEl.createDiv({
				cls: 'dwt-score-empty',
				text: '剔選日子後，會由本月第 1 格起累積計算字數。',
			});
			return;
		}

		const table = scoreboardEl.createEl('table', { cls: 'dwt-score-table' });
		const thead = table.createEl('thead');
		const headRow = thead.createEl('tr');
		headRow.createEl('th', { text: '日期' });
		headRow.createEl('th', { text: '當日字數' });
		headRow.createEl('th', { text: '累積字數' });

		const tbody = table.createEl('tbody');
		let running = 0;
		for (const row of rows) {
			running += row.words;
			const tr = tbody.createEl('tr');
			tr.createEl('td', { text: row.dateKey });
			tr.createEl('td', { text: this.formatCount(row.words) });
			tr.createEl('td', { text: this.formatCount(running) });
		}
	}

	formatCount(n: number): string {
		return n.toLocaleString();
	}
}
