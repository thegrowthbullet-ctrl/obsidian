import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
	includeFolders: string;
	excludeFolders: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	includeFolders: '',
	excludeFolders: '',
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

		containerEl.createEl('h3', { text: '資料夾篩選' });
		containerEl.createEl('p', {
			text: 'include 留空 = 計算整個 vault。exclude 會排除指定資料夾（及其子資料夾）。',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName('Include folders')
			.setDesc('只計算這些資料夾內的筆記。每行一個路徑，例如 Daily 或 Journal/2026')
			.addTextArea((text) => {
				text
					.setPlaceholder('Daily\nJournal')
					.setValue(this.plugin.settings.includeFolders)
					.onChange(async (value) => {
						this.plugin.settings.includeFolders = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
				text.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName('Exclude folders')
			.setDesc('排除這些資料夾內的筆記。每行一個路徑，例如 Templates 或 Archive')
			.addTextArea((text) => {
				text
					.setPlaceholder('Templates\nArchive')
					.setValue(this.plugin.settings.excludeFolders)
					.onChange(async (value) => {
						this.plugin.settings.excludeFolders = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
				text.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName('重新計算已剔日子')
			.setDesc(
				'依目前 include/exclude 設定，重新計算所有已剔選日子的字數',
			)
			.addButton((btn) => {
				btn.setButtonText('重新計算').onClick(async () => {
					btn.setDisabled(true);
					await this.plugin.recalculateAllTickedDays();
					btn.setDisabled(false);
					new Notice('已重新計算所有已剔日子的字數');
				});
			});
	}
}
