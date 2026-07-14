# 行動報修 Demo

手機優先的設備報修介面，提供 QR Code 掃描、拍照、異常原因、Email、中英文介面及報修紀錄瀏覽。

## 儲存模式

- GitHub Pages 公開版：紀錄以 JSON 結構儲存在目前瀏覽器的 `localStorage`，同一瀏覽器可在「瀏覽紀錄」頁查看。
- Node 本機版：除了瀏覽器紀錄，也會透過 `POST /api/records` 將每筆 JSON 寫入 `records/` 目錄。

GitHub Pages 是靜態主機，無法直接寫入伺服器檔案。正式上線若需跨裝置、多人共用紀錄，應將 `/api/records` 接到資料庫或物件儲存服務。

## 啟動可寫檔版本

需要 Node.js 18 或更新版本：

```powershell
node server.js
```

開啟 `http://localhost:8080`。相機 API 可在 `localhost` 或 HTTPS 使用。

## 語系

瀏覽器語系以 `zh` 開頭時顯示繁體中文，其餘語系一律顯示英文。
