# 🎓 AI智多興出題系統

一個基於Vue 3的智能教育題目生成系統，支援國小中文和英文科目的自動出題功能。

🌐 **線上展示**: https://ai-question-generator-sandy.vercel.app

## 🔐 系統登入

**預設密碼**: `nchuai`

## ✨ 功能特色

- 🔐 **密碼保護**: 系統採用密碼保護機制，確保安全存取
- 🧠 **AI智能出題**: 支援多種題型的自動生成
- 📚 **多科目支援**: 中文(6種題型) + 英文(5種題型)
- 📄 **PDF匯出**: 支援標準考卷格式，包含學生資訊欄位
- 🎯 **練習模式**: 互動式刷題系統，支援即時解答
- 📱 **響應式設計**: 完美適配桌面和行動裝置

## 🎯 支援題型

### 中文科目
- 注音符號
- 語詞應用  
- 成語與俗諺
- 閱讀理解
- 語文常識
- 國學常識與修辭

### 英文科目
- 字母認識
- 發音練習
- 單字應用
- 句型結構
- 閱讀理解

## 🚀 快速開始

### 環境需求
- Node.js 16+
- npm 或 yarn

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <your-repo-url>
   cd ai-question-generator
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設定環境變數**
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案，填入您的 API 金鑰
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

5. **訪問應用**
   開啟瀏覽器前往 `http://localhost:5173`
   
   預設密碼: `nchuai`

## 📦 部署到 Vercel

1. **連接 GitHub**: 將專案推送到 GitHub
2. **導入 Vercel**: 在 Vercel 儀表板導入專案
3. **設定環境變數**: 在 Vercel 設定面板添加環境變數
4. **自動部署**: 每次推送代碼將自動觸發部署

### Vercel 環境變數設定
```
VITE_OPENAI_API_KEY=your_openai_key
VITE_CLAUDE_API_KEY=your_claude_key
```

## 技術架構

### 前端技術
- **Vue 3**：使用 Composition API 和 Script Setup
- **Vite**：快速的建構工具
- **Vue Router**：路由管理
- **Pinia**：狀態管理
- **純 CSS**：響應式設計，無框架依賴

### API 整合
- **OpenAI API**：主要的題目生成服務
- **Claude API**：備用生成服務 + PDF OCR 功能

### 檔案處理
- **jsPDF**：PDF 生成
- **PDF.js**：PDF 轉圖片處理
- **Claude Vision API**：圖片文字識別
- **File API**：檔案上傳處理

## 安裝與設定

### 1. 安裝相依套件
```bash
npm install
```

### 2. 環境變數設定
複製 `.env.example` 到 `.env` 並填入你的 API 金鑰：

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_CLAUDE_BASE_URL=https://api.anthropic.com/v1
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

**重要：** 如果您要使用真實API，請確保重新啟動開發伺服器以啟用CORS代理設定。

### 4. 建構生產版本
```bash
npm run build
```

## 使用說明

### 出題模式
1. 選擇年段（國小4-6年級）
2. 選擇科目（國文/英文）
3. 輸入關聯規則（選填）
4. 選擇題型與設定題數
5. 上傳參考 PDF 檔案（選填）
6. 點擊「開始出題」生成題目

### 刷題模式
1. 在出題模式生成題目後，點擊「開始刷題」
2. 依序回答每道題目
3. 可隨時查看答題進度
4. 完成後查看詳細成績與解析

### 下載功能
- **PDF 版本**：適合列印的完整考卷
- **文字版本**：便於編輯的純文字格式

## 專案結構

```
src/
├── components/          # Vue 組件
│   ├── GradeSelector.vue
│   ├── SubjectSelector.vue
│   ├── QuestionTypeSelector.vue
│   ├── FileUpload.vue
│   └── GeneratedQuestions.vue
├── views/              # 頁面組件
│   ├── QuestionGenerator.vue
│   └── PracticeMode.vue
├── services/           # 服務層
│   ├── apiService.js
│   ├── questionGeneratorService.js
│   └── examPaperService.js
├── stores/             # 狀態管理
│   └── questionStore.js
└── router/             # 路由設定
    └── index.js
```

## API 說明

### OpenAI API
- 用於主要的題目生成
- 支援 GPT-4 模型
- 需要有效的 OpenAI API 金鑰

### Claude API
- 備用題目生成服務
- PDF 文字提取 (OCR)
- 支援 Claude-3-Haiku 模型

## 開發模式

系統直接使用真實的 AI API 進行題目生成：

- **智慧出題**：整合 OpenAI GPT-4 和 Claude API
- **PDF OCR**：PDF 轉圖片後使用 Claude Vision 進行文字識別
- **即時處理**：所有功能都是即時處理，無模擬數據

## 注意事項

- 請確保 API 金鑰的安全性，不要提交到版本控制
- PDF 檔案大小限制為 10MB
- 中文字體在 PDF 生成時可能需要額外處理
- 建議在生產環境中使用 HTTPS

## CORS 問題解決

如果遇到 API 調用被 CORS 阻止的問題：

1. **開發環境**：重新啟動開發伺服器 (`npm run dev`)
2. **測試功能**：可以取消勾選「使用真實API」來使用模擬數據
3. **生產環境**：需要建立後端 API 服務作為代理

詳細解決方案請參考 `CORS_SOLUTION.md` 文件。

## 未來改進

- [ ] 支援更多題型
- [ ] 加入題目難度分級
- [ ] 提供更多科目選擇
- [ ] 優化中文 PDF 顯示
- [ ] 加入用戶帳戶系統
- [ ] 題目庫功能
- [ ] 學習進度追蹤

## 授權

本專案採用 MIT 授權條款。
