<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { useRouter } from 'vue-router';
import TopBanner from '../components/TopBanner.vue';

const questionStore = useQuestionStore();
const router = useRouter();

// 模擬學生作答數據 (實際應該從後端獲取)
const studentAnswers = ref([]);
const selectedStudent = ref(null);
const showDetails = ref(false);

// 生成模擬學生數據
onMounted(() => {
  generateMockStudentData();
});

const generateMockStudentData = () => {
  // 簡化學生資料，只用編號
  const mockStudents = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `學生${i + 1}`
  }));

  // 為每個學生生成作答記錄
  studentAnswers.value = mockStudents.map(student => {
    const preTestAnswers = {};
    const postTestAnswers = {};
    
    // 模擬前測作答
    questionStore.preTestQuestions.forEach((q, idx) => {
      // 隨機生成答案，正確率約70%
      const isCorrect = Math.random() > 0.3;
      preTestAnswers[idx] = isCorrect ? q.answer : getRandomWrongAnswer(q.answer);
    });
    
    // 模擬後測作答 - 與前測有相關性
    questionStore.postTestQuestions.forEach((q, idx) => {
      // 如果前測對了，後測80%機率也對
      // 如果前測錯了，後測50%機率對
      const preTestIdx = idx; // 假設前後測題目索引對應
      const preTestCorrect = preTestAnswers[preTestIdx] === questionStore.preTestQuestions[preTestIdx]?.answer;
      const postTestCorrectProb = preTestCorrect ? 0.8 : 0.5;
      const isCorrect = Math.random() < postTestCorrectProb;
      postTestAnswers[idx] = isCorrect ? q.answer : getRandomWrongAnswer(q.answer);
    });
    
    return {
      ...student,
      preTestAnswers,
      postTestAnswers,
      timestamp: new Date()
    };
  });
};

const getRandomWrongAnswer = (correctAnswer) => {
  const options = ['A', 'B', 'C', 'D'];
  const wrongOptions = options.filter(opt => opt !== correctAnswer);
  return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
};

// 計算前測成績
const calculatePreTestScore = (student) => {
  if (!student || questionStore.preTestQuestions.length === 0) return 0;
  
  let correct = 0;
  questionStore.preTestQuestions.forEach((q, idx) => {
    if (student.preTestAnswers[idx] === q.answer) {
      correct++;
    }
  });
  
  return Math.round((correct / questionStore.preTestQuestions.length) * 100);
};

// 計算後測成績
const calculatePostTestScore = (student) => {
  if (!student || questionStore.postTestQuestions.length === 0) return 0;
  
  let correct = 0;
  questionStore.postTestQuestions.forEach((q, idx) => {
    if (student.postTestAnswers[idx] === q.answer) {
      correct++;
    }
  });
  
  return Math.round((correct / questionStore.postTestQuestions.length) * 100);
};

// 計算進步幅度
const calculateImprovement = (student) => {
  const preScore = calculatePreTestScore(student);
  const postScore = calculatePostTestScore(student);
  return postScore - preScore;
};

// 分析相關性
const analyzeCorrelation = computed(() => {
  if (studentAnswers.value.length === 0) return null;
  
  // 計算每個規則的前後測通過率
  const ruleAnalysis = {};
  
  // 獲取所有唯一的規則ID
  const allRuleIds = new Set();
  questionStore.preTestQuestions.forEach(q => {
    if (q.ruleIds) {
      q.ruleIds.forEach(id => allRuleIds.add(id));
    }
  });
  
  allRuleIds.forEach(ruleId => {
    ruleAnalysis[ruleId] = {
      preTestPassRate: 0,
      postTestPassRate: 0,
      bothPassRate: 0,
      improvementRate: 0
    };
    
    // 計算每個規則的通過率
    let preTestPass = 0;
    let postTestPass = 0;
    let bothPass = 0;
    let totalStudents = studentAnswers.value.length;
    
    studentAnswers.value.forEach(student => {
      // 找出與此規則相關的題目
      const preTestQuestionsForRule = questionStore.preTestQuestions.filter(
        q => q.ruleIds && q.ruleIds.includes(ruleId)
      );
      const postTestQuestionsForRule = questionStore.postTestQuestions.filter(
        q => q.ruleIds && q.ruleIds.includes(ruleId)
      );
      
      // 計算該學生在此規則的前測正確率
      let preCorrect = 0;
      preTestQuestionsForRule.forEach(q => {
        const qIdx = questionStore.preTestQuestions.indexOf(q);
        if (student.preTestAnswers[qIdx] === q.answer) {
          preCorrect++;
        }
      });
      const prePassThisRule = preTestQuestionsForRule.length > 0 && 
        (preCorrect / preTestQuestionsForRule.length) >= 0.6;
      
      // 計算該學生在此規則的後測正確率
      let postCorrect = 0;
      postTestQuestionsForRule.forEach(q => {
        const qIdx = questionStore.postTestQuestions.indexOf(q);
        if (student.postTestAnswers[qIdx] === q.answer) {
          postCorrect++;
        }
      });
      const postPassThisRule = postTestQuestionsForRule.length > 0 && 
        (postCorrect / postTestQuestionsForRule.length) >= 0.6;
      
      if (prePassThisRule) preTestPass++;
      if (postPassThisRule) postTestPass++;
      if (prePassThisRule && postPassThisRule) bothPass++;
    });
    
    ruleAnalysis[ruleId].preTestPassRate = Math.round((preTestPass / totalStudents) * 100);
    ruleAnalysis[ruleId].postTestPassRate = Math.round((postTestPass / totalStudents) * 100);
    ruleAnalysis[ruleId].bothPassRate = Math.round((bothPass / totalStudents) * 100);
    ruleAnalysis[ruleId].improvementRate = ruleAnalysis[ruleId].postTestPassRate - ruleAnalysis[ruleId].preTestPassRate;
  });
  
  return ruleAnalysis;
});

