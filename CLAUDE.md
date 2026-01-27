# AI智多興出題系統 - Claude Code 開發指南

## 專案概述
這是一個基於 Vue 3 的AI智能出題系統，支援國小中文和英文題目生成，包含題目預覽、PDF匯出和練習模式等功能。

## 技術架構
- **前端框架**: Vue 3 (Composition API + script setup)
- **狀態管理**: Pinia
- **路由**: Vue Router
- **建構工具**: Vite
- **PDF生成**: html2canvas + jsPDF
- **樣式**: CSS3 + Scoped Styles

## 核心功能模組

### 1. 密碼認證系統
- **檔案**: `src/components/PasswordLogin.vue`, `src/App.vue`
- **密碼**: `nchuai`
- **功能**: localStorage儲存認證狀態，支援密碼顯示/隱藏切換

### 2. 題目生成服務
- **檔案**: `src/services/questionGeneratorService.js`
- **支援科目**: 中文（國小一至六年級）
- **中文題型**: 字音字形辨別、詞語情境應用克漏字、成語情境應用、句意分析與重組、國學常識與修辭、文意推論與摘要選擇題
- **功能特色**:
  - 支援前測/後測分離生成
  - 題目與關聯規則ID對應
  - 依據選中規則自動分配題目

### 3. PDF匯出系統
- **檔案**: `src/services/examPaperService.js`
- **功能**: 
  - 支援中文字體正確顯示
  - 題目與解答分頁處理
  - 標準考卷格式（班級、姓名、座號欄位）
  - PDF預覽與下載

### 4. 練習模式
- **檔案**: `src/views/PracticeMode.vue`
- **功能**: 
  - 逐題練習
  - 即時解答顯示
  - 自動滾動到頂部
  - 儲存學生作答記錄（前測/後測分離）
  - 簡化學生識別（學生1、學生2...）

### 5. 作答分析系統
- **檔案**: `src/views/AnswerAnalysis.vue`
- **功能**:
  - 顯示選中的關聯規則詳細內容
  - 分析前測與後測的對應關係
  - 計算每個規則的學生通過率
  - 顯示信心度統計

## 開發命令

### 啟動開發伺服器
```bash
npm run dev
```

### 建構生產版本
```bash
npm run build
```

### 預覽生產版本
```bash
npm run preview
```

## 重要開發規範

### 1. 滾動行為
所有頁面切換和重要操作後都需要滾動到頂部：
```javascript
window.scrollTo({
  top: 0,
  behavior: 'smooth'
});
```

### 2. PDF生成
- 使用 html2canvas + jsPDF 確保中文字體正確顯示
- 題目與解答必須分頁處理
- 移除所有漸變背景樣式以符合紙本格式

### 3. 響應式設計
- 手機端優先設計
- 使用 `@media (max-width: 768px)` 斷點
- 按鈕和表單元素需要適當的觸碰區域

### 4. 狀態管理
使用 Pinia store (`src/stores/questionStore.js`) 管理：
- 當前選擇的科目和年級
- 生成的題目列表
- 題目類型設定

## 檔案結構
```
src/
├── components/          # 可重用元件
│   ├── PasswordLogin.vue
│   ├── GeneratedQuestions.vue
│   └── QuestionTypeSelector.vue
├── views/              # 頁面元件
│   ├── QuestionGenerator.vue
│   └── PracticeMode.vue
├── services/           # 業務邏輯服務
│   ├── questionGeneratorService.js
│   └── examPaperService.js
├── stores/             # Pinia 狀態管理
│   └── questionStore.js
└── router/             # 路由設定
    └── index.js
```

## 近期更新記錄
- ✅ 新增密碼保護功能（密碼：nchuai）
- ✅ 新增密碼顯示/隱藏切換
- ✅ 登入後自動滾動到頂部
- ✅ 新增「國學常識與修辭」題型
- ✅ 優化PDF生成支援中文字體
- ✅ 改善練習模式使用者體驗
- ✅ 統一所有頁面滾動行為
- ✅ 實作前後測題目分離生成功能
- ✅ 新增作答分析頁面（前後測對應分析）
- ✅ 修正題目與規則ID的對應關係
- ✅ 優化關聯規則顯示（支援 aImplication/bImplication 屬性）
- ✅ 簡化學生識別方式（移除姓名座號欄位）
- ✅ 固定科目為中文（移除科目選擇器）

## 注意事項
1. 所有新功能開發都要考慮手機端體驗
2. PDF生成功能需要測試中文字體顯示
3. 保持程式碼風格一致性（使用 script setup 語法）
4. 重要操作後記得添加滾動到頂部的行為