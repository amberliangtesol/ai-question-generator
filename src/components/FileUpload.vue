<script setup>
import { ref } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { OpenAIService } from '../services/apiService';

const questionStore = useQuestionStore();
const openaiService = new OpenAIService();

const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);

const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
    const file = files[0];

    // 即時檢查檔案類型和大小
    if (file.type !== 'application/pdf') {
      alert('請選擇 PDF 檔案');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(
        `檔案大小 ${fileSizeMB}MB 超過限制\n\nOpenAI Files API 限制：\n• 單個檔案最大 10MB\n• 總內容限制 32MB\n\n請選擇較小的檔案或壓縮後再上傳。`,
      );
      return;
    }

    processFile(file);
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const processFile = async (file) => {
  // 檢查檔案類型
  if (file.type !== 'application/pdf') {
    alert('請選擇PDF檔案');
    return;
  }

  // 檢查檔案大小 (限制10MB - OpenAI Files API 限制)
  if (file.size > 10 * 1024 * 1024) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    alert(
      `檔案大小 ${fileSizeMB}MB 超過限制\n\nOpenAI Files API 限制：\n• 單個檔案最大 10MB\n• 總內容限制 32MB\n\n請選擇較小的檔案或壓縮後再上傳。`,
    );
    return;
  }

  try {
    isUploading.value = true;
    uploadProgress.value = 0;
    questionStore.setProcessingFile(true);

    console.log('開始上傳PDF檔案到OpenAI...');

    // 設定進度更新
    const updateProgress = (progress) => {
      uploadProgress.value = Math.min(progress, 95);
    };

    // 1. 上傳檔案到OpenAI (0% -> 70%)
    updateProgress(10);
    const fileId = await openaiService.uploadFile(file);
    console.log('檔案上傳完成，文件ID:', fileId);
    updateProgress(70);

    // 2. 儲存檔案資訊
    questionStore.setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      fileId: fileId,
    });

    // 3. 使用檔案ID處理文字內容 (70% -> 90%)
    updateProgress(80);
    const extractResult = await openaiService.extractTextFromFile(fileId);

    if (extractResult) {
      questionStore.setExtractedText(extractResult);
      console.log('PDF文字提取完成');
    } else {
      questionStore.setExtractedText('PDF文字提取完成，但未能提取到內容');
    }
    updateProgress(90);

    // 完成
    updateProgress(100);

    setTimeout(() => {
      isUploading.value = false;
      uploadProgress.value = 0;
      questionStore.setProcessingFile(false);
    }, 500);
  } catch (error) {
    console.error('檔案處理失敗:', error);
    let errorMessage = '檔案處理失敗，請稍後再試';

    if (error.message.includes('PDF轉換失敗')) {
      errorMessage = 'PDF檔案可能已損壞或格式不支援';
    }

    alert(errorMessage);
    isUploading.value = false;
    uploadProgress.value = 0;
    questionStore.setProcessingFile(false);
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // 移除 data:application/pdf;base64, 前綴
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const removeFile = () => {
  questionStore.setUploadedFile(null);
  questionStore.setExtractedText('');
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="file-upload">
    <div class="form-group">
      <div class="file-limitations">
        <strong>檔案限制：</strong>
        <ul>
          <li>僅支援 PDF 格式</li>
          <li>單個檔案最大 10MB</li>
          <li>建議文字清晰的掃描檔或原生PDF</li>
        </ul>
      </div>

      <!-- 上傳區域 -->
      <div
        v-if="!questionStore.uploadedFile"
        class="upload-area"
        :class="{
          'drag-over': isDragOver,
          uploading: isUploading,
        }"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @click="$refs.fileInput.click()"
      >
        <div v-if="!isUploading" class="upload-content">
          <div class="upload-icon">📄</div>
          <div class="upload-text">
            <p class="upload-primary">點擊或拖拽PDF檔案到此處</p>
            <p class="upload-secondary">支援PDF格式，檔案大小限制10MB</p>
          </div>
        </div>

        <div v-else class="upload-progress">
          <div class="progress-text">
            {{
              uploadProgress < 70
                ? '檔案上傳中...'
                : uploadProgress < 90
                ? 'GPT 分析文件內容中...'
                : '處理完成中...'
            }}
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          <div class="progress-percent">{{ uploadProgress }}%</div>
        </div>
      </div>

      <!-- 已上傳檔案顯示 -->
      <div
        v-if="questionStore.uploadedFile && !isUploading"
        class="uploaded-file"
      >
        <div class="file-info">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <div class="file-name">{{ questionStore.uploadedFile.name }}</div>
            <div class="file-size">
              {{ formatFileSize(questionStore.uploadedFile.size) }}
              <span v-if="questionStore.uploadedFile.pageCount">
                · {{ questionStore.uploadedFile.pageCount }} 頁
              </span>
            </div>
          </div>
          <button @click="removeFile" class="remove-btn" title="移除檔案">
            ×
          </button>
        </div>
      </div>

      <!-- 隱藏的檔案輸入 -->
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        style="display: none"
        @change="handleFileSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.file-upload {
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  text-align: left;
}

.upload-hint {
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.file-limitations {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 5px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  text-align: left;
}

.file-limitations strong {
  color: #495057;
  display: block;
  margin-bottom: 0.5rem;
}

.file-limitations ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #6c757d;
}

.file-limitations li {
  margin-bottom: 0.25rem;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.upload-area:hover {
  border-color: #2c3e50;
  background-color: #ecf0f1;
}

.upload-area.drag-over {
  border-color: #2c3e50;
  background-color: #d5dbdb;
  transform: scale(1.02);
}

.upload-area.uploading {
  cursor: not-allowed;
  border-color: #28a745;
  background-color: #f8fff9;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.upload-primary {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.upload-secondary {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.progress-text {
  font-weight: 500;
  color: #28a745;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 0.9rem;
  font-weight: 500;
  color: #28a745;
}

.uploaded-file {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background-color: white;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.file-icon {
  font-size: 2rem;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.file-size {
  font-size: 0.9rem;
  color: #666;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background: #c82333;
}

.extracted-text {
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.extracted-text h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
}

.text-preview {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #495057;
  max-height: 120px;
  overflow-y: auto;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .upload-area {
    padding: 1.5rem 1rem;
  }

  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .remove-btn {
    align-self: flex-end;
  }
}
</style>
