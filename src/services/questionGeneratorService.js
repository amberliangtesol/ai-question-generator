import { OpenAIService } from './apiService.js';

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

    let prompt = `請為${gradeName}${subjectName}科目生成${testTypeLabel}題目。\n\n`;

    // 如果是國文科目，加上繁體中文與注音要求
    if (subject === 'chinese') {
      prompt += `重要要求：
1. 請勿出現任何簡體中文與拼音，務必使用繁體中文與注音
2. 【重要】所有注音必須以《教育部重編國語辭典修訂本》為唯一標準
3. 【重要】嚴格避免使用多音字或破音字，確保每個題目的字只有單一讀音
4. 出題前請先確認該字在《教育部重編國語辭典》中的標準讀音\n\n`;
    }

    // 添加關聯規則
    if (associationRules) {
      prompt += `出題要求：\n${associationRules}\n\n`;
    }

    // 添加參考資料
    if (extractedText) {
      prompt += `參考資料：\n${extractedText.substring(0, 1000)}\n\n`;
    }

    // 添加題型要求
    prompt += `題型要求：\n`;
    questionTypes.forEach((type) => {
      const typeName = this.getTypeChineseName(
        type.category,
        type.value,
        subject,
      );
      prompt += `- ${typeName}：${type.count}題\n`;
    });

    prompt += `\n請按以下JSON格式生成題目：\n`;
    prompt += `[
  {
    "id": 1,
    "type": "single",
    "category": "pronunciation",
    "question": "題目內容",
    "options": ["A. 選項1", "B. 選項2", "C. 選項3", "D. 選項4"],
    "answer": "A",
    "explanation": "詳細解析"
  }
]\n\n`;

    prompt += `注意事項：\n`;
    prompt += `1. 題目難度要適合${gradeName}學生\n`;
    prompt += `2. 選項要有干擾性但不能過於困難\n`;
    prompt += `3. 每題都要提供清楚的解析\n`;
    prompt += `4. 如果是題組題，要包含閱讀材料\n`;
    prompt += `5. 請直接返回JSON格式，不要包含其他文字\n`;
    if (subject === 'chinese') {
      prompt += `6. 字音字形題目必須使用注音符號，例如：「間」隔 (ㄐㄧㄢ)，不可使用拼音\n`;
    }

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
        },
        group: {
          reading: '文意推論與摘要選擇題',
        },
      },
      english: {
        single: {
          grammar: '文法句型',
          cloze: '閱讀填空',
        },
        group: {
          comprehension: '閱讀理解',
        },
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

      // 如果無法解析JSON，返回錯誤示例題目
      throw new Error('無法解析AI生成的題目格式');
    } catch (error) {
      console.error('解析題目失敗:', error);

      // 返回示例題目作為後備
      return this.getFallbackQuestions();
    }
  }

  getFallbackQuestions() {
    return [
      {
        id: 1,
        type: 'single',
        category: 'pronunciation',
        question: '下列哪一個字的讀音正確？',
        options: [
          'A. 「間」隔 (ㄐㄧㄢ)',
          'B. 「間」隔 (ㄐㄧㄢˋ)',
          'C. 「間」隔 (ㄍㄢ)',
          'D. 「間」隔 (ㄍㄢˋ)',
        ],
        answer: 'A',
        explanation: '「間」隔的「間」讀作 ㄐㄧㄢ，表示空隙、距離。',
      },
      {
        id: 2,
        type: 'single',
        category: 'vocabulary',
        question: '請選出最適合填入空格的詞語：「他___地完成了作業。」',
        options: ['A. 匆忙', 'B. 認真', 'C. 隨便', 'D. 草率'],
        answer: 'B',
        explanation: '從語境來看，完成作業應該是認真的態度。',
      },
      {
        id: 3,
        type: 'single',
        category: 'idiom',
        question: '「畫蛇添足」的意思是什麼？',
        options: ['A. 多此一舉', 'B. 精益求精', 'C. 錦上添花', 'D. 創意發想'],
        answer: 'A',
        explanation: '畫蛇添足比喻做了多餘的事，不但無益，反而有害。',
      },
    ];
  }

  // 生成模擬題目（用於測試）
  generateMockQuestions(questionTypes, subject) {
    const mockQuestions = [];
    let id = 1;

    questionTypes.forEach((type) => {
      for (let i = 0; i < type.count; i++) {
        if (subject === 'chinese') {
          mockQuestions.push(this.getChineseMockQuestion(type, id++));
        } else {
          mockQuestions.push(this.getEnglishMockQuestion(type, id++));
        }
      }
    });

    return mockQuestions;
  }

  getChineseMockQuestion(type, id) {
    const questionBank = {
      pronunciation: [
        {
          question: '下列哪一個字的讀音正確？',
          options: [
            'A. 「載」重 (ㄗㄞˇ)',
            'B. 「載」重 (ㄗㄞˋ)',
            'C. 「載」重 (ㄘㄞˊ)',
            'D. 「載」重 (ㄌㄞˊ)',
          ],
          answer: 'B',
          explanation: '「載」重的「載」讀作 ㄗㄞˋ，表示承受重量。',
        },
      ],
      vocabulary: [
        {
          question:
            '請選出最適合填入空格的詞語：「這個故事很___，讓人印象深刻。」',
          options: ['A. 生動', 'B. 安靜', 'C. 困難', 'D. 簡單'],
          answer: 'A',
          explanation: '生動表示活潑、有趣，最適合形容故事。',
        },
      ],
      idiom: [
        {
          question: '「井底之蛙」的意思是什麼？',
          options: ['A. 見識淺薄', 'B. 住在井裡', 'C. 跳得很高', 'D. 很會游泳'],
          answer: 'A',
          explanation: '井底之蛙比喻見識狹窄的人。',
        },
      ],
      sentence: [
        {
          question: '下列句子中，語序正確的是？',
          options: [
            'A. 我昨天去了學校',
            'B. 昨天我學校去了',
            'C. 學校去了我昨天',
            'D. 去了昨天我學校',
          ],
          answer: 'A',
          explanation: '正確的語序應該是：主語 + 時間 + 動詞 + 賓語。',
        },
      ],
      rhetoric: [
        {
          question:
            '「黑夜給了我黑色的眼睛，我卻用它尋找光明。」這句話使用了哪一種修辭法？',
          options: ['A. 映襯', 'B. 譬喻', 'C. 轉化', 'D. 誇飾'],
          answer: 'A',
          explanation:
            '這句話運用「黑夜」與「光明」、「黑色」與「光明」形成對比，屬於映襯修辭法。',
        },
        {
          question: '「春風又綠江南岸」中的「綠」字使用了哪種修辭技巧？',
          options: ['A. 借代', 'B. 轉品', 'C. 設問', 'D. 排比'],
          answer: 'B',
          explanation:
            '「綠」原本是形容詞，這裡當作動詞使用，表示「使…變綠」，這是轉品修辭。',
        },
      ],
      reading: [
        {
          question:
            '根據以下短文，作者想要表達什麼？\n\n小明每天都很早起床，幫媽媽做家事，然後才去上學。雖然很累，但他覺得很快樂，因為能幫助家人。',
          options: [
            'A. 小明很懶惰',
            'B. 做家事很辛苦',
            'C. 幫助家人是快樂的',
            'D. 上學很重要',
          ],
          answer: 'C',
          explanation:
            '文中提到小明雖然累但覺得快樂，因為能幫助家人，所以答案是C。',
        },
      ],
    };

    const questions = questionBank[type.value] || questionBank.pronunciation;
    const selectedQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    return {
      id,
      type: type.category,
      category: type.value,
      ...selectedQuestion,
    };
  }

  getEnglishMockQuestion(type, id) {
    const questionBank = {
      grammar: [
        {
          question: 'Choose the correct sentence:',
          options: [
            'A. I am go to school.',
            'B. I go to school.',
            'C. I goes to school.',
            'D. I going to school.',
          ],
          answer: 'B',
          explanation:
            'The correct form is "I go to school" using the base form of the verb.',
        },
      ],
      cloze: [
        {
          question: 'Fill in the blank: "I _____ my homework yesterday."',
          options: ['A. do', 'B. did', 'C. does', 'D. doing'],
          answer: 'B',
          explanation: 'We use "did" for past tense with "yesterday".',
        },
      ],
      comprehension: [
        {
          question:
            'Read the passage and answer:\n\nTom likes to play basketball. He plays every day after school. He wants to be a professional player when he grows up.\n\nWhat does Tom want to be?',
          options: [
            'A. A teacher',
            'B. A doctor',
            'C. A basketball player',
            'D. A student',
          ],
          answer: 'C',
          explanation:
            'The passage states that Tom wants to be a professional player.',
        },
      ],
    };

    const questions = questionBank[type.value] || questionBank.grammar;
    const selectedQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    return {
      id,
      type: type.category,
      category: type.value,
      ...selectedQuestion,
    };
  }
}
