<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { useRouter } from 'vue-router';
import { examPaperService } from '../services/examPaperService';
import TopBanner from '../components/TopBanner.vue';
import { QuestionGeneratorService } from '../services/questionGeneratorService';

const questionStore = useQuestionStore();
const router = useRouter();
const questionGeneratorService = new QuestionGeneratorService();

const isExporting = ref(false);
const selectedQuestions = ref(new Set());
const showAllAnswers = ref(false);
const isGenerating = ref(false);

const currentQuestions = computed(() => questionStore.currentQuestions || []);
const preTestQuestions = computed(() => questionStore.preTestQuestions || []);
const postTestQuestions = computed(() => questionStore.postTestQuestions || []);
const hasQuestions = computed(() => currentQuestions.value.length > 0);
const hasPrePostTest = computed(() => preTestQuestions.value.length > 0 || postTestQuestions.value.length > 0);
const selectedTab = ref('all'); // 'all', 'pretest', 'posttest'

// 根據選擇的頁籤返回對應的題目
const displayedQuestions = computed(() => {
  switch (selectedTab.value) {
    case 'pretest':
      return preTestQuestions.value;
    case 'posttest':
      return postTestQuestions.value;
    default:
      return currentQuestions.value;
  }
});

const toggleQuestionSelection = (index) => {
  if (selectedQuestions.value.has(index)) {
    selectedQuestions.value.delete(index);
  } else {
    selectedQuestions.value.add(index);
  }
};

const selectAllQuestions = () => {
  if (selectedQuestions.value.size === currentQuestions.value.length) {
    selectedQuestions.value.clear();
  } else {
    currentQuestions.value.forEach((_, index) => {
      selectedQuestions.value.add(index);
    });
  }
};

const exportToPDF = async () => {
  if (currentQuestions.value.length === 0) {
    alert('沒有題目可以匯出');
    return;
  }

  try {
    isExporting.value = true;

    const questionsToExport =
      selectedQuestions.value.size > 0
        ? currentQuestions.value.filter((_, index) =>
            selectedQuestions.value.has(index),
          )
        : currentQuestions.value;

    await examPaperService.generatePDF(
      questionsToExport,
      questionStore.selectedGrade,
      questionStore.selectedSubject,
    );
  } catch (error) {
    console.error('PDF匯出失敗:', error);
    alert('PDF匯出失敗，請稍後再試');
  } finally {
    isExporting.value = false;
  }
};

const deleteQuestion = (index) => {
  const updatedQuestions = [...currentQuestions.value];
  updatedQuestions.splice(index, 1);
  questionStore.setCurrentQuestions(updatedQuestions);
  selectedQuestions.value.delete(index);
};

const deleteSelectedQuestions = () => {
  if (selectedQuestions.value.size === 0) return;

  const updatedQuestions = currentQuestions.value.filter(
    (_, index) => !selectedQuestions.value.has(index),
  );
  questionStore.setCurrentQuestions(updatedQuestions);
  selectedQuestions.value.clear();
};

const navigateToGenerator = () => {
  router.push('/');
};

const navigateToPractice = () => {
  if (currentQuestions.value.length > 0) {
    router.push('/practice');
  }
};

const navigateToTeacherScore = () => {
  router.push('/teacher-score');
};

const regenerateQuestions = async () => {
  if (confirm('確定要重新出題嗎？目前的題目將會被清除。')) {
    await generateQuestions();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
};

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 檢查是否需要生成題目
  if (questionStore.isGenerating && currentQuestions.value.length === 0) {
    await generateQuestions();
  }
});

const generateQuestions = async () => {
  try {
    isGenerating.value = true;
    questionStore.setLoading(true);

    // 清空現有題目
    questionStore.setCurrentQuestions([]);

    const options = {
      grade: questionStore.selectedGrade,
      subject: questionStore.selectedSubject,
      associationRules: questionStore.associationRules,
      questionTypes: questionStore.questionTypes,
      extractedText: questionStore.extractedText,
      selectedRules: questionStore.selectedRules,
    };

    const result = await questionGeneratorService.generateQuestions(options);

    // 處理前後測分離的結果
    if (result.preTestQuestions && result.postTestQuestions) {
      questionStore.setPreTestQuestions(result.preTestQuestions);
      questionStore.setPostTestQuestions(result.postTestQuestions);
      questionStore.setCurrentQuestions(result.allQuestions);
    } else {
      questionStore.setCurrentQuestions(result.allQuestions || result);
    }
    questionStore.setGeneratingStatus(false);
  } catch (error) {
    console.error('生成題目失敗:', error);
    alert(`生成題目失敗：${error.message}`);
    router.push('/');
  } finally {
    isGenerating.value = false;
    questionStore.setLoading(false);
    questionStore.setGeneratingStatus(false);
  }
};
</script>

