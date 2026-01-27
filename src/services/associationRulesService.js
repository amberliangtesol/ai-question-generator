// 關聯規則服務
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCOj5EqJnTWTJ4zsx10LdowFsp9FuZsYLTrAC4qQz5_YiuqFkbkTBVgwU_wWqVgvWf_w/exec';

// 模擬資料（當無法連接到 Google Apps Script 時使用）
const mockRulesData = {
  '1': [
    {
      rank: 1,
      antecedents: 'Q16, Q18, Q21',
      consequents: 'Q17',
      aImplication: 'Q16｜字詞_應用 / Q18｜字詞_應用 / Q21｜句段_閱讀',
      bImplication: 'Q17｜字詞_應用',
      aBasicContent: 'AB-I-6 1,000個常用語詞的使用。 / AB-I-6 1,000個常用語詞的使用。 / Ac-I-2 簡單的基本句型。',
      bBasicContent: 'AB-I-6 1,000個常用語詞的使用。',
      confidence: 0.689,
      support: 0.047
    }
  ],
  '2': [
    {
      rank: 1,
      antecedents: 'Q22, Q24',
      consequents: 'Q23',
      aImplication: 'Q22｜語詞_理解 / Q24｜句段_應用',
      bImplication: 'Q23｜語詞_應用',
      aBasicContent: 'AB-II-5 3,000個常用語詞的認念。 / Ac-II-2 各種基本句型。',
      bBasicContent: 'AB-II-5 3,000個常用語詞的認念。',
      confidence: 0.725,
      support: 0.052
    }
  ],
  '3': [
    {
      rank: 1,
      antecedents: 'Q31, Q33, Q35',
      consequents: 'Q32',
      aImplication: 'Q31｜成語_理解 / Q33｜修辭_應用 / Q35｜閱讀_理解',
      bImplication: 'Q32｜成語_應用',
      aBasicContent: 'Ab-III-5 4,500個常用語詞的認念。 / Ac-III-4 各類句型的語氣與意義。',
      bBasicContent: 'Ab-III-5 4,500個常用語詞的認念。',
      confidence: 0.756,
      support: 0.061
    }
  ],
  '4': [
    {
      rank: 1,
      antecedents: 'Q41, Q43',
      consequents: 'Q42',
      aImplication: 'Q41｜字音字形_辨識 / Q43｜閱讀_推論',
      bImplication: 'Q42｜詞語_應用',
      aBasicContent: 'Ab-III-1 2,700個常用字的字形、字音和字義。 / Ad-III-2 篇章的大意、主旨與簡單結構。',
      bBasicContent: 'Ab-III-5 4,500個常用語詞的認念。',
      confidence: 0.782,
      support: 0.068
    }
  ],
  '5': [
    {
      rank: 1,
      antecedents: 'Q51, Q53, Q55',
      consequents: 'Q52',
      aImplication: 'Q51｜文言文_理解 / Q53｜修辭_分析 / Q55｜寫作_技巧',
      bImplication: 'Q52｜文言文_應用',
      aBasicContent: 'Ac-III-4 各類句型的語氣與意義。 / Ad-III-3 故事、童話、現代散文的閱讀。',
      bBasicContent: 'Ac-III-4 各類句型的語氣與意義。',
      confidence: 0.801,
      support: 0.074
    }
  ],
  '6': [
    {
      rank: 1,
      antecedents: 'Q61, Q63, Q65',
      consequents: 'Q62',
      aImplication: 'Q61｜議論文_分析 / Q63｜詩詞_鑑賞 / Q65｜綜合_應用',
      bImplication: 'Q62｜議論文_寫作',
      aBasicContent: 'Bd-III-1 以事實、理論為論據的說明文本。 / Ad-III-4 古典詩文的閱讀。',
      bBasicContent: 'Bd-III-2 論證方式的運用。',
      confidence: 0.823,
      support: 0.081
    }
  ]
};

// 獲取指定年級的關聯規則
export async function getAssociationRules(grade) {
  try {
    // 嘗試從 Google Apps Script 獲取資料
    console.log(`正在載入年級 ${grade} 的關聯規則...`);
    
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?grade=${grade}`, {
      method: 'GET',
      redirect: 'follow',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('收到回應:', text.substring(0, 200));
    
    try {
      const data = JSON.parse(text);
      
      if (data.error) {
        console.error('Google Apps Script 錯誤:', data.error);
        console.log('使用模擬資料');
        return mockRulesData[grade] || [];
      }
      
      console.log(`✅ 成功載入年級 ${grade} 的真實關聯規則:`, data.totalRules || 0, '條');
      return data.rules || [];
    } catch (parseError) {
      console.error('解析 JSON 失敗:', parseError);
      console.log('回應內容:', text);
      console.log('改用模擬資料');
      return mockRulesData[grade] || [];
    }
  } catch (error) {
    console.warn('⚠️ 無法連接到 Google Apps Script:', error.message);
    console.log('使用模擬資料作為備份');
    return mockRulesData[grade] || [];
  }
}

// 格式化關聯規則為提示文字
export function formatRulesForPrompt(rules) {
  if (!rules || rules.length === 0) return '';
  
  const topRule = rules[0]; // 取最高排名的規則
  
  return `你是一位資深的教育數據分析師與補救教學專家，學生的學習困難規則如下：
若學生在「${topRule.aImplication}」有困難，
則很可能在「${topRule.bImplication}」也會有困難（信心度：${(topRule.confidence * 100).toFixed(1)}%）。

相關基本學習內容：
- 前項困難點：${topRule.aBasicContent}
- 後項困難點：${topRule.bBasicContent}

請根據這個關聯規則，針對性地出題來幫助學生克服這些學習困難。`;
}

// 獲取所有可用的年級選項
export function getAvailableGrades() {
  return [
    { value: '1', label: '國小一年級' },
    { value: '2', label: '國小二年級' },
    { value: '3', label: '國小三年級' },
    { value: '4', label: '國小四年級' },
    { value: '5', label: '國小五年級' },
    { value: '6', label: '國小六年級' }
  ];
}