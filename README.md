# My Obsidian Plugin

Obsidian 插件開發骨架 — 含可運行的範例與中文逐步指南。

## 快速開始

```bash
npm install
npm run dev
```

把本目錄放到你的開發 vault：

`vault/.obsidian/plugins/my-obsidian-plugin/`

然後在 Obsidian：**設定 → 第三方插件 → 關閉安全模式 → 啟用本插件**。

## 完整教學

請閱讀 **[GUIDE.md](./GUIDE.md)** — 含環境準備、專案結構、API 說明、除錯與發佈流程。

## 檔案說明

| 檔案 | 說明 |
|------|------|
| `src/main.ts` | 插件入口，從這裡改 |
| `src/settings.ts` | 設定頁 |
| `manifest.json` | 插件 id 與元資料 |

## 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發模式（自動編譯） |
| `npm run build` | 正式建置 |
