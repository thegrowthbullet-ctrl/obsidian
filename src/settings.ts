import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
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

		new Setting(containerEl)
			.setName('設定範例')
			.setDesc('在這裡加入你的插件設定')
			.addText((text) =>
				text
					.setPlaceholder('輸入文字')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
