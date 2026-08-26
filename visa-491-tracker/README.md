# 澳洲 491 簽證申請指南

一步步完成澳洲 Skilled Work Regional (Provisional) 491 簽證申請嘅個人規劃工具。

## 功能

- **12 步申請指南**：由確認途徑到簽證獲批，每步有詳細任務清單
- **進度追蹤**：自動儲存喺瀏覽器（localStorage），下次打開繼續
- **移民分數計算器**：即時計算你嘅 EOI 分數
- **文件準備清單**：按類別列出所有需要準備嘅文件
- **州份選擇參考**：8 個州/領地提名資訊同官方連結
- **191 永居路徑**：491 獲批後點樣轉永居

## 使用方法

直接用瀏覽器打開 `index.html` 就得，唔需要安裝任何嘢。

```bash
# 或者用簡單 HTTP server
cd visa-491-tracker
python3 -m http.server 8080
# 然後打開 http://localhost:8080
```

## 免責聲明

本工具僅供個人規劃參考，唔構成法律或移民建議。申請前請以 [澳洲內政部官方網站](https://immi.homeaffairs.gov.au) 最新資訊為準，或諮詢註冊移民代理（MARA）。

## 技術

純靜態網站（HTML + CSS + JavaScript），無需 build，可部署到 GitHub Pages、Netlify 或任何靜態 hosting。
