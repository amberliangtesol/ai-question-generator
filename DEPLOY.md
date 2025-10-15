# 部署指南

## 本地開發

1. 安裝相依套件：
```bash
npm install
```

2. 設定環境變數：
```bash
cp .env.example .env
# 編輯 .env 檔案，填入您的 API 金鑰
```

3. 啟動開發伺服器：
```bash
npm run dev
```

4. 開啟瀏覽器，訪問 `http://localhost:5173`

## 生產部署

### 1. 建構專案
```bash
npm run build
```

### 2. 部署到靜態主機

建構後的檔案會在 `dist/` 目錄中，可以部署到任何靜態主機服務：

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
1. 將 `dist/` 目錄拖拽到 Netlify 部署頁面
2. 或使用 Netlify CLI：
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages
1. 將專案推送到 GitHub
2. 在 Repository Settings 中啟用 GitHub Pages
3. 選擇 `gh-pages` 分支作為來源

### 3. 環境變數設定

在生產環境中設定以下環境變數：
- `VITE_OPENAI_API_KEY`
- `VITE_CLAUDE_API_KEY`

**重要**：確保在生產環境中正確設定 API 金鑰，避免在前端程式碼中暴露敏感資訊。

## 注意事項

1. **CORS 設定**：如果遇到跨域問題，可能需要設定代理伺服器
2. **HTTPS**：建議在生產環境中使用 HTTPS
3. **API 限制**：注意 OpenAI 和 Claude API 的使用限制和計費
4. **檔案上傳**：大型 PDF 檔案可能需要額外的伺服器端處理

## 效能優化

1. **代碼分割**：考慮使用動態導入來減少初始包大小
2. **圖片優化**：壓縮圖片資源
3. **快取策略**：設定適當的快取標頭
4. **CDN**：使用 CDN 加速靜態資源載入