# Daily Word Tracker

Obsidian 插件：每月日曆格剔選追蹤寫作字數，附累積 scoreboard 與資料夾篩選。

## 功能

- **每日一格**：月曆格可剔選，表示完成該日追蹤
- **自動計字**：剔選時計算該日字數（統計當日有修改的筆記）
- **累積 Scoreboard**：由本月第 1 格起，按日期累積已剔日子的字數
- **資料夾篩選**：設定 include / exclude folders

## 字數計算方式

剔選某日時，會掃描 vault 內符合資料夾條件的 Markdown 筆記，找出**最後修改時間落在該日**的檔案，加總其內容字數：

- 每個中文字 = 1 字
- 每個英文單詞 = 1 字
- 會略過 frontmatter、code block 等

> 注意：若你修改了舊筆記，該檔案的**全部字數**會計入修改當日，而非只有新增部分。

## 快速開始

```bash
npm install
npm run dev
```

放到 `vault/.obsidian/plugins/my-obsidian-plugin/`，在 Obsidian 啟用插件。

- 點左側欄 **calendar-check** 圖示，或命令面板 →「開啟每日字數追蹤」
- **設定 → 插件選項** 可設定 include/exclude folders

## Include / Exclude 設定

| 設定 | 說明 |
|------|------|
| Include folders | 留空 = 整個 vault；填寫則只計指定資料夾（每行一個，如 `Daily`） |
| Exclude folders | 排除資料夾及其子資料夾（如 `Templates`） |

改完篩選後，可用「重新計算已剔日子」更新歷史數字。

## 開發

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發模式（自動編譯） |
| `npm run build` | 正式建置 |

完整插件開發教學見 [GUIDE.md](./GUIDE.md)。

## 主要檔案

| 檔案 | 說明 |
|------|------|
| `src/main.ts` | 插件入口 |
| `src/dailyTrackerView.ts` | 月曆格 + scoreboard UI |
| `src/wordCount.ts` | 字數計算 |
| `src/folderFilter.ts` | 資料夾篩選 |
| `src/settings.ts` | 設定頁 |
