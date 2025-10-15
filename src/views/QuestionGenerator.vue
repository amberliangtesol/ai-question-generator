<script setup>
import { ref, computed } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { QuestionGeneratorService } from '../services/questionGeneratorService';
import GradeSelector from '../components/GradeSelector.vue';
import SubjectSelector from '../components/SubjectSelector.vue';
import AssociationRules from '../components/AssociationRules.vue';
import QuestionTypeSelector from '../components/QuestionTypeSelector.vue';
import FileUpload from '../components/FileUpload.vue';
import GeneratedQuestions from '../components/GeneratedQuestions.vue';

const questionStore = useQuestionStore();
const questionGeneratorService = new QuestionGeneratorService();
const isGenerating = ref(false);

const canGenerate = computed(() => {
  return (
    questionStore.selectedGrade &&
    questionStore.selectedSubject &&
    questionStore.questionTypes.length > 0 &&
    questionStore.questionCount > 0 &&
    !questionStore.isProcessingFile
  );
});

const generateQuestions = async () => {
  if (!canGenerate.value) return;

  try {
    isGenerating.value = true;
    questionStore.setLoading(true);
    
    // 滾動到最上面讓用戶看到loading
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // 清空現有題目
    questionStore.setCurrentQuestions([]);

    console.log('開始生成題目...');

    // 使用真實API生成題目
    const options = {
      grade: questionStore.selectedGrade,
      subject: questionStore.selectedSubject,
      associationRules: questionStore.associationRules,
      questionTypes: questionStore.questionTypes,
      extractedText: questionStore.extractedText,
    };

    const questions = await questionGeneratorService.generateQuestions(options);

    questionStore.setCurrentQuestions(questions);
  } catch (error) {
    console.error('生成題目失敗:', error);

    let errorMessage = error.message;
    if (
      error.message.includes('Network Error') ||
      error.message.includes('CORS')
    ) {
      errorMessage =
        'API調用失敗：這可能是CORS問題。請確認已重新啟動開發伺服器，或切換到模擬模式進行測試。';
    }

    alert(`生成題目失敗：${errorMessage}`);
  } finally {
    isGenerating.value = false;
    questionStore.setLoading(false);
  }
};

const resetForm = () => {
  questionStore.resetForm();
};
</script>

<template>
  <div class="question-generator">
    <!-- 固定在頂端的 Banner -->
    <div class="top-banner">
      <div class="banner-content">
        <h1>💫 AI智多興出題系統</h1>
        <p>請依序設定出題參數，系統將為您生成客製化題目</p>
      </div>
    </div>

    <div class="main-content">
      <div class="generator-layout">
        <!-- 左側表單區域 -->
        <div class="form-container">
          <div class="form-header">
            <h2>📝 AI 出題設定</h2>
            <p>請依照以下步驟完成設定，系統將為您生成客製化題目</p>
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="step-number">1</div>
              <div class="step-info">
                <h3>基本設定</h3>
                <p>選擇年級和科目</p>
              </div>
            </div>
            <div class="form-grid">
              <GradeSelector />
              <SubjectSelector />
            </div>
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="step-number">2</div>
              <div class="step-info">
                <h3>出題內容</h3>
                <p>設定出題要求和題型</p>
              </div>
            </div>
            <AssociationRules />
            <QuestionTypeSelector />
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="step-number">3</div>
              <div class="step-info">
                <h3>參考資料（選填）</h3>
                <p>上傳PDF檔案作為出題參考</p>
              </div>
            </div>
            <FileUpload />

            <!-- 文字辨識處理中狀態 -->
            <div
              v-if="questionStore.isProcessingFile"
              class="processing-status"
            >
              <div class="processing-icon">⏳</div>
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
                <h4>📄 PDF 文字辨識結果</h4>
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
              🔄 重置設定
            </button>
            <button
              @click="generateQuestions"
              class="btn btn-primary"
              :disabled="!canGenerate || isGenerating"
            >
              {{ isGenerating ? '⏳ 生成中...' : '🚀 開始出題' }}
            </button>
          </div>
        </div>

        <!-- 右側結果區域 -->
        <div class="results-container">
          <GeneratedQuestions
            v-if="questionStore.currentQuestions.length > 0"
          />

          <!-- 題目生成中狀態 -->
          <div v-else-if="isGenerating" class="generating-status">
            <div class="generating-icon">🤖</div>
            <h3>AI 正在生成題目中...</h3>
            <p>請稍候，系統正在為您客製化出題</p>

            <div class="generating-progress">
              <div class="progress-steps">
                <div class="step active">
                  <span class="step-dot"></span>
                  <span>分析需求</span>
                </div>
                <div class="step active">
                  <span class="step-dot"></span>
                  <span>生成題目</span>
                </div>
                <div class="step">
                  <span class="step-dot"></span>
                  <span>格式化結果</span>
                </div>
              </div>

              <div class="fake-progress">
                <div class="progress-bar-container">
                  <div class="progress-bar-fill generating-animation"></div>
                </div>
                <div class="progress-text">正在處理中...</div>
              </div>
            </div>
          </div>

          <div v-else class="no-results">
            <div class="no-results-icon">📝</div>
            <h3>準備開始出題</h3>
            <p>請完成左側的設定，然後點擊「開始出題」來生成專屬題目</p>
            <div class="progress-indicators">
              <div
                class="progress-step"
                :class="{
                  completed:
                    questionStore.selectedGrade &&
                    questionStore.selectedSubject,
                }"
              >
                <span class="step-icon">{{
                  questionStore.selectedGrade && questionStore.selectedSubject
                    ? '✅'
                    : '1️⃣'
                }}</span>
                <span>基本設定</span>
              </div>
              <div
                class="progress-step"
                :class="{ completed: questionStore.questionTypes.length > 0 }"
              >
                <span class="step-icon">{{
                  questionStore.questionTypes.length > 0 ? '✅' : '2️⃣'
                }}</span>
                <span>選擇題型</span>
              </div>
              <div class="progress-step optional">
                <span class="step-icon">3️⃣</span>
                <span>參考資料（選填）</span>
              </div>
            </div>
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

.top-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: #2c3e50;
  color: white;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
}

.banner-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem 2rem;
  text-align: center;
}

.banner-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.banner-content p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.95;
  font-weight: 400;
}

.main-content {
  margin-top: 30px;
  padding: 1rem 2rem;
}

.generator-layout {
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 1.5rem;
  min-height: 600px;
  max-width: 1600px;
  margin: 0 auto;
}

.form-container {
  background: white;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 140px;
}

.results-container {
  background: white;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  padding: 2rem;
  margin-top: 50px;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-results h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.no-results p {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  max-width: 300px;
  line-height: 1.5;
}

.progress-indicators {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s;
  min-width: 200px;
}

.progress-step.completed {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.progress-step.optional {
  opacity: 0.7;
}

.step-icon {
  font-size: 1.2rem;
  width: 30px;
  text-align: center;
}

.progress-step span:last-child {
  font-weight: 500;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.form-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
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
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-info h3 {
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
}

.step-info p {
  color: #6c757d;
  margin: 0;
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
  animation: spin 3s linear infinite;
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
  font-size: 4rem;
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
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-container {
    position: static;
  }

  .banner-content h1 {
    font-size: 1.5rem;
  }

  .banner-content p {
    font-size: 0.9rem;
  }

  .main-content {
    margin-top: 110px;
    padding: 1rem;
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
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.4);
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