<template>
  <div class="review-page">
    <TopBanner subtitle="題目檢視" />

    <div class="review-container">
      <div class="form-header">
        <div class="header-title">
          <h2><i class="fas fa-clipboard-list"></i> 題目檢視</h2>
          <p>檢視、編輯和匯出您生成的題目</p>
        </div>
      </div>

      <!-- 生成中狀態 -->
      <div v-if="isGenerating" class="generating-status">
        <div class="generating-icon">
          <i class="fas fa-robot fa-3x"></i>
        </div>
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

      <!-- 無題目狀態 -->
      <div v-else-if="!hasQuestions && !isGenerating" class="empty-state">
        <div class="empty-icon"><i class="fas fa-file-alt fa-5x"></i></div>
        <h2>尚無題目</h2>
        <p>請先到出題設定頁面生成題目</p>
        <button @click="navigateToGenerator" class="btn btn-primary">
          前往出題設定
        </button>
      </div>

      <!-- 有題目時的內容 -->
      <div v-else class="review-content">
        <!-- 頁籤選擇器（只在有前後測時顯示） -->
        <div v-if="hasPrePostTest" class="tabs-container">
          <div class="tabs">
            <button
              @click="selectedTab = 'all'"
              :class="['tab', { active: selectedTab === 'all' }]"
            >
              <i class="fas fa-list"></i>
              全部題目 ({{ currentQuestions.length }})
            </button>
            <button
              @click="selectedTab = 'pretest'"
              :class="['tab', { active: selectedTab === 'pretest' }]"
            >
              <i class="fas fa-diagnoses"></i>
              前測題目 ({{ preTestQuestions.length }})
            </button>
            <button
              @click="selectedTab = 'posttest'"
              :class="['tab', { active: selectedTab === 'posttest' }]"
            >
              <i class="fas fa-graduation-cap"></i>
              後測題目 ({{ postTestQuestions.length }})
            </button>
          </div>
        </div>

        <!-- 工具列 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <div class="toolbar-group">
              <button @click="regenerateQuestions" class="btn btn-warning">
                <i class="fas fa-redo"></i>
                重新出題
              </button>
              <button
                @click="showAllAnswers = !showAllAnswers"
                class="btn btn-secondary"
              >
                <i
                  class="fas"
                  :class="showAllAnswers ? 'fa-eye-slash' : 'fa-eye'"
                ></i>
                {{ showAllAnswers ? '隱藏答案' : '顯示答案' }}
              </button>
            </div>
          </div>
          <div class="toolbar-right">
            <div class="toolbar-group">
              <button @click="navigateToPractice" class="btn btn-success">
                <i class="fas fa-play"></i>
                開始作答
              </button>
            </div>
          </div>
        </div>

        <!-- 題目列表 -->
        <div class="questions-list">
          <div
            v-for="(question, index) in displayedQuestions"
            :key="question.globalId || index"
            class="question-card"
            :class="{ selected: selectedQuestions.has(index) }"
          >
            <div class="question-header">
              <div class="question-meta">
                <span class="question-number">第 {{ index + 1 }} 題</span>
                <span class="question-type">{{
                  question.type === 'single' ? '單選題' : '題組題'
                }}</span>
                <!-- 顯示前後測標記 -->
                <span v-if="question.testType" :class="['test-badge', question.testType]">
                  {{ question.testType === 'pretest' ? '前測' : '後測' }}
                </span>
              </div>
            </div>

            <div class="question-body">
              <div class="question-text">{{ question.question }}</div>

              <div class="options" v-if="question.options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option"
                  :class="{
                    correct: showAllAnswers && option === question.answer,
                  }"
                >
                  {{ option }}
                </div>
              </div>

              <div class="answer-section" v-if="showAllAnswers">
                <div class="answer">
                  <strong>答案：</strong>{{ question.answer }}
                </div>
                <div class="explanation" v-if="question.explanation">
                  <strong>解析：</strong>{{ question.explanation }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-page {
  min-height: 100vh;
}

.review-container {
  width: 100%;
  padding: 2rem;
  margin-top: 80px;
}

/* 頁籤樣式 */
.tabs-container {
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: -2px;
}

.tab:hover {
  color: #495057;
  background: #f8f9fa;
}

.tab.active {
  color: #c8a882;
  border-bottom-color: #c8a882;
  font-weight: 600;
}

.tab i {
  font-size: 0.9rem;
}

/* 前後測標記 */
.test-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.test-badge.pretest {
  background: #e3f2fd;
  color: #1976d2;
}

.test-badge.posttest {
  background: #fce4ec;
  color: #c2185b;
}

/* form-header 樣式 */
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

.empty-state {
  background: white;
  border-radius: 10px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
  color: #a0a0a0;
}

.empty-state h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* 生成中狀態 */
.generating-status {
  background: white;
  border-radius: 10px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.generating-icon {
  color: #cebb6b;
  margin-bottom: 1.5rem;
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
  margin: 0 auto;
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
  background: #cebb6b;
  border-color: #cebb6b;
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
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
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

.review-content {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-icon {
  font-size: 1.5rem;
  color: #6c757d;
  margin-right: 0.5rem;
}

.toolbar-left .group-icon {
  color: #cebb6b;
}

.toolbar-right .group-icon {
  color: #28a745;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.question-number {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.question-type {
  background: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #6c757d;
}

.question-body {
  padding-left: 0;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.option {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.option.correct {
  background: #d4edda;
  border-color: #28a745;
  font-weight: 500;
}

.answer-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #d4edda;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.answer {
  margin-bottom: 0.5rem;
  line-height: 1.6;
  color: #155724;
}

.answer strong {
  color: #0b5d1e;
}

.explanation {
  margin-bottom: 0.5rem;
  line-height: 1.6;
  color: #155724;
}

.explanation strong {
  color: #0b5d1e;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
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

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
  color: #212529;
}

.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #148a9d 100%);
  color: white;
}

.btn-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

@media (max-width: 1024px) {
  .review-container {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .toolbar-group {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .group-icon {
    width: 100%;
    text-align: center;
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .question-body {
    padding-left: 0;
  }

  .review-header {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
