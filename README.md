# AI 出題與刷題工具

一個使用 Vue 3 + Vite 開發的智慧出題與刷題系統，支援國小4-6年級的國文與英文科目。

## 功能特色

### 🎯 智慧出題系統
- **年段選擇**：支援國小四年級到六年級
- **科目選擇**：國文、英文兩大科目
- **題型多樣**：
  - 國文：字音字形辨別、詞語情境應用、成語情境應用、句意分析、文意推論等
  - 英文：文法句型、閱讀填空、閱讀理解等
- **客製化規則**：可輸入特定的出題要求和關聯規則
- **AI 驅動**：整合 OpenAI 和 Claude API 進行智慧出題

### 📄 PDF 文件處理
- **檔案上傳**：支援 PDF 檔案拖拽上傳
- **PDF轉圖片**：自動將 PDF 轉換為高品質圖片
- **AI OCR 識別**：使用 Claude Vision API 進行智慧文字識別
- **參考資料**：提取的文字可作為出題參考依據

### 🏃‍♂️ 互動刷題模式
- **即時作答**：支援線上刷題練習
- **進度追蹤**：即時顯示答題進度
- **詳細解析**：每題都有詳細的答案解析
- **成績統計**：完成後顯示詳細成績報告

### 📥 多格式下載
- **PDF 考卷**：生成專業的考卷 PDF 檔案
- **文字版本**：純文字格式便於編輯
- **答案分離**：考卷與解答分開，便於教學使用

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
