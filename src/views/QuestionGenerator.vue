<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { useRouter } from 'vue-router';
import { QuestionGeneratorService } from '../services/questionGeneratorService';
import GradeSelector from '../components/GradeSelector.vue';
import AssociationRules from '../components/AssociationRules.vue';
import QuestionTypeSelector from '../components/QuestionTypeSelector.vue';
import FileUpload from '../components/FileUpload.vue';
import TopBanner from '../components/TopBanner.vue';

const questionStore = useQuestionStore();
const router = useRouter();
const questionGeneratorService = new QuestionGeneratorService();
const isGenerating = ref(false);

// 自動設定科目為國文
onMounted(() => {
  questionStore.setSubject('chinese');
});

const canGenerate = computed(() => {
  return (
    questionStore.selectedGrade &&
    questionStore.questionTypes.length > 0 &&
    questionStore.questionCount > 0 &&
    !questionStore.isProcessingFile
  );
});

const generateQuestions = () => {
  if (!canGenerate.value) return;

  // 設置生成參數到 store
  questionStore.setGeneratingStatus(true);

  // 立即導航到題目檢視頁面
  router.push('/review');
};

const resetForm = () => {
  questionStore.resetForm();
};
</script>

<template>
  <div class="question-generator">
    <!-- 固定在頂端的 Banner -->
    <TopBanner />

    <div class="main-content">
      <div class="generator-layout">
        <!-- 表單區域 -->
        <div class="form-header">
          <div class="header-title">
            <h2><i class="fas fa-cog"></i> AI 出題設定</h2>
            <p>請依照以下步驟完成設定</p>
          </div>
        </div>
        <div class="form-container">
          <div class="form-section">
            <div class="section-header">
              <div class="step-number">1</div>
              <div class="step-info">
                <h3>基本設定</h3>
              </div>
            </div>
            <div class="form-grid">
              <GradeSelector />
            </div>
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="step-number">2</div>
              <div class="step-info">
                <h3>出題內容</h3>
                <span class="step-desc">設定關聯規則</span>
              </div>
            </div>
            <AssociationRules />
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="step-number">3</div>
              <div class="step-info">
                <h3>題型與題數</h3>
              </div>
            </div>
            <QuestionTypeSelector />
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="step-number">4</div>
              <div class="step-info">
                <h3>參考資料</h3>
                <span class="step-desc">（選填）上傳PDF檔案作為出題參考</span>
              </div>
            </div>
            <FileUpload />

            <!-- 文字辨識處理中狀態 -->
            <div
              v-if="questionStore.isProcessingFile"
              class="processing-status"
            >
              <div class="processing-icon">
                <i class="fas fa-hourglass-half fa-spin"></i>
              </div>
              <div class="processing-text">
                <strong>正在處理PDF文件...</strong>
                <p>請耐心等待，文字辨識完成後即可開始出題</p>
              </div>
            </div>

            <!-- PDF 文字辨識結果區域 -->
            <div
              v-if="
                questionStore.extractedText && !questionStore.isProcessingFile
              "
              class="extracted-text-section"
            >
              <div class="extracted-text-header">
                <h4><i class="fas fa-file-pdf"></i> PDF 文字辨識結果</h4>
                <div class="text-stats">
                  共 {{ questionStore.extractedText.length }} 字
                </div>
              </div>
              <div class="extracted-text-content">
                {{ questionStore.extractedText }}
              </div>
              <div class="form-hint">此內容已自動包含在出題參考資料中</div>
            </div>
          </div>

          <div class="form-actions">
            <button
              @click="resetForm"
              class="btn btn-secondary"
              :disabled="isGenerating"
            >
              <i class="fas fa-redo"></i> 重置設定
            </button>
            <button
              @click="generateQuestions"
              class="btn btn-primary"
              :disabled="!canGenerate || isGenerating"
            >
              {{ isGenerating ? '' : '' }}
              <i v-if="isGenerating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-rocket"></i>
              {{ isGenerating ? ' 生成中...' : ' 開始出題' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-generator {
  width: 100%;
  max-width: none;
  min-height: 100vh;
}

/* Banner 由 TopBanner 組件提供 */

.question-generator .main-content {
  margin-top: 0;
  padding: 0;
  width: 100%;
}

.generator-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2rem;
  margin-top: 80px;
}

.form-container {
  background: white;
  border-radius: 10px;
  padding: 2.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 0 auto;
}

.results-container {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 0 auto;
  min-height: 400px;
}

.form-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.header-title {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  justify-content: center;
}

.form-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
}

.form-header p {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.form-section:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-info h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
}

.step-desc {
  color: #6c757d;
  font-size: 0.9rem;
}

.extracted-text-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.extracted-text-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.extracted-text-header h4 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.1rem;
}

.text-stats {
  font-size: 0.9rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.extracted-text-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 5px;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #495057;
  margin-bottom: 0.5rem;
}

.extracted-text-content::-webkit-scrollbar {
  width: 6px;
}

.extracted-text-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.extracted-text-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.extracted-text-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.form-hint {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
}

.processing-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fff3cd 0%, #fdf5e6 100%);
  border: 1px solid #f0d800;
  border-radius: 8px;
  animation: pulse 2s infinite;
}

.processing-icon {
  font-size: 2rem;
}

.processing-text strong {
  color: #856404;
  display: block;
  margin-bottom: 0.25rem;
}

.processing-text p {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.generating-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  text-align: center;
  padding: 2rem;
}

.generating-icon {
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.generating-status h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.generating-status p {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.generating-progress {
  width: 100%;
  max-width: 400px;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.step.active {
  color: #2c3e50;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e9ecef;
  border: 2px solid #dee2e6;
}

.step.active .step-dot {
  background: #2c3e50;
  border-color: #2c3e50;
  animation: pulse-dot 1.5s infinite;
}

.fake-progress {
  margin-top: 1rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: 4px;
}

.generating-animation {
  width: 70%;
  animation: progress-wave 3s ease-in-out infinite;
}

.progress-text {
  font-size: 0.9rem;
  color: #6c757d;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes progress-wave {
  0% {
    width: 30%;
  }
  50% {
    width: 80%;
  }
  100% {
    width: 70%;
  }
}

/* 手機版響應式設計 */
@media (max-width: 1024px) {
  .generator-layout {
    gap: 1.5rem;
    padding: 1rem;
  }

  .banner-content h1 {
    font-size: 1.5rem;
  }

  .banner-content p {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}

.form-section h3 {
  color: #333;
  font-size: 1.2rem;
  text-align: left;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #b8a55f 0%, #a69550 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(206, 187, 107, 0.4);
}

.btn-secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
