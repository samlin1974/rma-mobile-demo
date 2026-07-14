# 行動報修 Demo

這是一個純前端的手機報修操作範例，包含：

- 使用後鏡頭掃描 QR Code
- 手機拍照或從相簿選擇，最多三張並可預覽／刪除
- 填寫異常描述與聯絡人
- 前端驗證及模擬產生 RMA 單號

## 啟動

相機 API 只能在 `localhost` 或 HTTPS 安全來源使用。請勿直接雙擊開啟 HTML。

```powershell
python -m http.server 8080
```

然後在電腦開啟 `http://localhost:8080`。若要用手機測試，可部署至 HTTPS 測試環境；同一區域網路的 HTTP IP 網址通常不允許存取相機。

## 技術說明

掃碼優先採用瀏覽器原生 `BarcodeDetector`，不支援時改用 CDN 載入的 `jsQR`。目前送出動作不會上傳資料；正式串接時可將表單欄位與照片組成 `FormData`，POST 到後端 API。
