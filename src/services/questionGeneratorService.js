import { OpenAIService } from './apiService.js';
import wordsData from '../../words.json';

export class QuestionGeneratorService {
  constructor() {
    this.openaiService = new OpenAIService();
  }

  async generateQuestions(options) {
    const {
      grade,
      subject,
      associationRules,
      questionTypes,
      extractedText,
      selectedRules,
    } = options;

    try {
      // 檢查是否有前後測分離的提示語
      const hasAntecedentPrompt =
        associationRules?.includes('【前項困難診斷題目】');
      const hasConsequentPrompt =
        associationRules?.includes('【後項困難補強題目】');

      if (hasAntecedentPrompt && hasConsequentPrompt) {
        // 分別生成前測和後測題目
        console.log('分別生成前測和後測題目...');
        console.log('選中的規則數量:', selectedRules?.length || 0);

        // 分離前後測提示語
        const [antecedentPrompt, consequentPrompt] =
          associationRules.split('--- 分隔線 ---');

        // 生成前測題目 - 前測題目對應前項困難
        const preTestPrompt = this.buildPrompt(
          grade,
          subject,
          antecedentPrompt,
          questionTypes,
          extractedText,
          'pretest',
        );

        console.log('生成前測題目...');
        const preTestResponse =
          await this.openaiService.generateQuestions(preTestPrompt);
        const preTestQuestions = this.parseQuestionsWithRules(
          preTestResponse.choices[0].message.content,
          'pretest',
          selectedRules,
          questionTypes,
          'antecedent', // 標記為前測，對應前項困難
        );

        // 生成後測題目 - 後測題目對應後項困難
        const postTestPrompt = this.buildPrompt(
          grade,
          subject,
          consequentPrompt,
          questionTypes,
          extractedText,
          'posttest',
        );

        console.log('生成後測題目...');
        const postTestResponse =
          await this.openaiService.generateQuestions(postTestPrompt);
        const postTestQuestions = this.parseQuestionsWithRules(
          postTestResponse.choices[0].message.content,
          'posttest',
          selectedRules,
          questionTypes,
          'consequent', // 標記為後測，對應後項困難
        );

        // 合併題目並返回
        return {
          preTestQuestions,
          postTestQuestions,
          allQuestions: [...preTestQuestions, ...postTestQuestions],
        };
      } else {
        // 原本的單一生成模式
        const prompt = this.buildPrompt(
          grade,
          subject,
          associationRules,
          questionTypes,
          extractedText,
        );

        console.log('使用OpenAI生成題目...');
        const response = await this.openaiService.generateQuestions(prompt);
        const questions = this.parseQuestions(
          response.choices[0].message.content,
        );

        return {
          preTestQuestions: [],
          postTestQuestions: [],
          allQuestions: questions,
        };
      }
    } catch (error) {
      console.error('生成題目失敗:', error);

      // 檢查是否為 API key 錯誤
      if (error.response?.status === 401) {
        throw new Error('OpenAI API key 無效，請檢查設定');
      }

      // 檢查是否為餘額不足
      if (error.response?.data?.error?.type === 'insufficient_quota') {
        throw new Error('OpenAI API 餘額不足，請充值或檢查用量');
      }

      throw new Error('題目生成失敗，請檢查網路連線並稍後再試');
    }
  }

