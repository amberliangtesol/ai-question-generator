# CORS 問題解決方案

## 問題說明

瀏覽器的 CORS（跨域資源共用）政策阻止了直接從前端呼叫 OpenAI 和 Claude API。這是因為：

1. 這些 API 不允許直接從瀏覽器端呼叫（安全考量）
2. API 金鑰不應該暴露在前端程式碼中
3. 瀏覽器會阻止跨域請求
4. Claude API 特別要求設置 `anthropic-dangerous-direct-browser-access` header

## 解決方案

### 方案 1：開發環境 - Vite 代理伺服器（已實作）

我們已經配置了 Vite 代理伺服器來解決開發環境的 CORS 問題：

**配置檔案：`vite.config.js`**

- `/api/openai/*` 代理到 `https://api.openai.com/v1/*`
- `/api/claude/*` 代理到 `https://api.anthropic.com/v1/*`

**優點：**

- 適合開發環境
- 無需額外設定
- API 金鑰安全存放在環境變數中

**限制：**

- 僅適用於開發環境
- 生產環境需要其他解決方案

### 方案 2：生產環境 - 後端 API 服務

對於生產環境，建議建立後端 API 服務：

#### 選項 A：Node.js/Express 後端

創建一個簡單的 Express 伺服器：

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// OpenAI代理端點
app.post('/api/openai/chat/completions', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claude代理端點
app.post('/api/claude/messages', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      req.body,
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

#### 選項 B：Vercel/Netlify Functions

使用無伺服器函數：

```javascript
// api/openai.js (Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 方案 3：使用模擬數據（目前可用）

為了立即測試應用程式，您可以：

1. 在出題介面取消勾選「使用真實 API」
2. 系統會使用內建的模擬題目數據
3. 所有功能都可以正常運作

## 當前狀態

- ✅ 開發環境代理設定完成
- ✅ 模擬數據模式可用
- ✅ OpenAI + Claude 雙重備援機制已實作
- ✅ 題目生成：OpenAI 優先，Claude 備援
- ✅ PDF OCR：OpenAI Vision 優先，Claude Vision 備援
- ⚠️ 生產環境需要後端 API

## 使用步驟

### 開發環境測試真實 API

1. 確保 `.env` 檔案中有正確的 API 金鑰
2. 重新啟動開發伺服器：
   ```bash
   npm run dev
   ```
3. 在應用程式中勾選「使用真實 API」
4. 開始出題測試

### 使用模擬數據

1. 在出題介面取消勾選「使用真實 API」
2. 選擇年段、科目、題型
3. 點擊「開始出題」
4. 享受完整的應用程式功能

## PDF OCR 功能說明

目前的 PDF OCR 功能已完整實作：

1. **PDF.js 轉換**：使用 PDF.js 將 PDF 轉換為高品質圖片
2. **Claude Vision API**：使用 Claude 的圖片識別能力進行 OCR
3. **批次處理**：支援多頁 PDF 的逐頁處理
4. **進度追蹤**：提供詳細的處理進度反饋

### 技術實作：

- **PDF → 圖片**：PDF.js 渲染為 Canvas，轉換為 JPEG
- **圖片 → 文字**：Claude Vision API 進行文字識別
- **結果合併**：將多頁結果合併為完整文本
- **錯誤處理**：完善的錯誤處理和用戶提示

## Claude 餘額不足解決方案

我已經實作了完整的備援機制來解決 Claude API 餘額不足的問題：

### 題目生成備援機制
1. **優先使用 OpenAI GPT-4** 進行題目生成
2. **若 OpenAI 失敗，自動切換到 Claude** 作為備援
3. **智能錯誤處理**：特別識別餘額不足錯誤並提供明確提示

### PDF OCR 備援機制
1. **優先使用 OpenAI Vision (gpt-4o)** 進行圖片文字識別
2. **若 OpenAI 失敗，自動切換到 Claude Vision** 作為備援
3. **完整錯誤處理**：包含餘額不足、網路錯誤等各種情況

### 實作位置
- **題目生成服務**：`src/services/questionGeneratorService.js`
- **OCR 服務**：`src/services/apiService.js` (新增 OpenAI Vision 功能)
- **檔案上傳組件**：`src/components/FileUpload.vue` (更新為雙重備援)

### 現在可以正常使用的功能
✅ 即使 Claude 餘額不足，所有功能都能正常運作
✅ 題目生成會使用 OpenAI，提供同樣高品質的結果
✅ PDF OCR 會使用 OpenAI Vision，識別效果優異
✅ 詳細的錯誤訊息和進度追蹤

## 安全注意事項

- ❌ 絕對不要在前端程式碼中直接使用 API 金鑰
- ✅ 使用環境變數存放敏感資訊
- ✅ 在生產環境使用後端 API 作為代理
- ✅ 限制 API 使用量避免超額費用
- ✅ 實作雙重備援機制確保服務穩定性
- ⚠️ Claude API 需要特殊 header `anthropic-dangerous-direct-browser-access`
