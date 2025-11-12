import jsPDF from 'jspdf'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'

export class ExamPaperService {
  constructor() {
    this.pdf = null
  }

  async generateExamPaper(questions, examInfo) {
    try {
      // 建立PDF實例
      this.pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // 設定中文字體（需要額外處理中文顯示）
      this.setupFont()

      // 生成考卷
      this.generateQuestionPaper(questions, examInfo)
      
      // 新增頁面生成解答
      this.pdf.addPage()
      this.generateAnswerSheet(questions, examInfo)

      // 下載PDF
      const fileName = `${examInfo.subject}_${examInfo.grade}年級_考卷_${new Date().toISOString().split('T')[0]}.pdf`
      this.pdf.save(fileName)

    } catch (error) {
      console.error('生成考卷失敗:', error)
      throw new Error('考卷生成失敗，請稍後再試')
    }
  }

  setupFont() {
    // 由於jsPDF對中文支援有限，這裡使用基本設定
    // 在實際應用中可以加載中文字體文件
    this.pdf.setFont('helvetica')
  }

  generateQuestionPaper(questions, examInfo) {
    let currentY = 20

    // 標題
    this.pdf.setFontSize(20)
    this.pdf.text(`${examInfo.grade} Grade ${examInfo.subject} Exam`, 105, currentY, { align: 'center' })
    currentY += 15

    // 考試資訊
    this.pdf.setFontSize(12)
    this.pdf.text(`Subject: ${examInfo.subject}`, 20, currentY)
    currentY += 8
    this.pdf.text(`Grade: ${examInfo.grade}`, 20, currentY)
    currentY += 8
    this.pdf.text(`Total Questions: ${questions.length}`, 20, currentY)
    currentY += 8
    this.pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY)
    currentY += 15

    // 分隔線
    this.pdf.line(20, currentY, 190, currentY)
    currentY += 10

    // 注意事項
    this.pdf.setFontSize(10)
    this.pdf.text('Instructions:', 20, currentY)
    currentY += 5
    this.pdf.text('1. Please read each question carefully.', 25, currentY)
    currentY += 5
    this.pdf.text('2. Choose the best answer for each question.', 25, currentY)
    currentY += 5
    this.pdf.text('3. Mark your answers clearly.', 25, currentY)
    currentY += 15