// 查看學生詳情
const viewStudentDetails = (student) => {
  selectedStudent.value = student;
  showDetails.value = true;
};

// 關閉詳情
const closeDetails = () => {
  showDetails.value = false;
  selectedStudent.value = null;
};

// 檢查某題是否答對
const isAnswerCorrect = (testType, questionIndex, student) => {
  if (testType === 'pre') {
    const question = questionStore.preTestQuestions[questionIndex];
    return student.preTestAnswers[questionIndex] === question?.answer;
  } else {
    const question = questionStore.postTestQuestions[questionIndex];
    return student.postTestAnswers[questionIndex] === question?.answer;
  }
};

// 獲取題目對應的規則
const getQuestionRules = (question) => {
  if (!question.ruleIds || question.ruleIds.length === 0) return '無';
  return question.ruleIds.join(', ');
};

// 返回出題頁面
const backToGenerator = () => {
  router.push('/');
};
</script>

<template>
  <div class="teacher-score-view">
    <TopBanner subtitle="教師成績檢視" />
    
    <div class="score-container">
      <!-- 標題區 -->
      <div class="form-header">
        <div class="header-title">
          <h2><i class="fas fa-chart-line"></i> 前後測成績分析</h2>
          <p>查看學生前測與後測的表現對比</p>
        </div>
      </div>
      
      <!-- 整體統計 -->
      <div class="overall-stats">
        <div class="stat-card">
          <div class="stat-label">班級人數</div>
          <div class="stat-value">{{ studentAnswers.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">前測平均</div>
          <div class="stat-value">
            {{ Math.round(studentAnswers.reduce((sum, s) => sum + calculatePreTestScore(s), 0) / studentAnswers.length) || 0 }}分
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">後測平均</div>
          <div class="stat-value">
            {{ Math.round(studentAnswers.reduce((sum, s) => sum + calculatePostTestScore(s), 0) / studentAnswers.length) || 0 }}分
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均進步</div>
          <div class="stat-value" :class="{ 
            'positive': studentAnswers.reduce((sum, s) => sum + calculateImprovement(s), 0) > 0,
            'negative': studentAnswers.reduce((sum, s) => sum + calculateImprovement(s), 0) < 0
          }">
            {{ Math.round(studentAnswers.reduce((sum, s) => sum + calculateImprovement(s), 0) / studentAnswers.length) || 0 }}分
          </div>
        </div>
      </div>
      
      <!-- 學生成績列表 -->
      <div class="students-section">
        <h3>學生成績一覽</h3>
        <div class="students-table">
          <table>
            <thead>
              <tr>
                <th>學生</th>
                <th>前測成績</th>
                <th>後測成績</th>
                <th>對應關係</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentAnswers" :key="student.id">
                <td>{{ student.name }}</td>
                <td>
                  <span class="score-badge" :class="{
                    'high': calculatePreTestScore(student) >= 80,
                    'medium': calculatePreTestScore(student) >= 60 && calculatePreTestScore(student) < 80,
                    'low': calculatePreTestScore(student) < 60
                  }">
                    {{ calculatePreTestScore(student) }}分
                  </span>
                </td>
                <td>
                  <span class="score-badge" :class="{
                    'high': calculatePostTestScore(student) >= 80,
                    'medium': calculatePostTestScore(student) >= 60 && calculatePostTestScore(student) < 80,
                    'low': calculatePostTestScore(student) < 60
                  }">
                    {{ calculatePostTestScore(student) }}分
                  </span>
                </td>
                <td>
                  <span class="improvement-badge" :class="{
                    'positive': calculateImprovement(student) > 0,
                    'neutral': calculateImprovement(student) === 0,
                    'negative': calculateImprovement(student) < 0
                  }">
                    {{ calculateImprovement(student) > 0 ? '+' : '' }}{{ calculateImprovement(student) }}分
                  </span>
                </td>
                <td>
                  <button @click="viewStudentDetails(student)" class="btn-detail">
                    查看詳情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 關聯規則分析 -->
      <div class="correlation-section" v-if="analyzeCorrelation">
        <h3>關聯規則通過率分析</h3>
        <div class="correlation-table">
          <table>
            <thead>
              <tr>
                <th>規則編號</th>
                <th>前測通過率</th>
                <th>後測通過率</th>
                <th>同時通過率</th>
                <th>進步幅度</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(analysis, ruleId) in analyzeCorrelation" :key="ruleId">
                <td>規則 {{ ruleId }}</td>
                <td>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill pre-test" :style="{ width: analysis.preTestPassRate + '%' }"></div>
                    <span class="progress-text">{{ analysis.preTestPassRate }}%</span>
                  </div>
                </td>
                <td>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill post-test" :style="{ width: analysis.postTestPassRate + '%' }"></div>
                    <span class="progress-text">{{ analysis.postTestPassRate }}%</span>
                  </div>
                </td>
                <td>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill both-pass" :style="{ width: analysis.bothPassRate + '%' }"></div>
                    <span class="progress-text">{{ analysis.bothPassRate }}%</span>
                  </div>
                </td>
                <td>
                  <span class="improvement-badge" :class="{
                    'positive': analysis.improvementRate > 0,
                    'neutral': analysis.improvementRate === 0,
                    'negative': analysis.improvementRate < 0
                  }">
                    {{ analysis.improvementRate > 0 ? '+' : '' }}{{ analysis.improvementRate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 返回按鈕 -->
      <div class="action-buttons">
        <button @click="backToGenerator" class="btn btn-secondary">
          <i class="fas fa-arrow-left"></i> 返回出題
        </button>
      </div>
    </div>
    
    <!-- 學生詳情彈窗 -->
    <div v-if="showDetails && selectedStudent" class="modal-overlay" @click="closeDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedStudent.name }} - 作答詳情</h3>
          <button @click="closeDetails" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <!-- 基本資訊 -->
          <div class="student-info">
            <span>學生：{{ selectedStudent.name }}</span>
            <span>前測：{{ calculatePreTestScore(selectedStudent) }}分</span>
            <span>後測：{{ calculatePostTestScore(selectedStudent) }}分</span>
          </div>
          
          <!-- 前後測對照表 -->
          <div class="test-comparison">
            <h4>前後測答題對照</h4>
            
            <!-- 前測題目 -->
            <div class="test-section" v-if="questionStore.preTestQuestions.length > 0">
              <h5>前測題目（診斷）</h5>
              <div class="question-results">
                <div v-for="(question, idx) in questionStore.preTestQuestions" :key="`pre-${idx}`" 
                     class="question-result-item">
                  <div class="question-header">
                    <span class="question-number">前測 Q{{ idx + 1 }}</span>
                    <span class="question-rule">規則: {{ getQuestionRules(question) }}</span>
                    <span class="result-badge" :class="{
                      'correct': isAnswerCorrect('pre', idx, selectedStudent),
                      'incorrect': !isAnswerCorrect('pre', idx, selectedStudent)
                    }">
                      {{ isAnswerCorrect('pre', idx, selectedStudent) ? '✓ 正確' : '✗ 錯誤' }}
                    </span>
                  </div>
                  <div class="question-detail">
                    <div class="question-text">{{ question.question }}</div>
                    <div class="answer-info">
                      <span>學生答案：{{ selectedStudent.preTestAnswers[idx] || '未作答' }}</span>
                      <span>正確答案：{{ question.answer }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 後測題目 -->
            <div class="test-section" v-if="questionStore.postTestQuestions.length > 0">
              <h5>後測題目（補強）</h5>
              <div class="question-results">
                <div v-for="(question, idx) in questionStore.postTestQuestions" :key="`post-${idx}`" 
                     class="question-result-item">
                  <div class="question-header">
                    <span class="question-number">後測 Q{{ idx + 1 }}</span>
                    <span class="question-rule">規則: {{ getQuestionRules(question) }}</span>
                    <span class="result-badge" :class="{
                      'correct': isAnswerCorrect('post', idx, selectedStudent),
                      'incorrect': !isAnswerCorrect('post', idx, selectedStudent)
                    }">
                      {{ isAnswerCorrect('post', idx, selectedStudent) ? '✓ 正確' : '✗ 錯誤' }}
                    </span>
                  </div>
                  <div class="question-detail">
                    <div class="question-text">{{ question.question }}</div>
                    <div class="answer-info">
                      <span>學生答案：{{ selectedStudent.postTestAnswers[idx] || '未作答' }}</span>
                      <span>正確答案：{{ question.answer }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 相關性分析 -->
            <div class="correlation-analysis">
              <h5>學習成效分析</h5>
              <div class="analysis-summary">
                <p v-if="calculateImprovement(selectedStudent) > 0" class="positive-feedback">
                  <i class="fas fa-check-circle"></i>
                  該學生在後測中進步了 {{ calculateImprovement(selectedStudent) }} 分，顯示補強教學有效果。
                </p>
                <p v-else-if="calculateImprovement(selectedStudent) < 0" class="negative-feedback">
                  <i class="fas fa-exclamation-circle"></i>
                  該學生在後測中退步了 {{ Math.abs(calculateImprovement(selectedStudent)) }} 分，需要進一步關注。
                </p>
                <p v-else class="neutral-feedback">
                  <i class="fas fa-info-circle"></i>
                  該學生前後測成績相同，學習狀況穩定。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-score-view {
  min-height: 100vh;
  background: #f5f5f5;
}

.score-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  margin-top: 80px;
}

.form-header {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-title {
  text-align: center;
}

.header-title h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.header-title p {
  color: #6c757d;
  font-size: 1rem;
  margin: 0;
}

/* 整體統計 */
.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: bold;
}

.stat-value.positive {
  color: #28a745;
}

.stat-value.negative {
  color: #dc3545;
}

/* 學生成績列表 */
.students-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.students-section h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.students-table {
  overflow-x: auto;
}

.students-table table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th,
.students-table td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.students-table th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
}

