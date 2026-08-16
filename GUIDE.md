# Obsidian 插件開發 — 逐步指南

本 repo 已包含一個可運行的插件骨架。跟著下面步驟，由零到能在 Obsidian 裡載入你的插件。

官方文件：[Build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

---

## 總覽：開發流程

```mermaid
flowchart LR
    A[準備環境] --> B[建立/複製專案]
    B --> C[npm install]
    C --> D[npm run dev]
    D --> E[放到 vault plugins 目錄]
    E --> F[Obsidian 啟用插件]
    F --> G[改 code → 自動編譯 → 重載測試]
    G --> H[npm run build 發佈]
```

---

## 步驟 0：前置準備

| 工具 | 用途 | 檢查方式 |
|------|------|----------|
| Node.js 18+ | 編譯 TypeScript | `node -v` |
| npm | 安裝依賴 | `npm -v` |
| Git | 版本控制（可選） | `git -v` |
| Obsidian | 測試插件 | 桌面版 |

**重要：** 不要用你的主要筆記 vault 開發插件。請建立一個**空的開發用 vault**，避免誤改筆記。

---

## 步驟 1：專案放哪裡？

Obsidian 會掃描每個 vault 下的：

```
你的-vault/
  .obsidian/
    plugins/
      my-obsidian-plugin/    ← 插件資料夾（id 要同 manifest.json）
        manifest.json        ← 必須
        main.js              ← 編譯產物（必須）
        styles.css           ← 若有樣式（可選）
```

**做法 A（推薦）：** 把本 repo clone 到 `vault/.obsidian/plugins/my-obsidian-plugin`

```bash
cd /path/to/your-dev-vault
mkdir -p .obsidian/plugins
cd .obsidian/plugins
git clone <你的-repo-url> my-obsidian-plugin
```

**做法 B：** 在本機任意目錄開發，用 symlink 指到 plugins 目錄。

---

## 步驟 2：安裝依賴與編譯

在插件根目錄執行：

```bash
npm install
npm run dev
```

- `npm run dev`：watch 模式，改 `src/*.ts` 會自動產生 `main.js`
- `npm run build`：正式建置（壓縮、型別檢查）

第一次成功後，目錄裡應出現 `main.js`。

---

## 步驟 3：在 Obsidian 啟用

1. 開啟開發用 vault
2. **設定 → 第三方插件 → 關閉安全模式**
3. **已安裝插件 → 重新載入**（或重開 Obsidian）
4. 在列表找到 **My Obsidian Plugin** 並啟用

### 測試骨架功能

| 操作 | 預期結果 |
|------|----------|
| 點左側欄骰子圖示 | 顯示 Notice「插件已啟動！」 |
| 命令面板 → Hello World | 顯示設定值 |
| 命令面板 → 插入時間戳 | 在游標處插入時間 |
| 在筆記編輯器 → 顯示字數 | 顯示當前字數 |
| 設定 → 插件設定 | 可改「設定範例」文字 |

---

## 步驟 4：專案結構說明

```
.
├── manifest.json      # 插件元資料（id、名稱、版本）— Obsidian 讀這個找插件
├── versions.json      # 版本與最低 Obsidian 版本對應（發佈用）
├── package.json       # npm 腳本與 devDependencies
├── esbuild.config.mjs # TypeScript → main.js 的建置設定
├── tsconfig.json      # TypeScript 設定
├── src/
│   ├── main.ts        # 入口：繼承 Plugin，實作 onload / onunload
│   └── settings.ts    # 設定介面與設定頁
└── main.js            # 編譯產物（不要手改）
```

### `manifest.json` 關鍵欄位

```json
{
  "id": "my-obsidian-plugin",     // 資料夾名稱要一致
  "name": "My Obsidian Plugin",   // 設定頁顯示名稱
  "version": "0.1.0",
  "minAppVersion": "1.0.0"
}
```

改 `id` 時，記得同步改資料夾名稱。

---

## 步驟 5：核心 API — 從 `main.ts` 開始

插件生命週期：

```typescript
export default class MyPlugin extends Plugin {
  async onload() {
    // 插件啟用時執行 — 註冊指令、UI、事件
  }

  onunload() {
    // 插件停用時執行 — 清理（多數用 register* 會自動清理）
  }
}
```

### 常用能力（骨架裡都有範例）

| API | 用途 | 骨架位置 |
|-----|------|----------|
| `this.addCommand()` | 命令面板指令 | `main.ts` |
| `this.addRibbonIcon()` | 左側欄圖示 | `main.ts` |
| `this.addSettingTab()` | 設定頁 | `settings.ts` |
| `this.loadData()` / `saveData()` | 持久化設定 | `main.ts` |
| `new Notice()` | 右下角提示 | `main.ts` |
| `this.app.workspace` | 視窗、編輯器、檔案 | `main.ts` |
| `this.registerDomEvent()` | DOM 事件（自動清理） | 見官方 sample |
| `this.registerInterval()` | 定時器（自動清理） | 見官方 sample |

### `this.app` 常用物件

- `app.vault` — 讀寫 vault 內檔案
- `app.workspace` — 開啟筆記、取得當前編輯器
- `app.metadataCache` — 讀取 frontmatter、連結

更多 API：[Obsidian API 文件](https://docs.obsidian.md/Reference/TypeScript+API/Plugin)

---

## 步驟 6：建議的開發順序（你做新功能時）

按這個順序加功能，每一步都能單獨測試：

1. **改 `manifest.json`** — 名稱、描述、id
2. **加一條 `addCommand`** — 最簡單的驗證路徑
3. **加設定** — 在 `settings.ts` 擴充 interface，設定頁加 `Setting`
4. **讀寫 vault** — `app.vault.read` / `app.vault.modify`
5. **UI 進階** — `Modal`、`SuggestModal`、自訂 view
6. **樣式** — 新增 `styles.css`，在 `onload` 用 `loadCSS` 或讓 Obsidian 自動載入同目錄的 `styles.css`

---

## 步驟 7：除錯與熱重載

### 開發者工具

- **Ctrl+Shift+I**（Mac：Cmd+Option+I）開啟 DevTools
- Console 看 `console.log` 與錯誤

### 重載插件

改 code 後：

1. 確認 `npm run dev` 仍在跑且已更新 `main.js`
2. **設定 → 第三方插件 → 重新載入**（或 Cmd+R 重載整個 app）

### Hot-Reload（可選）

在社群插件安裝 [Hot-Reload](https://github.com/pjeby/hot-reload)，改 `main.js` 後自動重載，省掉手動步驟。

---

## 步驟 8：發佈（之後再做）

1. `npm run build` 產生正式版 `main.js`
2. 在 GitHub 建立 **Release**，tag 用版本號（例如 `0.1.0`）
3. 上傳 `manifest.json`、`main.js`、`styles.css`（如有）
4. 更新 `versions.json`
5. 若要上架社群插件：讀 [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)，再向 [obsidian-releases](https://github.com/obsidianmd/obsidian-releases) 提 PR

---

## 下一步：你想做什麼插件？

把想法拆成上面「步驟 6」的層級，從 `addCommand` 開始迭代。常見類型：

| 類型 | 起點 API |
|------|----------|
| 快捷指令 / 文字處理 | `addCommand` + `editorCallback` |
| 自動化 / 定時任務 | `registerInterval` + `vault` |
| 新面板 / 側欄 | `addRibbonIcon` + `ItemView` |
| 讀取筆記資料 | `metadataCache` + `vault` |
| 設定豐富的插件 | `PluginSettingTab` + `loadData` |

---

## 參考連結

- [官方：Build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [官方 Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [TypeScript API 參考](https://docs.obsidian.md/Reference/TypeScript+API/Plugin)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
