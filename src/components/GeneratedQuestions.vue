<script setup>
import { ref } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { useRouter } from 'vue-router';
import { ExamPaperService } from '../services/examPaperService';

const questionStore = useQuestionStore();
const router = useRouter();
const examPaperService = new ExamPaperService();

const showAnswers = ref(false);
const isDownloading = ref(false);
const showDownloadOptions = ref(false);
const showPdfPreview = ref(false);
const pdfPreviewUrl = ref('');

const toggleAnswers = () => {
  showAnswers.value = !showAnswers.value;
};

const startPractice = () => {
  router.push('/practice');
};

const handleDownload = () => {
  showDownloadOptions.value = true;
};

const downloadPdf = async () => {
  try {
    isDownloading.value = true;
    showDownloadOptions.value = false;

    const examInfo = {
      subject: questionStore.selectedSubject === 'chinese' ? '國文' : '英文',
      grade: `國小${questionStore.selectedGrade}年級`,
      totalQuestions: questionStore.currentQuestions.length,
    };

    const pdfBlob = await examPaperService.generateExamPaperBlob(
      questionStore.currentQuestions,
      examInfo,
    );

    // 創建預覽 URL
    pdfPreviewUrl.value = URL.createObjectURL(pdfBlob);
    showPdfPreview.value = true;
  } catch (error) {
    console.error('生成PDF失敗:', error);
    alert('生成失敗，請稍後再試');
  } finally {
    isDownloading.value = false;
  }
};

const downloadPdfDirect = () => {
  if (pdfPreviewUrl.value) {
    const link = document.createElement('a');
    link.href = pdfPreviewUrl.value;
    link.download = `${
      questionStore.selectedSubject === 'chinese' ? '國文' : '英文'
    }測驗卷_${questionStore.selectedGrade}年級.pdf`;
    link.click();
    closePdfPreview();
  }
};

const downloadTextVersion = () => {
  try {
    showDownloadOptions.value = false;

    const examInfo = {
      subject: questionStore.selectedSubject === 'chinese' ? '國文' : '英文',
      grade: `國小${questionStore.selectedGrade}年級`,
      totalQuestions: questionStore.currentQuestions.length,
    };

    examPaperService.downloadTextVersion(
      questionStore.currentQuestions,
      examInfo,
    );
  } catch (error) {
    console.error('下載文字版失敗:', error);
    alert('下載失敗，請稍後再試');
  }
};

const closePdfPreview = () => {
  showPdfPreview.value = false;
  if (pdfPreviewUrl.value) {
    URL.revokeObjectURL(pdfPreviewUrl.value);
    pdfPreviewUrl.value = '';
  }
};

const regenerateQuestions = () => {
  questionStore.setCurrentQuestions([]);
  // 觸發重新生成
};
</script>

