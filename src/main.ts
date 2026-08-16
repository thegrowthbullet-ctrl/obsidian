import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from './settings';

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// 左側欄圖示
		this.addRibbonIcon('dice', '我的插件', () => {
			new Notice('插件已啟動！');
		});

		// 命令面板指令
		this.addCommand({
			id: 'hello-world',
			name: 'Hello World',
			callback: () => {
				new Notice(`Hello! 設定值：${this.settings.mySetting}`);
			},
		});

		// 編輯器指令（只對當前編輯器生效）
		this.addCommand({
			id: 'insert-timestamp',
			name: '插入時間戳',
			editorCallback: (editor: Editor) => {
				const stamp = new Date().toLocaleString();
				editor.replaceSelection(stamp);
			},
		});

		// 條件指令（只在 Markdown 編輯器開啟時可用）
		this.addCommand({
			id: 'word-count',
			name: '顯示字數',
			checkCallback: (checking) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return false;
				if (!checking) {
					const text = view.editor.getValue();
					new Notice(`字數：${text.length}`);
				}
				return true;
			},
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
		// 插件停用時的清理（如有需要）
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
