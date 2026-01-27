// Google Apps Script 程式碼
// 部署為 Web 應用程式，設定為「任何人都可以存取」

// 請將此 SHEET_ID 替換為你的 Google Sheets ID
const SHEET_ID = '1RY88-WD3NaW-H_vmLsVeP9XkD8kIB30V4lLEJ7IyF_c';

function doGet(e) {
  const grade = e.parameter.grade || '1';

  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID);

    // 根據年級選擇對應的分頁
    const sheetName = `grade${grade}_chinese`;
    const dataSheet = sheet.getSheetByName(sheetName);

    if (!dataSheet) {
      throw new Error(`找不到分頁: ${sheetName}`);
    }

    const data = dataSheet.getDataRange().getValues();

    // 第一列是標題，從第二列開始是資料
    const headers = data[0];
    const rules = [];

    // 找出各欄位的索引位置
    const columnIndexes = {
      grade: headers.indexOf('年級'),
      subject: headers.indexOf('科目'),
      rank: headers.indexOf('rank'),
      antecedents: headers.indexOf('antecedents'),
      consequents: headers.indexOf('consequents'),
      antecedentSupport: headers.indexOf('antecedent support'),
      consequentSupport: headers.indexOf('consequent support'),
      support: headers.indexOf('support'),
      confidence: headers.indexOf('confidence'),
      lift: headers.indexOf('lift'),
      representativity: headers.indexOf('representativity'),
      leverage: headers.indexOf('leverage'),
      conviction: headers.indexOf('conviction'),
      zhangsMetric: headers.indexOf('zhangs_metric'),
      jaccard: headers.indexOf('jaccard'),
      certainty: headers.indexOf('certainty'),
      kulczynski: headers.indexOf('kulczynski'),
      aImplication: headers.indexOf('A_含意'),
      bImplication: headers.indexOf('B_含意'),
      aBasicContent: headers.indexOf('A_基本學習內容'),
      bBasicContent: headers.indexOf('B_基本學習內容'),
    };

    // 從第二列開始讀取資料
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // 檢查是否為有效資料列
      if (row[columnIndexes.rank]) {
        rules.push({
          rank: row[columnIndexes.rank] || row[2],
          antecedents: row[columnIndexes.antecedents] || row[3],
          consequents: row[columnIndexes.consequents] || row[4],
          antecedentSupport: row[columnIndexes.antecedentSupport] || row[5],
          consequentSupport: row[columnIndexes.consequentSupport] || row[6],
          support: row[columnIndexes.support] || row[7],
          confidence: row[columnIndexes.confidence] || row[8],
          lift: row[columnIndexes.lift] || row[9],
          representativity: row[columnIndexes.representativity] || row[10],
          leverage: row[columnIndexes.leverage] || row[11],
          conviction: row[columnIndexes.conviction] || row[12],
          zhangsMetric: row[columnIndexes.zhangsMetric] || row[13],
          jaccard: row[columnIndexes.jaccard] || row[14],
          certainty: row[columnIndexes.certainty] || row[15],
          kulczynski: row[columnIndexes.kulczynski] || row[16],
          aImplication: row[columnIndexes.aImplication] || row[17] || '',
          bImplication: row[columnIndexes.bImplication] || row[18] || '',
          aBasicContent: row[columnIndexes.aBasicContent] || row[19] || '',
          bBasicContent: row[columnIndexes.bBasicContent] || row[20] || '',
        });
      }
    }

    // 返回 JSON 格式，包含 CORS 頭部
    const output = ContentService.createTextOutput(
      JSON.stringify({
        grade: grade,
        sheetName: sheetName,
        totalRules: rules.length,
        rules: rules,
      }),
    );

    output.setMimeType(ContentService.MimeType.JSON);
    
    return output;
  } catch (error) {
    const errorOutput = ContentService.createTextOutput(
      JSON.stringify({
        error: error.toString(),
        grade: grade,
      }),
    );
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

// 處理 POST 請求（用於 CORS）
function doPost(e) {
  return doGet(e);
}

// 測試函數
function testGetRules() {
  const e = {
    parameter: {
      grade: '1',
    },
  };

  const result = doGet(e);
  console.log(result.getContent());
}