<template>
  <div class="generated-questions">
    <div class="questions-header">
      <h2>📋 生成的題目</h2>
      <p>
        {{ questionStore.selectedSubject === 'chinese' ? '國文' : '英文' }} -
        國小{{ questionStore.selectedGrade }}年級 - 共生成
        {{ questionStore.currentQuestions.length }} 題，可預覽、下載或開始練習
      </p>
    </div>

    <div class="questions-container">
      <div class="quick-actions">
        <button @click="toggleAnswers" class="btn btn-secondary">
          {{ showAnswers ? '👁️‍🗨️ 隱藏解答' : '👁️ 顯示解答' }}
        </button>

        <button @click="startPractice" class="btn btn-success">
          🎯 開始刷題
        </button>
      </div>

      <div class="questions-list">
        <div
          v-for="(question, index) in questionStore.currentQuestions"
          :key="question.id"
          class="question-item"
        >
          <div class="question-header">
            <span class="question-number">第 {{ index + 1 }} 題</span>
            <span class="question-type">
              {{ question.type === 'single' ? '單選題' : '題組題' }}
            </span>
          </div>

          <div class="question-content">
            <div class="question-text">
              {{ question.question }}
            </div>

            <div v-if="question.options" class="question-options">
              <div
                v-for="option in question.options"
                :key="option"
                class="option-item"
                :class="{
                  'correct-answer':
                    showAnswers && option.startsWith(question.answer + '.'),
                  'show-answers': showAnswers,
                }"
              >
                {{ option }}
              </div>
            </div>

            <div v-if="showAnswers" class="answer-section">
              <div class="correct-answer-label">
                <strong>正確答案：{{ question.answer }}</strong>
              </div>
              <div v-if="question.explanation" class="explanation">
                <strong>解析：</strong>
                {{ question.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="questions-actions">
        <div class="bottom-actions">
          <button @click="regenerateQuestions" class="btn btn-outline">
            🔄 重新生成
          </button>

          <button
            @click="handleDownload"
            class="btn btn-primary"
            :disabled="isDownloading"
          >
            {{ isDownloading ? '⏳ 生成中...' : '📥 下載測驗' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 下載選項彈窗 -->
    <div
      v-if="showDownloadOptions"
      class="modal-overlay"
      @click="showDownloadOptions = false"
    >
      <div class="download-modal" @click.stop>
        <div class="modal-header">
          <h3>📥 選擇下載格式</h3>
        </div>
        <div class="modal-content">
          <div class="download-option" @click="downloadPdf">
            <div class="option-icon">📄</div>
            <div class="option-info">
              <h4>PDF 格式</h4>
              <p>標準測驗卷格式，可預覽後下載</p>
            </div>
          </div>
          <div class="download-option" @click="downloadTextVersion">
            <div class="option-icon">📝</div>
            <div class="option-info">
              <h4>文字格式</h4>
              <p>純文字格式，方便編輯使用</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF 預覽彈窗 -->
    <div v-if="showPdfPreview" class="modal-overlay" @click="closePdfPreview">
      <div class="pdf-preview-modal" @click.stop>
        <div class="modal-header">
          <h3>📄 PDF 預覽</h3>
          <div class="header-actions">
            <button
              @click="downloadPdfDirect"
              class="btn btn-primary btn-small"
            >
              📥 下載
            </button>
          </div>
        </div>
        <div class="modal-content">
          <iframe
            :src="pdfPreviewUrl"
            class="pdf-viewer"
            title="PDF 預覽"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.generated-questions {
  height: 100%;
}

.questions-header {
  margin-bottom: 1.5rem;
  padding-bottom: 2rem;
  text-align: center;
  border-bottom: 2px solid #e9ecef;
}

.questions-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.4rem;
  font-weight: 600;
}

.questions-header p {
  color: #6c757d;
  margin: 0;
  font-size: 1rem;
}

.btn {
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 48px;
}

.btn-primary {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-outline {
  background: transparent;
  border: 1px solid #2c3e50;
  color: #2c3e50;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-item {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.question-header {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
}

.question-number {
  font-weight: 600;
  color: #495057;
}

.question-type {
  background: #2c3e50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.question-content {
  padding: 1.5rem;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  color: #333;
  text-align: left;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
  text-align: left;
}

.option-item.show-answers {
  border-color: #dc3545;
}

.option-item.correct-answer {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
  font-weight: 500;
}

.answer-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.correct-answer-label {
  margin-bottom: 0.5rem;
  color: #0d47a1;
}

.explanation {
  color: #1565c0;
  line-height: 1.5;
}

.questions-actions {
  margin-top: 2rem;
  border-top: 1px solid #e9ecef;
  padding-top: 1.5rem;
}

.quick-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  justify-content: center;
}

.bottom-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* 手機版響應式設計 */
@media (max-width: 768px) {
  .quick-actions,
  .bottom-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.download-modal,
.pdf-preview-modal {
  background: white;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modalAppear 0.3s ease-out;
}

.download-modal {
  max-width: 500px;
  width: 90%;
}

.pdf-preview-modal {
  max-width: 90%;
  max-height: 90%;
  width: 800px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

.modal-content {
  padding: 1.5rem;
}

.download-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.download-option:hover {
  border-color: #2c3e50;
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.download-option:last-child {
  margin-bottom: 0;
}

.option-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
}

.option-info h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.option-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.pdf-preview-modal .modal-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .questions-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }

  .pdf-preview-modal {
    width: 95%;
    height: 80%;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h3 {
    font-size: 1.1rem;
  }

  .download-option {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .option-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}
</style>
