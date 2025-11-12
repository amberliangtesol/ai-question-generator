<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { useRouter } from 'vue-router';
import TopBanner from '../components/TopBanner.vue';

const questionStore = useQuestionStore();
const router = useRouter();

const currentQuestionIndex = ref(0);
const userAnswers = ref({});
const showResults = ref(false);
const startTime = ref(null);
const endTime = ref(null);

onMounted(() => {
  if (questionStore.currentQuestions.length > 0) {
    startTime.value = new Date();
  }
});

const currentQuestion = computed(() => {
  return questionStore.currentQuestions[currentQuestionIndex.value];
});

const totalQuestions = computed(() => {
  return questionStore.currentQuestions.length;
});

const progress = computed(() => {
  return ((currentQuestionIndex.value + 1) / totalQuestions.value) * 100;
});

const answeredCount = computed(() => {
  return Object.keys(userAnswers.value).length;
});

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === totalQuestions.value - 1;
});

const canSubmit = computed(() => {
  return answeredCount.value === totalQuestions.value;
});

const score = computed(() => {
  if (!showResults.value) return 0;

  let correct = 0;
  questionStore.currentQuestions.forEach((question, index) => {
    if (userAnswers.value[index] === question.answer) {
      correct++;
    }
  });

  return Math.round((correct / totalQuestions.value) * 100);
});

const selectAnswer = (answer) => {
  userAnswers.value[currentQuestionIndex.value] = answer;
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++;
    scrollToTop();
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    scrollToTop();
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const submitTest = () => {
  if (!canSubmit.value) {
    alert('請完成所有題目後再提交');
    return;
  }

  endTime.value = new Date();
  showResults.value = true;
};

const restartTest = () => {
  userAnswers.value = {};
  currentQuestionIndex.value = 0;
  showResults.value = false;
  startTime.value = new Date();
  endTime.value = null;
};

const backToGenerator = () => {
  router.push('/').then(() => {
    // 導航完成後滾動到頂部
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 100);
  });
};

const navigateToGenerator = () => {
  router.push('/');
};

