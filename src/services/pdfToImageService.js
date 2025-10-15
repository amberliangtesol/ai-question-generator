import * as pdfjsLib from 'pdfjs-dist'

// 設定PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export class PDFToImageService {
  constructor() {
    this.maxPages = 3 // 限制處理頁數，避免過多圖片
  }

  async convertPDFToImages(arrayBuffer) {
    try {
      console.log('開始轉換PDF到圖片...')
      
      // 載入PDF文件
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      const numPages = Math.min(pdf.numPages, this.maxPages)
      
      console.log(`PDF有${pdf.numPages}頁，將處理前${numPages}頁`)
      
      const images = []
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          // 設定縮放比例，平衡品質和檔案大小
          const scale = 1.5
          const viewport = page.getViewport({ scale })
          
          canvas.height = viewport.height
          canvas.width = viewport.width
          
          // 渲染頁面到canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          // 轉換為base64圖片
          const imageData = canvas.toDataURL('image/jpeg', 0.8)
          const base64Data = imageData.split(',')[1] // 移除data:image/jpeg;base64,前綴
          
          images.push({
            pageNumber: pageNum,
            base64: base64Data,
            width: viewport.width,
            height: viewport.height
          })
          
          console.log(`第${pageNum}頁轉換完成`)
          
        } catch (pageError) {
          console.error(`轉換第${pageNum}頁失敗:`, pageError)
        }
      }
      
      console.log(`PDF轉換完成，共${images.length}張圖片`)
      return images
      
    } catch (error) {
      console.error('PDF轉圖片失敗:', error)
      throw new Error('PDF轉換失敗，請確認檔案格式正確')
    }
  }

  // 從檔案物件轉換
  async convertFileToImages(file) {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file)
      return await this.convertPDFToImages(arrayBuffer)
    } catch (error) {
      console.error('檔案轉換失敗:', error)
      throw error
    }
  }

  // 檔案轉ArrayBuffer
  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // 壓縮圖片以減少API調用成本
  compressImage(base64Data, quality = 0.6) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 調整尺寸
        const maxWidth = 1024
        const maxHeight = 1024
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        const compressedData = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedData.split(',')[1])
      }
      img.src = `data:image/jpeg;base64,${base64Data}`
    })
  }
}