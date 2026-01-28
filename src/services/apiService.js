import axios from 'axios';

// OpenAI API Service
export class OpenAIService {
  constructor() {
    // 在開發環境使用代理，生產環境需要後端API
    this.baseURL = import.meta.env.DEV
      ? '/api/openai'
      : import.meta.env.VITE_OPENAI_BASE_URL;
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
    };

    // 只在生產環境或非代理模式下添加Authorization header
    if (!import.meta.env.DEV) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers,
    });
  }

  async generateQuestions(prompt) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '你是一位熟悉 台灣 108 課綱國語文領域 的國小國文老師，請設計題目來診斷學生是否掌握以下基礎概念。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      return response.data;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      console.log('上傳文件到 OpenAI Files API...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'user_data');

      const response = await this.client.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('文件上傳成功:', response.data);
      return response.data.id;
    } catch (error) {
      console.error('OpenAI 文件上傳錯誤:', error);
      throw error;
    }
  }

  async extractTextFromFile(fileId) {
    try {
      console.log('使用 GPT 分析 PDF 文件內容...');

      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'file',
                file: {
                  file_id: fileId,
                },
              },
              {
                type: 'text',
                text: '請幫我提取這個PDF文件中的所有文字內容。請保持原文的結構和格式，如果是表格請用適當的格式呈現。請完整地提取所有可讀的文字內容。',
              },
            ],
          },
        ],
      });

      if (
        response.data &&
        response.data.choices &&
        response.data.choices[0] &&
        response.data.choices[0].message
      ) {
        return response.data.choices[0].message.content;
      }

      return null;
    } catch (error) {
      console.error('OpenAI 文件分析錯誤:', error);
      throw error;
    }
  }
}

// Claude API Service
export class ClaudeService {
  constructor() {
    // 在開發環境使用代理，生產環境需要後端API
    this.baseURL = import.meta.env.DEV
      ? '/api/claude'
      : import.meta.env.VITE_CLAUDE_BASE_URL;
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
    };

    // 只在生產環境或非代理模式下添加API headers
    if (!import.meta.env.DEV) {
      headers['x-api-key'] = this.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers,
    });
  }

  async generateQuestions(prompt) {
    try {
      const response = await this.client.post('/v1/messages', {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      return response.data;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }

  async extractTextFromImages(images) {
    try {
      console.log(`開始使用Claude處理${images.length}張圖片...`);

      const allText = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`處理第${image.pageNumber}頁...`);

        try {
          const response = await this.client.post('/v1/messages', {
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: '請幫我提取這張圖片中的所有文字內容。請保持原文的結構和格式，如果是表格請用適當的格式呈現。如果圖片中沒有文字，請回答「此頁面沒有可辨識的文字內容」。',
                  },
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'mimeType',
                      data: image.base64,
                    },
                  },
                ],
              },
            ],
          });

          if (
            response.data &&
            response.data.content &&
            response.data.content[0]
          ) {
            const pageText = response.data.content[0].text;
            allText.push(`=== 第${image.pageNumber}頁 ===\n${pageText}\n`);
            console.log(`第${image.pageNumber}頁處理完成`);
          }
        } catch (pageError) {
          console.error(`處理第${image.pageNumber}頁失敗:`, pageError);
          allText.push(`=== 第${image.pageNumber}頁 ===\n[此頁面處理失敗]\n`);
        }

        // 添加延遲避免API限制
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const combinedText = allText.join('\n');
      console.log('所有頁面處理完成');

      return {
        content: [
          {
            text: combinedText,
          },
        ],
      };
    } catch (error) {
      console.error('Claude圖片OCR錯誤:', error);
      throw error;
    }
  }
}
