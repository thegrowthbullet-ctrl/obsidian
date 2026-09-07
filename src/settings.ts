import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
	includeFolders: string;
	excludeFolders: string;
	/** YYYY-MM-DD of Sunday when tracking started (first plugin load). */
	trackingWeekStart: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	includeFolders: '',
	excludeFolders: '',
	trackingWeekStart: '',
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('p', {
			text: '字數 = 今日新增字數（同昨日結束時比較）。改舊筆記只會計新增部分。',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName('Include folders')
			.addTextArea((text) => {
				text
					.setPlaceholder('Daily')
					.setValue(this.plugin.settings.includeFolders)
					.onChange(async (value) => {
						this.plugin.settings.includeFolders = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 3;
				text.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName('Exclude folders')
			.addTextArea((text) => {
				text
					.setPlaceholder('Templates')
					.setValue(this.plugin.settings.excludeFolders)
					.onChange(async (value) => {
						this.plugin.settings.excludeFolders = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 3;
				text.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName('重置今日字數基準')
			.setDesc('以目前筆記狀態重新作為今日起點（今日字數會歸零再重新計）')
			.addButton((btn) => {
				btn.setButtonText('重置今日').onClick(async () => {
					btn.setDisabled(true);
					await this.plugin.resetTodaySnapshot();
					btn.setDisabled(false);
					new Notice('已重置今日字數基準');
				});
			});

		new Setting(containerEl)
			.setName('重新計算')
			.addButton((btn) => {
				btn.setButtonText('重新計算').onClick(async () => {
					btn.setDisabled(true);
					await this.plugin.recalculateAllTickedDays();
					btn.setDisabled(false);
					new Notice('完成');
				});
			});
	}
}