const getElapsedTime = () => {
  if (!startTime.value || !endTime.value) return '0分0秒';

  const diff = endTime.value - startTime.value;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${minutes}分${seconds}秒`;
};

const isAnswerCorrect = (questionIndex, answer) => {
  return answer === questionStore.currentQuestions[questionIndex].answer;
};

const jumpToQuestion = (index) => {
  currentQuestionIndex.value = index;
  scrollToTop();
};
</script>

<template>
  <div class="practice-mode">
    <!-- 固定在頂端的 Banner -->
    <TopBanner subtitle="練習模式" />

    <!-- 無題目狀態 -->
    <div v-if="totalQuestions === 0" class="empty-state">
      <div class="empty-icon"><i class="fas fa-file-alt fa-5x"></i></div>
      <h2>尚無題目</h2>
      <p>請先到出題設定頁面生成題目</p>
      <button @click="navigateToGenerator" class="btn btn-primary">
        前往出題設定
      </button>
    </div>

    <!-- 測驗進行中 -->
    <div v-else-if="!showResults && currentQuestion" class="practice-container">
      <!-- form-header -->
      <div class="form-header">
        <div class="header-title">
          <h2><i class="fas fa-edit"></i> 作答頁面</h2>
          <p>測驗進行中，請專注答題</p>
        </div>
      </div>

      <!-- 頂部進度條 -->
      <div class="progress-header">
        <div class="progress-info">
          <span class="progress-text">
            第 {{ currentQuestionIndex + 1 }} 題 / 共 {{ totalQuestions }} 題
          </span>
          <span class="answered-count">
            已作答：{{ answeredCount }} / {{ totalQuestions }}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- 當前題目 -->
      <div class="question-container" v-if="currentQuestion">
        <div class="question-header">
          <span class="question-type">
            {{ currentQuestion.type === 'single' ? '單選題' : '題組題' }}
          </span>
        </div>

        <div class="question-content">
          <div class="question-text">
            {{ currentQuestion.question }}
          </div>

          <div class="answer-options" v-if="currentQuestion.options">
            <label
              v-for="option in currentQuestion.options"
              :key="option"
              class="option-label"
              :class="{
                selected:
                  userAnswers[currentQuestionIndex] === option.charAt(0),
              }"
            >
              <input
                type="radio"
                :value="option.charAt(0)"
                :checked="
                  userAnswers[currentQuestionIndex] === option.charAt(0)
                "
                @change="selectAnswer(option.charAt(0))"
                class="option-input"
              />
              <span class="option-text">{{ option }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 控制按鈕 -->
      <div class="controls">
        <button
          @click="previousQuestion"
          :disabled="currentQuestionIndex === 0"
          class="btn btn-secondary"
        >
          上一題
        </button>

        <div class="center-controls">
          <button @click="backToGenerator" class="btn btn-outline">
            返回出題
          </button>

          <button v-if="canSubmit" @click="submitTest" class="btn btn-success">
            提交測驗
          </button>
        </div>

        <button
          @click="nextQuestion"
          :disabled="isLastQuestion"
          class="btn btn-secondary"
        >
          下一題
        </button>
      </div>
    </div>

    <!-- 測驗結果 -->
    <div v-else class="results-container">
      <!-- form-header -->
      <div class="form-header">
        <div class="header-title">
          <h2><i class="fas fa-trophy"></i> 測驗結果</h2>
          <p>查看您的答題表現</p>
        </div>
      </div>

      <div class="results-header">
        <h2>測驗完成！</h2>
        <div class="score-display">
          <div class="score-circle">
            <div class="score-number">{{ score }}</div>
            <div class="score-label">分</div>
          </div>
        </div>
      </div>

      <div class="results-summary">
        <div class="summary-item">
          <span class="summary-label">總題數：</span>
          <span class="summary-value">{{ totalQuestions }} 題</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">答對題數：</span>
          <span class="summary-value">
            {{
              Object.keys(userAnswers).filter((index) =>
                isAnswerCorrect(index, userAnswers[index]),
              ).length
            }}
            題
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">作答時間：</span>
          <span class="summary-value">{{ getElapsedTime() }}</span>
        </div>
      </div>

      <div class="detailed-results">
        <h3>詳細解析</h3>
        <div class="results-list">
          <div
            v-for="(question, index) in questionStore.currentQuestions"
            :key="index"
            class="result-item"
            :class="{
              correct: isAnswerCorrect(index, userAnswers[index]),
              incorrect: !isAnswerCorrect(index, userAnswers[index]),
            }"
          >
            <div class="result-header">
              <span class="result-number">第 {{ index + 1 }} 題</span>
              <span class="result-status">
                {{
                  isAnswerCorrect(index, userAnswers[index])
                    ? '✓ 答對'
                    : '✗ 答錯'
                }}
              </span>
            </div>

            <div class="result-content">
              <div class="result-question">{{ question.question }}</div>
              <div class="result-answers">
                <div class="answer-line">
                  <strong>您的答案：</strong>
                  <span
                    :class="{
                      'wrong-answer': !isAnswerCorrect(
                        index,
                        userAnswers[index],
                      ),
                    }"
                  >
                    {{ userAnswers[index] || '未作答' }}
                  </span>
                </div>
                <div class="answer-line">
                  <strong>正確答案：</strong>
                  <span class="correct-answer">{{ question.answer }}</span>
                </div>
              </div>
              <div v-if="question.explanation" class="result-explanation">
                <strong>解析：</strong>{{ question.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button @click="restartTest" class="btn btn-primary">重新測驗</button>
        <button @click="backToGenerator" class="btn btn-secondary">
          返回出題
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.practice-mode {
  width: 100%;
  padding: 2rem;
  margin-top: 80px;
}

/* Banner 由 TopBanner 組件提供 */

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

/* 空題目狀態 */
.empty-state {
  background: white;
  border-radius: 10px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
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

/* 測驗進行中樣式 */
.practice-container {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  min-height: 600px;
}

.progress-header {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #cebb6b 0%, #b8a55f 100%);
  transition: width 0.3s ease;
}

.question-nav {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.nav-btn:hover {
  border-color: #2c3e50;
}

.nav-btn.active {
  background: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

.nav-btn.answered {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.nav-btn.answered.active {
  background: #2c3e50;
  border-color: #2c3e50;
}

.question-container {
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.question-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.question-type {
  background: #2c3e50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.question-content {
  padding: 2rem;
}

.question-text {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #333;
  text-align: left;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-label {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.option-label:hover {
  border-color: #2c3e50;
  background-color: #ecf0f1;
}

.option-label.selected {
  border-color: #2c3e50;
  background-color: #d5dbdb;
}

.option-input {
  margin: 0;
}

.option-text {
  flex: 1;
  line-height: 1.5;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.center-controls {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
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

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 測驗結果樣式 */
.results-container {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 600px;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h2 {
  color: #333;
  margin-bottom: 1rem;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(44, 62, 80, 0.3);
}

.score-number {
  font-size: 2.5rem;
  font-weight: bold;
}

.score-label {
  font-size: 1rem;
}

.results-summary {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
}

.summary-value {
  display: block;
  color: #2c3e50;
  font-weight: 500;
  font-size: 1.1rem;
}

.detailed-results {
  margin-bottom: 2rem;
}

.detailed-results h3 {
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.result-item.correct {
  border-color: #28a745;
}

.result-item.incorrect {
  border-color: #dc3545;
}

.result-header {
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-item.correct .result-header {
  background: #d4edda;
}

.result-item.incorrect .result-header {
  background: #f8d7da;
}

.result-number {
  font-weight: 600;
}

.result-status {
  font-weight: 500;
}

.result-item.correct .result-status {
  color: #155724;
}

.result-item.incorrect .result-status {
  color: #721c24;
}

.result-content {
  padding: 1rem;
}

.result-question {
  margin-bottom: 1rem;
  font-weight: 500;
  color: #333;
}

.result-answers {
  margin-bottom: 1rem;
}

.answer-line {
  margin-bottom: 0.5rem;
}

.wrong-answer {
  color: #dc3545;
  font-weight: 500;
}

.correct-answer {
  color: #28a745;
  font-weight: 500;
}

.result-explanation {
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
  color: #1565c0;
  line-height: 1.5;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    gap: 1rem;
  }

  .center-controls {
    order: -1;
  }

  .results-summary {
    flex-direction: column;
    gap: 1rem;
  }

  .results-actions {
    flex-direction: column;
  }

  .nav-buttons {
    justify-content: flex-start;
  }
}
</style>