    // 題目
    this.pdf.setFontSize(12)
    questions.forEach((question, index) => {
      // 檢查是否需要換頁
      if (currentY > 250) {
        this.pdf.addPage()
        currentY = 20
      }

      // 題號和題目
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${index + 1}.`, 20, currentY)
      
      this.pdf.setFont('helvetica', 'normal')
      
      // 處理長題目自動換行
      const questionText = this.convertChineseToEnglish(question.question)
      const lines = this.pdf.splitTextToSize(questionText, 165)
      this.pdf.text(lines, 30, currentY)
      currentY += lines.length * 6

      // 選項
      if (question.options) {
        question.options.forEach(option => {
          const optionText = this.convertChineseToEnglish(option)
          const optionLines = this.pdf.splitTextToSize(optionText, 155)
          this.pdf.text(optionLines, 35, currentY)
          currentY += optionLines.length * 5
        })
      }

      currentY += 5 // 題目間距
    })
  }

  generateAnswerSheet(questions, examInfo) {
    let currentY = 20

    // 標題
    this.pdf.setFontSize(20)
    this.pdf.text('Answer Sheet & Explanations', 105, currentY, { align: 'center' })
    currentY += 20

    // 快速答案表
    this.pdf.setFontSize(14)
    this.pdf.text('Quick Answer Reference:', 20, currentY)
    currentY += 10

    this.pdf.setFontSize(12)
    
    // 答案表格
    const answersPerRow = 5
    for (let i = 0; i < questions.length; i += answersPerRow) {
      let lineText = ''
      for (let j = i; j < Math.min(i + answersPerRow, questions.length); j++) {
        lineText += `${j + 1}. ${questions[j].answer}    `
      }
      this.pdf.text(lineText, 20, currentY)
      currentY += 8
    }

    currentY += 10

    // 詳細解析
    this.pdf.setFontSize(14)
    this.pdf.text('Detailed Explanations:', 20, currentY)
    currentY += 10

    this.pdf.setFontSize(10)
    questions.forEach((question, index) => {
      // 檢查是否需要換頁
      if (currentY > 250) {
        this.pdf.addPage()
        currentY = 20
      }

      // 題號和答案
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${index + 1}. Answer: ${question.answer}`, 20, currentY)
      currentY += 6

      // 解析
      this.pdf.setFont('helvetica', 'normal')
      if (question.explanation) {
        const explanationText = this.convertChineseToEnglish(question.explanation)
        const lines = this.pdf.splitTextToSize(`Explanation: ${explanationText}`, 170)
        this.pdf.text(lines, 20, currentY)
        currentY += lines.length * 5
      }

      currentY += 5 // 題目間距
    })
  }

  // 簡單的中文到拼音轉換（實際應用中可使用更專業的轉換庫）
  convertChineseToEnglish(text) {
    // 這是一個簡化的處理，實際應用中應該使用適當的中文字體
    // 或者轉換為拼音/英文描述
    return text.replace(/[\u4e00-\u9fff]/g, (char) => {
      // 基本的常用字轉換
      const map = {
        '國': 'Chinese',
        '小': 'Elementary',
        '年': 'Year',
        '級': 'Grade',
        '文': 'Language',
        '英': 'English',
        '下': 'Below',
        '列': 'List',
        '哪': 'Which',
        '一': 'One',
        '個': '',
        '字': 'Character',
        '的': 'of',
        '讀': 'Read',
        '音': 'Sound',
        '正': 'Correct',
        '確': 'Sure',
        '？': '?',
        '請': 'Please',
        '選': 'Choose',
        '出': 'Out',
        '最': 'Most',
        '適': 'Suitable',
        '合': 'Appropriate',
        '填': 'Fill',
        '入': 'In',
        '空': 'Blank',
        '格': 'Grid',
        '詞': 'Word',
        '語': 'Language',
        '他': 'He',
        '地': '',
        '完': 'Complete',
        '成': 'Finish',
        '了': '',
        '作': 'Work',
        '業': 'Job',
        '。': '.',
        '「': '"',
        '」': '"',
        '間': 'Between',
        '隔': 'Gap'
      }
      return map[char] || char
    })
  }

  // 生成純文字版本的考卷
  generateTextVersion(questions, examInfo) {
    let content = ''
    
    // 標題
    content += `${examInfo.subject} - Grade ${examInfo.grade} Exam Paper\n`
    content += `Date: ${new Date().toLocaleDateString()}\n`
    content += `Total Questions: ${questions.length}\n`
    content += '='.repeat(50) + '\n\n'

    // 題目
    questions.forEach((question, index) => {
      content += `${index + 1}. ${question.question}\n`
      if (question.options) {
        question.options.forEach(option => {
          content += `   ${option}\n`
        })
      }
      content += '\n'
    })

    // 答案
    content += '\n' + '='.repeat(50) + '\n'
    content += 'ANSWER SHEET\n'
    content += '='.repeat(50) + '\n\n'

    questions.forEach((question, index) => {
      content += `${index + 1}. ${question.answer}\n`
      if (question.explanation) {
        content += `   Explanation: ${question.explanation}\n`
      }
      content += '\n'
    })

    return content
  }

  // 新的PDF生成流程 - 分別生成題目頁和解答頁
  async generateExamPaperBlob(questions, examInfo) {
    let questionContainer = null
    let answerContainer = null
    
    try {
      console.log('開始生成PDF...', { questions: questions.length, examInfo })
      
      // 4. PDF 組合
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // 1. 生成題目頁面
      questionContainer = this.createContainer()
      const questionHtml = this.generateQuestionsOnlyHtml(questions, examInfo)
      questionContainer.innerHTML = questionHtml
      console.log('題目頁面HTML渲染完成')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // 轉換題目頁面為Canvas
      const questionCanvas = await html2canvas(questionContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: questionContainer.scrollWidth,
        height: questionContainer.scrollHeight,
        logging: false
      })
      console.log('題目頁面Canvas轉換完成')
      
      // 計算並添加題目頁面
      const imgWidth = 210 // A4寬度
      const pageHeight = 297 // A4高度
      const questionImgHeight = (questionCanvas.height * imgWidth) / questionCanvas.width
      const questionImgData = questionCanvas.toDataURL('image/jpeg', 0.8)
      
      // 添加題目頁面
      let heightLeft = questionImgHeight
      let position = 0
      pdf.addImage(questionImgData, 'JPEG', 0, position, imgWidth, questionImgHeight)
      heightLeft -= pageHeight
      
      // 如果題目超過一頁
      while (heightLeft >= 0) {
        position = heightLeft - questionImgHeight
        pdf.addPage()
        pdf.addImage(questionImgData, 'JPEG', 0, position, imgWidth, questionImgHeight)
        heightLeft -= pageHeight
      }
      
      // 清理題目容器
      this.cleanupContainer(questionContainer)
      questionContainer = null
      
      // 2. 生成解答頁面
      answerContainer = this.createContainer()
      const answerHtml = this.generateAnswersOnlyHtml(questions, examInfo)
      answerContainer.innerHTML = answerHtml
      console.log('解答頁面HTML渲染完成')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // 轉換解答頁面為Canvas
      const answerCanvas = await html2canvas(answerContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: answerContainer.scrollWidth,
        height: answerContainer.scrollHeight,
        logging: false
      })
      console.log('解答頁面Canvas轉換完成')
      
      // 強制新增解答頁面
      pdf.addPage()
      
      // 計算並添加解答頁面
      const answerImgHeight = (answerCanvas.height * imgWidth) / answerCanvas.width
      const answerImgData = answerCanvas.toDataURL('image/jpeg', 0.8)
      
      heightLeft = answerImgHeight
      position = 0
      pdf.addImage(answerImgData, 'JPEG', 0, position, imgWidth, answerImgHeight)
      heightLeft -= pageHeight
      
      // 如果解答超過一頁
      while (heightLeft >= 0) {
        position = heightLeft - answerImgHeight
        pdf.addPage()
        pdf.addImage(answerImgData, 'JPEG', 0, position, imgWidth, answerImgHeight)
        heightLeft -= pageHeight
      }
      
      console.log('PDF組合完成')
      
      // 5. 清理暫存容器
      this.cleanupContainer(answerContainer)
      
      // 返回PDF Blob
      return pdf.output('blob')
      
    } catch (error) {
      console.error('生成PDF失敗:', error)
      
      // 確保清理容器
      if (questionContainer) {
        this.cleanupContainer(questionContainer)
      }
      if (answerContainer) {
        this.cleanupContainer(answerContainer)
      }
      
      throw new Error('PDF生成失敗，請稍後再試')
    }
  }

  // 1. 建立隱藏容器
  createContainer() {
    const container = document.createElement('div')
    
    // 創建固定尺寸的 HTML 容器
    container.style.position = 'absolute'
    container.style.top = '-9999px' // 放置在畫面外避免干擾
    container.style.left = '0'
    container.style.width = '794px' // A4寬度 (210mm * 3.78)
    container.style.minHeight = '1123px' // A4高度 (297mm * 3.78)
    container.style.padding = '40px'
    container.style.backgroundColor = '#ffffff'
    container.style.boxSizing = 'border-box'
    
    // 設定中文友善字體
    container.style.fontFamily = '"Microsoft JhengHei", "微軟正黑體", "SimHei", "黑體", Arial, sans-serif'
    container.style.fontSize = '14px'
    container.style.lineHeight = '1.6'
    container.style.color = '#333333'
    
    document.body.appendChild(container)
    return container
  }

  // 清理暫存容器
  cleanupContainer(container) {
    if (container && container.parentNode) {
      document.body.removeChild(container)
    }
  }

  // 生成純題目頁面HTML
  generateQuestionsOnlyHtml(questions, examInfo) {
    const questionHtml = questions.map((question, index) => `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">${index + 1}.</span>
        </div>
        <div class="question-content">
          <div class="question-text">${question.question || '題目內容'}</div>
          ${question.options ? `
            <div class="question-options">
              ${question.options.map(option => `
                <div class="option-item">${option}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')

    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .exam-container {
          width: 100%; background: #ffffff; padding: 20px;
          font-family: "Microsoft JhengHei", "微軟正黑體", "SimHei", Arial, sans-serif;
          font-size: 14px; line-height: 1.6; color: #333;
        }
        .exam-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2c3e50; }
        .exam-title { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; }
        .exam-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 13px; color: #666; }
        .exam-info-item { padding: 5px 10px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #2c3e50; }
        .student-info { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
        .student-info-item { font-size: 14px; font-weight: 500; color: #333; }
        .instructions { margin-bottom: 25px; padding: 15px; background: #f0f8ff; border-radius: 8px; border: 1px solid #e3f2fd; }
        .instructions-title { font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .instructions-list { list-style: none; padding-left: 0; }
        .instructions-list li { margin-bottom: 5px; padding-left: 20px; position: relative; }
        .instructions-list li:before { content: "•"; color: #2c3e50; font-weight: bold; position: absolute; left: 0; }
        .questions-section { margin-bottom: 40px; }
        .question-item { margin-bottom: 25px; page-break-inside: avoid; padding: 15px 0; }
        .question-header { margin-bottom: 12px; }
        .question-number { display: inline-block; font-weight: bold; color: #2c3e50; font-size: 16px; min-width: 30px; }
        .question-content { margin-left: 0; }
        .question-text { font-weight: 500; margin-bottom: 15px; line-height: 1.7; color: #333; }
        .question-options { margin-left: 25px; }
        .option-item { margin-bottom: 8px; padding: 3px 0; line-height: 1.6; color: #333; }
      </style>
      
      <div class="exam-container">
        <div class="exam-header">
          <div class="exam-title">${examInfo.grade} ${examInfo.subject} 測驗卷</div>
          <div class="exam-info">
            <div class="exam-info-item">科目：${examInfo.subject}</div>
            <div class="exam-info-item">年級：${examInfo.grade}</div>
            <div class="exam-info-item">題數：${examInfo.totalQuestions} 題</div>
            <div class="exam-info-item">日期：${new Date().toLocaleDateString('zh-TW')}</div>
          </div>
          <div class="student-info">
            <div class="student-info-item">班級：___________</div>
            <div class="student-info-item">姓名：___________</div>
            <div class="student-info-item">座號：___________</div>
          </div>
        </div>
        
        <div class="instructions">
          <div class="instructions-title">📋 注意事項</div>
          <ul class="instructions-list">
            <li>請仔細閱讀每一題題目</li>
            <li>選擇最適當的答案</li>
            <li>請清楚標示答案</li>
            <li>作答時間請自行掌控</li>
          </ul>
        </div>
        
        <div class="questions-section">
          ${questionHtml}
        </div>
      </div>
    `
  }

  // 生成純解答頁面HTML
  generateAnswersOnlyHtml(questions, examInfo) {
    const answerHtml = questions.map((question, index) => `
      <div class="answer-item">
        <div class="answer-header">
          <span class="answer-number">${index + 1}.</span>
          <span class="answer-text">答案：${question.answer || 'A'}</span>
        </div>
        ${question.explanation ? `
          <div class="answer-explanation">
            <span class="explanation-label">解析：</span>
            <span class="explanation-text">${question.explanation}</span>
          </div>
        ` : ''}
      </div>
    `).join('')

    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .exam-container {
          width: 100%; background: #ffffff; padding: 20px;
          font-family: "Microsoft JhengHei", "微軟正黑體", "SimHei", Arial, sans-serif;
          font-size: 14px; line-height: 1.6; color: #333;
        }
        .answer-header-title {
          text-align: center; font-size: 22px; font-weight: bold; color: #2c3e50;
          margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #2c3e50;
        }
        .answer-item {
          margin-bottom: 20px; padding: 15px; background: #f8fffe;
          border: 1px solid #e0f2f1; border-radius: 6px; border-left: 4px solid #4caf50;
        }
        .answer-header { margin-bottom: 8px; }
        .answer-number { font-weight: bold; color: #2c3e50; margin-right: 10px; }
        .answer-text { font-weight: bold; color: #4caf50; }
        .answer-explanation { margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0f2f1; }
        .explanation-label { font-weight: bold; color: #666; margin-right: 5px; }
        .explanation-text { color: #555; line-height: 1.6; }
      </style>
      
      <div class="exam-container">
        <div class="answer-header-title">📝 解答與詳解</div>
        ${answerHtml}
      </div>
    `
  }

  // 2. 生成優化的HTML內容 - 專為Canvas轉換設計
  generateOptimizedHtmlContent(questions, examInfo) {
    const questionHtml = questions.map((question, index) => `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">${index + 1}.</span>
        </div>
        <div class="question-content">
          <div class="question-text">${question.question || '題目內容'}</div>
          ${question.options ? `
            <div class="question-options">
              ${question.options.map(option => `
                <div class="option-item">${option}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')

    const answerHtml = questions.map((question, index) => `
      <div class="answer-item">
        <div class="answer-header">
          <span class="answer-number">${index + 1}.</span>
          <span class="answer-text">答案：${question.answer || 'A'}</span>
        </div>
        ${question.explanation ? `
          <div class="answer-explanation">
            <span class="explanation-label">解析：</span>
            <span class="explanation-text">${question.explanation}</span>
          </div>
        ` : ''}
      </div>
    `).join('')

    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .exam-container {
          width: 100%;
          background: #ffffff;
          padding: 20px;
          font-family: "Microsoft JhengHei", "微軟正黑體", "SimHei", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }
        
        .exam-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2c3e50;
        }
        
        .exam-title {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .exam-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
          font-size: 13px;
          color: #666;
        }
        
        .exam-info-item {
          padding: 5px 10px;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #2c3e50;
        }
        
        .student-info {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
        }
        
        .student-info-item {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .instructions {
          margin-bottom: 25px;
          padding: 15px;
          background: #f0f8ff;
          border-radius: 8px;
          border: 1px solid #e3f2fd;
        }
        
        .instructions-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        
        .instructions-list {
          list-style: none;
          padding-left: 0;
        }
        
        .instructions-list li {
          margin-bottom: 5px;
          padding-left: 20px;
          position: relative;
        }
        
        .instructions-list li:before {
          content: "•";
          color: #2c3e50;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .questions-section {
          margin-bottom: 40px;
        }
        
        .question-item {
          margin-bottom: 25px;
          page-break-inside: avoid;
          padding: 15px 0;
        }
        
        .question-header {
          margin-bottom: 12px;
        }
        
        .question-number {
          display: inline-block;
          font-weight: bold;
          color: #2c3e50;
          font-size: 16px;
          min-width: 30px;
        }
        
        .question-content {
          margin-left: 0;
        }
        
        .question-text {
          font-weight: 500;
          margin-bottom: 15px;
          line-height: 1.7;
          color: #333;
        }
        
        .question-options {
          margin-left: 25px;
        }
        
        .option-item {
          margin-bottom: 8px;
          padding: 3px 0;
          line-height: 1.6;
          color: #333;
        }
        
        .answer-section {
          page-break-before: always;
          margin-top: 40px;
        }
        
        .answer-header-title {
          text-align: center;
          font-size: 22px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 3px solid #2c3e50;
        }
        
        .answer-item {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fffe;
          border: 1px solid #e0f2f1;
          border-radius: 6px;
          border-left: 4px solid #4caf50;
        }
        
        .answer-header {
          margin-bottom: 8px;
        }
        
        .answer-number {
          font-weight: bold;
          color: #2c3e50;
          margin-right: 10px;
        }
        
        .answer-text {
          font-weight: bold;
          color: #4caf50;
        }
        
        .answer-explanation {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e0f2f1;
        }
        
        .explanation-label {
          font-weight: bold;
          color: #666;
          margin-right: 5px;
        }
        
        .explanation-text {
          color: #555;
          line-height: 1.6;
        }
        
        @media print {
          .exam-container {
            margin: 0;
            padding: 15px;
          }
          
          .question-item {
            page-break-inside: avoid;
          }
          
          .answer-section {
            page-break-before: always;
          }
        }
      </style>
      
      <div class="exam-container">
        <!-- 考卷標題區 -->
        <div class="exam-header">
          <div class="exam-title">${examInfo.grade} ${examInfo.subject} 測驗卷</div>
          <div class="exam-info">
            <div class="exam-info-item">科目：${examInfo.subject}</div>
            <div class="exam-info-item">年級：${examInfo.grade}</div>
            <div class="exam-info-item">題數：${examInfo.totalQuestions} 題</div>
            <div class="exam-info-item">日期：${new Date().toLocaleDateString('zh-TW')}</div>
          </div>
          
          <div class="student-info">
            <div class="student-info-item">班級：___________</div>
            <div class="student-info-item">姓名：___________</div>
            <div class="student-info-item">座號：___________</div>
          </div>
        </div>
        
        <!-- 注意事項 -->
        <div class="instructions">
          <div class="instructions-title">📋 注意事項</div>
          <ul class="instructions-list">
            <li>請仔細閱讀每一題題目</li>
            <li>選擇最適當的答案</li>
            <li>請清楚標示答案</li>
            <li>作答時間請自行掌控</li>
          </ul>
        </div>
        
        <!-- 題目區域 -->
        <div class="questions-section">
          ${questionHtml}
        </div>
        
        <!-- 解答區域 -->
        <div class="answer-section">
          <div class="answer-header-title">📝 解答與詳解</div>
          ${answerHtml}
        </div>
      </div>
    `
  }

  // 生成簡化版PDF
  generateSimplePaper(questions, examInfo) {
    let currentY = 20

    // 標題
    this.pdf.setFontSize(20)
    this.pdf.text(`${examInfo.grade} ${examInfo.subject} 測驗卷`, 105, currentY, { align: 'center' })
    currentY += 15

    // 考試資訊
    this.pdf.setFontSize(12)
    this.pdf.text(`科目：${examInfo.subject}`, 20, currentY)
    currentY += 8
    this.pdf.text(`年級：${examInfo.grade}`, 20, currentY)
    currentY += 8
    this.pdf.text(`題數：${examInfo.totalQuestions} 題`, 20, currentY)
    currentY += 8
    this.pdf.text(`日期：${new Date().toLocaleDateString('zh-TW')}`, 20, currentY)
    currentY += 15

    // 分隔線
    this.pdf.line(20, currentY, 190, currentY)
    currentY += 10

    // 題目
    this.pdf.setFontSize(12)
    questions.forEach((question, index) => {
      // 檢查是否需要換頁
      if (currentY > 250) {
        this.pdf.addPage()
        currentY = 20
      }

      // 題號
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${index + 1}.`, 20, currentY)
      
      this.pdf.setFont('helvetica', 'normal')
      
      // 題目內容 - 處理中文顯示
      const questionText = question.question || '題目內容'
      const lines = this.pdf.splitTextToSize(questionText, 165)
      this.pdf.text(lines, 30, currentY)
      currentY += lines.length * 6

      // 選項
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach(option => {
          const optionLines = this.pdf.splitTextToSize(option || '', 155)
          this.pdf.text(optionLines, 35, currentY)
          currentY += optionLines.length * 5
        })
      }

      currentY += 8 // 題目間距
    })

    // 新增解答頁
    this.pdf.addPage()
    currentY = 20

    // 解答標題
    this.pdf.setFontSize(18)
    this.pdf.text('解答', 105, currentY, { align: 'center' })
    currentY += 20

    // 解答內容
    this.pdf.setFontSize(12)
    questions.forEach((question, index) => {
      if (currentY > 270) {
        this.pdf.addPage()
        currentY = 20
      }

      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${index + 1}. 答案：${question.answer || 'A'}`, 20, currentY)
      currentY += 8

      if (question.explanation) {
        this.pdf.setFont('helvetica', 'normal')
        const explanationLines = this.pdf.splitTextToSize(`解析：${question.explanation}`, 170)
        this.pdf.text(explanationLines, 20, currentY)
        currentY += explanationLines.length * 5
      }

      currentY += 5
    })
  }

  // 生成簡化的HTML內容 - 專門用於PDF生成
  generateSimpleHtmlContent(questions, examInfo) {
    const questionHtml = questions.map((question, index) => `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <div style="font-weight: bold; margin-bottom: 8px;">${index + 1}. ${question.question || '題目內容'}</div>
        ${question.options ? question.options.map(option => `
          <div style="margin-left: 20px; margin-bottom: 4px;">${option}</div>
        `).join('') : ''}
      </div>
    `).join('')

    const answerHtml = questions.map((question, index) => `
      <div style="margin-bottom: 12px;">
        <div style="font-weight: bold; color: #2c3e50;">${index + 1}. 答案：${question.answer || 'A'}</div>
        ${question.explanation ? `
          <div style="margin-left: 20px; color: #666; font-size: 14px;">解析：${question.explanation}</div>
        ` : ''}
      </div>
    `).join('')

    return `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .info {
            font-size: 12px;
            margin-bottom: 5px;
          }
          .questions {
            margin-bottom: 30px;
          }
          .answers {
            page-break-before: always;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${examInfo.grade} ${examInfo.subject} 測驗卷</div>
          <div class="info">科目：${examInfo.subject}</div>
          <div class="info">年級：${examInfo.grade}</div>
          <div class="info">題數：${examInfo.totalQuestions} 題</div>
          <div class="info">日期：${new Date().toLocaleDateString('zh-TW')}</div>
        </div>
        
        <div class="questions">
          ${questionHtml}
        </div>
        
        <div class="answers">
          <div class="section-title">解答與詳解</div>
          ${answerHtml}
        </div>
      </body>
      </html>
    `
  }

  // 生成HTML內容
  generateHtmlContent(questions, examInfo) {
    const questionHtml = questions.map((question, index) => `
      <div class="question-item">
        <div class="question-number">${index + 1}.</div>
        <div class="question-content">
          <div class="question-text">${question.question}</div>
          ${question.options ? `
            <div class="question-options">
              ${question.options.map(option => `
                <div class="option-item">${option}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')

    const answerHtml = questions.map((question, index) => `
      <div class="answer-item">
        <div class="answer-number">${index + 1}. 答案：${question.answer}</div>
        ${question.explanation ? `
          <div class="answer-explanation">解析：${question.explanation}</div>
        ` : ''}
      </div>
    `).join('')

    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: '微軟正黑體', 'Microsoft JhengHei', '新細明體', 'PMingLiU', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
            width: 100%;
          }
          
          .exam-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          
          .exam-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .exam-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 12px;
          }
          
          .instructions {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
          
          .instructions h3 {
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .instructions ol {
            padding-left: 20px;
          }
          
          .instructions li {
            margin-bottom: 5px;
          }
          
          .question-item {
            display: flex;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .question-number {
            font-weight: 700;
            min-width: 30px;
            margin-right: 10px;
          }
          
          .question-content {
            flex: 1;
          }
          
          .question-text {
            margin-bottom: 10px;
            font-weight: 500;
          }
          
          .question-options {
            margin-left: 20px;
          }
          
          .option-item {
            margin-bottom: 8px;
            padding: 5px 0;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .answer-section {
            margin-top: 30px;
          }
          
          .answer-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          
          .answer-title {
            font-size: 20px;
            font-weight: 700;
          }
          
          .answer-item {
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .answer-number {
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          
          .answer-explanation {
            margin-left: 20px;
            color: #666;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="exam-header">
          <div class="exam-title">${examInfo.grade} ${examInfo.subject} 測驗卷</div>
          <div class="exam-info">
            <span>科目：${examInfo.subject}</span>
            <span>年級：${examInfo.grade}</span>
            <span>題數：${examInfo.totalQuestions} 題</span>
            <span>日期：${new Date().toLocaleDateString('zh-TW')}</span>
          </div>
        </div>
        
        <div class="instructions">
          <h3>注意事項：</h3>
          <ol>
            <li>請仔細閱讀每一題題目</li>
            <li>選擇最適當的答案</li>
            <li>請清楚標示答案</li>
          </ol>
        </div>
        
        <div class="questions-section">
          ${questionHtml}
        </div>
        
        <div class="page-break"></div>
        
        <div class="answer-section">
          <div class="answer-header">
            <div class="answer-title">解答與詳解</div>
          </div>
          
          ${answerHtml}
        </div>
      </body>
      </html>
    `
  }

  // 支援中文的考卷生成
  generateQuestionPaperWithChinese(questions, examInfo) {
    let currentY = 20

    // 標題 - 使用中文
    this.pdf.setFontSize(20)
    this.pdf.text(`${examInfo.grade} ${examInfo.subject}測驗卷`, 105, currentY, { align: 'center' })
    currentY += 15

    // 考試資訊
    this.pdf.setFontSize(12)
    this.pdf.text(`科目：${examInfo.subject}`, 20, currentY)
    currentY += 8
    this.pdf.text(`年級：${examInfo.grade}`, 20, currentY)
    currentY += 8
    this.pdf.text(`題數：${examInfo.totalQuestions} 題`, 20, currentY)
    currentY += 8
    this.pdf.text(`日期：${new Date().toLocaleDateString('zh-TW')}`, 20, currentY)
    currentY += 15

    // 分隔線
    this.pdf.line(20, currentY, 190, currentY)
    currentY += 10

    // 注意事項
    this.pdf.setFontSize(10)
    this.pdf.text('注意事項：', 20, currentY)
    currentY += 5
    this.pdf.text('1. 請仔細閱讀每一題題目', 25, currentY)
    currentY += 5
    this.pdf.text('2. 選擇最適當的答案', 25, currentY)
    currentY += 5
    this.pdf.text('3. 請清楚標示答案', 25, currentY)
    currentY += 15

    // 題目
    this.pdf.setFontSize(12)
    questions.forEach((question, index) => {
      // 檢查是否需要換頁
      if (currentY > 250) {
        this.pdf.addPage()
        currentY = 20
      }

      // 題號和題目
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${index + 1}.`, 20, currentY)
      
      this.pdf.setFont('helvetica', 'normal')
      
      // 處理長題目自動換行 - 保持原始中文
      const lines = this.pdf.splitTextToSize(question.question, 165)
      this.pdf.text(lines, 30, currentY)
      currentY += lines.length * 6

      // 選項
      if (question.options) {
        question.options.forEach(option => {
          const optionLines = this.pdf.splitTextToSize(option, 155)
          this.pdf.text(optionLines, 35, currentY)
          currentY += optionLines.length * 5
        })
      }

      currentY += 5 // 題目間距
    })
  }

  // 支援中文的解答頁生成
  generateAnswerSheetWithChinese(questions, examInfo) {
    let currentY = 20

    // 標題
    this.pdf.setFontSize(20)
    this.pdf.text('解答與詳解', 105, currentY, { align: 'center' })
    currentY += 20

    // 快速答案表
    this.pdf.setFontSize(14)
    this.pdf.text('快速答案對照表：', 20, currentY)
    currentY += 10

    this.pdf.setFontSize(12)
    
    // 答案表格
    const answersPerRow = 5
    for (let i = 0; i < questions.length; i += answersPerRow) {
      let lineText = ''
      for (let j = i; j < Math.min(i + answersPerRow, questions.length); j++) {
        lineText += `${j + 1}. ${questions[j].answer}    `
      }
      this.pdf.text(lineText, 20, currentY)
      currentY += 8
    }

    currentY += 10

    // 詳細解析
    this.pdf.setFontSize(14)
    this.pdf.text('詳細解析：', 20, currentY)
    currentY += 10

    this.pdf.setFontSize(10)
    questions.forEach((question, index) => {
      // 檢查是否需要換頁
      if (currentY > 250) {
        this.pdf.addPage()
        currentY = 20
      }

      // 題號和答案
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${index + 1}. 答案：${question.answer}`, 20, currentY)
      currentY += 6

      // 解析
      this.pdf.setFont('helvetica', 'normal')
      if (question.explanation) {
        const lines = this.pdf.splitTextToSize(`解析：${question.explanation}`, 170)
        this.pdf.text(lines, 20, currentY)
        currentY += lines.length * 5
      }

      currentY += 5 // 題目間距
    })
  }

  // 下載文字版本
  downloadTextVersion(questions, examInfo) {
    const content = this.generateTextVersion(questions, examInfo)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const fileName = `${examInfo.subject}_${examInfo.grade}年級_考卷_${new Date().toISOString().split('T')[0]}.txt`
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 導出實例供其他模組使用
export const examPaperService = new ExamPaperService()