  buildPrompt(
    grade,
    subject,
    associationRules,
    questionTypes,
    extractedText,
    testType = '',
  ) {
    const subjectName = subject === 'chinese' ? '國文' : '英文';
    const gradeName = `國小${grade}年級`;
    const testTypeLabel =
      testType === 'pretest' ? '前測' : testType === 'posttest' ? '後測' : '';

    let prompt = '';
    
    // =============== 一、系統角色與約束（SYSTEM PROMPT） ===============
    prompt += `【系統角色與核心約束】\n`;
    prompt += `你是一個「規則優先」的教育評量題目生成系統。\n`;
    prompt += `你的任務是在明確資料來源與硬性規則下生成診斷性題目，不是自由創作。\n`;
    prompt += `所有硬性規則的優先順序高於任何教學描述、範例或語言習慣。\n\n`;

    // 如果是國文科目，加上硬性規則
    if (subject === 'chinese') {
      prompt += `【最高優先原則（不可違反）】\n`;
      prompt += `1. 不得自行推導、猜測或補完任何「國字注音」\n`;
      prompt += `2. 所有正確注音只能來自使用者提供的字音對照表\n`;
      prompt += `3. 題目中出現的「目標國字」必須完全來自字音對照表\n`;
      prompt += `4. 若任一規則無法同時滿足，必須輸出 error JSON，不得勉強生成題目\n`;
      prompt += `5. 不得使用簡體字、拼音、或缺少聲調的注音\n`;
      prompt += `6. 不得使用多音字、破音字，除非使用者明確指定唯一讀音\n\n`;

      // =============== 二、角色與任務 ===============
      prompt += `【角色與任務】\n`;
      prompt += `你是一位熟悉台灣 108 課綱國語文領域的${gradeName}國文老師，`;
      prompt += `請設計${testTypeLabel}診斷題目來判斷學生是否掌握基礎概念。\n\n`;
      
      // 檢查是否有字音字形題型
      const hasPronunciation = questionTypes.some(
        type => type.value === 'pronunciation'
      );
      
      if (hasPronunciation) {
        // 取得該年級的單字資料
        const gradeWords = wordsData[grade] || {};
        const wordEntries = Object.entries(gradeWords);
        
        if (wordEntries.length > 0) {
          // =============== 三、唯一可信資料來源 ===============
          prompt += `【唯一可信資料來源（字音對照表）】\n`;
          prompt += `⚠️ 注意：以下資料是唯一可用的字音來源\n\n`;
          prompt += `{\n  "bopomofo_map": {\n`;
          
          // 隨機選取一部分單字（避免 prompt 過長）
          const shuffled = [...wordEntries].sort(() => 0.5 - Math.random());
          const selectedWords = shuffled.slice(0, Math.min(50, wordEntries.length));
          
          selectedWords.forEach(([word, zhuyin], index) => {
            const comma = index < selectedWords.length - 1 ? ',' : '';
            prompt += `    "${word}": "${zhuyin}"${comma}\n`;
          });
          
          prompt += `  }\n}\n\n`;
          
          // =============== 四、字音字形題硬性規則 ===============
          prompt += `【字音字形題硬性規則】\n`;
          prompt += `1. 只能從 bopomofo_map 中選擇「目標國字」作為題目核心\n`;
          prompt += `2. 正確選項的注音必須完全等於 bopomofo_map[目標國字]（包含聲調）\n`;
          prompt += `3. 三個錯誤選項必須：\n`;
          prompt += `   - 基於正確注音進行修改\n`;
          prompt += `   - 僅改動一個元素（聲母/韻母/聲調 其中之一）\n`;
          prompt += `   - 明確為錯誤注音（缺聲調亦視為錯誤）\n`;
          prompt += `4. 不得出現任何清單外國字或注音形式\n`;
          prompt += `5. 題目與解析僅能使用繁體中文與注音符號\n\n`;
        }
      }
    }

    // =============== 五、課綱對應（背景資訊） ===============
    const hasPronunciation = questionTypes.some(
      type => type.value === 'pronunciation'
    );
    const sectionNumber = hasPronunciation && subject === 'chinese' ? '五' : '三';
    
    prompt += `【${sectionNumber}、課綱對應（背景資訊）】\n`;
    
    if (associationRules) {
      // 處理關聯規則，移除不需要的標記
      let processedRules = associationRules;
      
      // 移除「前項困難診斷題目」、「後項困難補強題目」等標題
      processedRules = processedRules.replace(/【前項困難診斷題目】/g, '');
      processedRules = processedRules.replace(/【後項困難補強題目】/g, '');
      
      // 移除「前項困難」、「困難點」、「Q題目編號」等不需要的標記
      processedRules = processedRules.replace(/前項困難[：:]/g, '');
      processedRules = processedRules.replace(/後項困難[：:]/g, '');
      processedRules = processedRules.replace(/困難點[：:]/g, '');
      processedRules = processedRules.replace(/Q\d+[：:|｜]*/g, '');
      
      prompt += `對應 108 課綱基本學習內容\n${processedRules}\n`;
    } else {
      prompt += `對應 108 課綱基本學習內容\n`;
      const gradeLevel = grade === '1' || grade === '2' ? 'I' 
        : grade === '3' || grade === '4' ? 'II' : 'III';
      prompt += `* Ab-${gradeLevel}-1：常用字的字形、字音和字義\n`;
      prompt += `* Ab-${gradeLevel}-6：常用語詞的使用\n`;
    }
    prompt += `\n`;

    // =============== 六、參考資料（如果有） ===============
    if (extractedText) {
      const nextSection = (hasPronunciation && subject === 'chinese') ? '六' : '四';
      prompt += `【${nextSection}、參考資料】\n`;
      prompt += `${extractedText.substring(0, 1000)}\n\n`;
    }

    // =============== 七、題型需求 ===============
    const typeSection = extractedText 
      ? ((hasPronunciation && subject === 'chinese') ? '七' : '五')
      : ((hasPronunciation && subject === 'chinese') ? '六' : '四');
    
    prompt += `【${typeSection}、題型需求】\n`;
    prompt += `請設計以下題型：\n`;
    questionTypes.forEach((type, index) => {
      const typeName = this.getTypeChineseName(
        type.category,
        type.value,
        subject,
      );
      prompt += `${index + 1}. ${typeName}：${type.count} 題（單選）\n`;
    });
    prompt += `\n`;

    // =============== 八、輸出格式 ===============
    const outputSection = typeSection === '七' ? '八' 
      : typeSection === '六' ? '七'
      : typeSection === '五' ? '六'
      : '五';
      
    prompt += `【${outputSection}、輸出格式（必須完全符合）】\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "id": 1,\n`;
    prompt += `    "type": "single",\n`;
    prompt += `    "category": "題型分類",\n`;
    prompt += `    "question": "題目內容",\n`;
    prompt += `    "options": ["A. 選項1", "B. 選項2", "C. 選項3", "D. 選項4"],\n`;
    prompt += `    "answer": "A",\n`;
    prompt += `    "explanation": "詳細解析"\n`;
    prompt += `  }\n`;
    prompt += `]\n\n`;
    
    if (hasPronunciation && subject === 'chinese') {
      prompt += `字音字形題特殊格式：\n`;
      prompt += `{\n`;
      prompt += `  "id": 1,\n`;
      prompt += `  "type": "single",\n`;
      prompt += `  "category": "pronunciation",\n`;
      prompt += `  "target_char": "從 bopomofo_map 選擇的國字",\n`;
      prompt += `  "target_bopomofo": "該字的正確注音",\n`;
      prompt += `  "question": "下列「」中的字，何者讀音正確？",\n`;
      prompt += `  "options": [\n`;
      prompt += `    "A. 「目標字」詞（正確注音）",\n`;
      prompt += `    "B. 「目標字」詞（錯誤注音1）",\n`;
      prompt += `    "C. 「目標字」詞（錯誤注音2）",\n`;
      prompt += `    "D. 「目標字」詞（錯誤注音3）"\n`;
      prompt += `  ],\n`;
      prompt += `  "answer": "A",\n`;
      prompt += `  "explanation": "說明正確與錯誤原因"\n`;
      prompt += `}\n\n`;
    }

    // =============== 九、失敗輸出格式 ===============
    const failSection = outputSection === '八' ? '九'
      : outputSection === '七' ? '八'
      : outputSection === '六' ? '七'
      : '六';
      
    prompt += `【${failSection}、失敗輸出格式】\n`;
    prompt += `若無法同時滿足所有規則，請輸出：\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "error": "CONSTRAINT_VIOLATION",\n`;
    prompt += `    "reason": "簡述無法同時滿足的規則"\n`;
    prompt += `  }\n`;
    prompt += `]\n`;

    return prompt;
  }