.score-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
}

.score-badge.high {
  background: #d4edda;
  color: #155724;
}

.score-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.score-badge.low {
  background: #f8d7da;
  color: #721c24;
}

.improvement-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
}

.improvement-badge.positive {
  background: #d4edda;
  color: #155724;
}

.improvement-badge.neutral {
  background: #e9ecef;
  color: #495057;
}

.improvement-badge.negative {
  background: #f8d7da;
  color: #721c24;
}

.btn-detail {
  padding: 0.25rem 0.75rem;
  background: #cebb6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.btn-detail:hover {
  background: #b8a55f;
  transform: translateY(-1px);
}

/* 關聯規則分析 */
.correlation-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.correlation-section h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.correlation-table {
  overflow-x: auto;
}

.correlation-table table {
  width: 100%;
  border-collapse: collapse;
}

.correlation-table th,
.correlation-table td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.correlation-table th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
}

.progress-bar-container {
  position: relative;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-bar-fill.pre-test {
  background: #17a2b8;
}

.progress-bar-fill.post-test {
  background: #28a745;
}

.progress-bar-fill.both-pass {
  background: #ffc107;
}

.progress-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

/* 操作按鈕 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

/* 彈窗樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  color: #2c3e50;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6c757d;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.student-info {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.student-info span {
  color: #495057;
  font-weight: 500;
}

/* 測試對照 */
.test-comparison h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.test-section {
  margin-bottom: 2rem;
}

.test-section h5 {
  color: #495057;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.question-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-result-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.question-result-item .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
}

.question-number {
  font-weight: 600;
  color: #495057;
}

.question-rule {
  color: #6c757d;
  font-size: 0.85rem;
}

.result-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.result-badge.correct {
  background: #d4edda;
  color: #155724;
}

.result-badge.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.question-detail {
  padding: 1rem;
}

.question-text {
  color: #2c3e50;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.answer-info {
  display: flex;
  gap: 2rem;
  color: #6c757d;
  font-size: 0.9rem;
}

/* 相關性分析 */
.correlation-analysis {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.correlation-analysis h5 {
  color: #495057;
  margin-bottom: 1rem;
}

.analysis-summary p {
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  line-height: 1.6;
}

.positive-feedback {
  background: #d4edda;
  color: #155724;
}

.negative-feedback {
  background: #f8d7da;
  color: #721c24;
}

.neutral-feedback {
  background: #e7f3ff;
  color: #0d47a1;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .score-container {
    padding: 1rem;
  }
  
  .overall-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .students-table {
    font-size: 0.85rem;
  }
  
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .student-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .answer-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>