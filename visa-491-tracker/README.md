# 澳洲 491 簽證申請指南

一步步完成澳洲 Skilled Work Regional (Provisional) 491 簽證申請嘅個人規劃工具。

## 功能

- **12 步申請指南**：由確認途徑到簽證獲批，每步有詳細任務清單
- **進度追蹤**：自動儲存喺瀏覽器（localStorage），下次打開繼續
- **同配偶同步**：匯出 / 匯入 JSON 進度檔，兩人共用同一份申請進度
- **移民分數計算器**：即時計算你嘅 EOI 分數
- **文件準備清單**：按類別列出所有需要準備嘅文件
- **州份選擇參考**：8 個州/領地提名資訊同官方連結
- **191 永居路徑**：491 獲批後點樣轉永居

## 部署上網（推薦：GitHub Pages）

呢個 repo 已經包含自動部署設定。跟住做就可以有公開網址，你同配偶都可以隨時打開用。

### 第一步：合併 PR 到 main

將 `cursor/visa-491-tracker-4840` 分支合併到 `main`（或者等 PR merge）。

### 第二步：開啟 GitHub Pages

1. 去 GitHub repo：`https://github.com/thegrowthbullet-ctrl/obsidian`
2. 點 **Settings** → 左邊 **Pages**
3. **Build and deployment** → Source 選 **GitHub Actions**
4. 儲存設定

### 第三步：等部署完成

- Push 到 `main` 之後，GitHub Actions 會自動部署
- 去 **Actions** 頁面睇 `Deploy 491 Visa Tracker` workflow 係咪成功
- 成功後網址通常係：

```
https://thegrowthbullet-ctrl.github.io/obsidian/
```

### 第四步：分享俾配偶

- 將上面個網址傳俾配偶（WhatsApp / iMessage 都得）
- 手機、電腦、平板都可以打開，唔使安裝 app

## 同配偶共用進度

進度預設儲存喺各自瀏覽器，唔會自動雲端同步。建議咁做：

1. 你更新咗進度之後，撳 **「匯出進度」**
2. 將下載嘅 `491-visa-progress-YYYY-MM-DD.json` 傳俾配偶
3. 配偶打開網站，撳 **「匯入進度」**，揀返個檔案
4. 之後兩邊進度就一致

**建議習慣**：每次有人更新任務或備註，就匯出一次傳俾對方，保持同步。

## 本地測試

```bash
cd visa-491-tracker
python3 -m http.server 8080
# 打開 http://localhost:8080
```

## 其他部署方式（可選）

| 平台 | 做法 |
|------|------|
| **Netlify** | 拖放 `visa-491-tracker` 資料夾去 [netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel** | Import repo，Publish directory 設為 `visa-491-tracker` |
| **Cloudflare Pages** | Connect repo，Build output 設為 `visa-491-tracker` |

## 免責聲明

本工具僅供個人規劃參考，唔構成法律或移民建議。申請前請以 [澳洲內政部官方網站](https://immi.homeaffairs.gov.au) 最新資訊為準，或諮詢註冊移民代理（MARA）。

## 技術

純靜態網站（HTML + CSS + JavaScript），無需 build，可部署到 GitHub Pages、Netlify 或任何靜態 hosting。