  getTypeChineseName(category, value, subject) {
    const typeMap = {
      chinese: {
        single: {
          pronunciation: '字音字形辨別',
          vocabulary: '詞語情境應用克漏字',
          idiom: '成語情境應用',
          sentence: '句意分析與重組',
          rhetoric: '國學常識與修辭',
          reading: '文意推論與摘要選擇題',
        },
        group: {},
      },
      english: {
        single: {
          grammar: '文法句型',
          cloze: '閱讀填空',
          comprehension: '閱讀理解',
        },
        group: {},
      },
    };

    return typeMap[subject]?.[category]?.[value] || '未知題型';
  }

  parseQuestions(responseText, testType = '', selectedRules = []) {
    try {
      // 嘗試提取JSON部分
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return questions.map((q, index) => ({
          ...q,
          id: index + 1,
          testType: testType, // 標記是前測或後測
          ruleIds: selectedRules?.map((r) => r.rank) || [], // 關聯的規則ID
          globalId: `${testType}_${index + 1}`, // 全局唯一ID
        }));
      }

      // 如果無法解析JSON，返回錯誤示例題目
      throw new Error('無法解析AI生成的題目格式');
    } catch (error) {
      console.error('解析題目失敗:', error);

      // 返回示例題目作為後備
      return this.getFallbackQuestions();
    }
  }

  // 新增方法：為題目分配對應的規則ID
  parseQuestionsWithRules(
    responseText,
    testType = '',
    selectedRules = [],
    questionTypes = [],
    ruleType = '',
  ) {
    try {
      // 嘗試提取JSON部分
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);

        // 如果有多個規則，平均分配題目到各個規則
        const rulesCount = selectedRules?.length || 1;
        const questionsPerRule = Math.ceil(questions.length / rulesCount);

        console.log(`[${testType}] 解析題目:`, {
          總題數: questions.length,
          規則數: rulesCount,
          每規則題數: questionsPerRule,
          規則類型: ruleType,
        });

        return questions.map((q, index) => {
          // 計算這個題目應該屬於哪個規則
          const ruleIndex = Math.floor(index / questionsPerRule);
          const assignedRule = selectedRules[ruleIndex] || selectedRules[0];

          // 記錄分配情況
          console.log(
            `題目 ${index + 1} 分配給規則:`,
            assignedRule?.rank || '無',
          );

          return {
            ...q,
            id: index + 1,
            testType: testType, // 標記是前測或後測
            ruleIds: assignedRule ? [assignedRule.rank] : [], // 只關聯對應的規則ID
            globalId: `${testType}_${index + 1}`, // 全局唯一ID
            ruleType: ruleType, // 記錄是前項還是後項
          };
        });
      }

      throw new Error('無法解析題目格式');
    } catch (error) {
      console.error('解析題目失敗:', error);
      return this.getFallbackQuestions();
    }
  }

  getFallbackQuestions() {
    return [
      {
        id: 1,
        type: 'single',
        category: 'pronunciation',
        question: '下列「」中的字，何者讀音正確？',
        options: [
          'A. 「看」書（ㄎㄢˋ）',
          'B. 「看」書（ㄎㄢ）',
          'C. 「看」書（ㄎㄢˇ）',
          'D. 「看」書（ㄎㄢˊ）',
        ],
        answer: 'A',
        explanation:
          '「看」在「看書」中的讀音是 ㄎㄢˋ（第四聲），表示閱讀的意思。',
      },
    ];
  }
}