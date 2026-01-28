<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuestionStore } from '../stores/questionStore';
import { useRouter } from 'vue-router';
import TopBanner from '../components/TopBanner.vue';

const questionStore = useQuestionStore();
const router = useRouter();

// 取得選中的關聯規則
const selectedRules = computed(() => questionStore.selectedRules || []);
const hasData = computed(() => questionStore.studentAnswers?.length > 0);

// 計算每個規則的前後測對應情況
const ruleAnalysis = computed(() => {
  if (!hasData.value) return [];

  const analysis = [];

  console.log('=== 開始分析規則 ===');
  console.log('總共選中規則數:', selectedRules.value.length);
  console.log(
    '選中的規則ID:',
    selectedRules.value.map((r) => r.rank),
  );

  // 顯示所有題目的規則分配情況
  console.log('前測題目規則分配概況:');
  const preTestRuleMap = {};
  questionStore.preTestQuestions.forEach((q, idx) => {
    const ruleId = q.ruleIds?.[0] || '未分配';
    if (!preTestRuleMap[ruleId]) preTestRuleMap[ruleId] = [];
    preTestRuleMap[ruleId].push(idx + 1);
  });
  console.log('前測規則分配:', preTestRuleMap);

  console.log('後測題目規則分配概況:');
  const postTestRuleMap = {};
  questionStore.postTestQuestions.forEach((q, idx) => {
    const ruleId = q.ruleIds?.[0] || '未分配';
    if (!postTestRuleMap[ruleId]) postTestRuleMap[ruleId] = [];
    postTestRuleMap[ruleId].push(idx + 1);
  });
  console.log('後測規則分配:', postTestRuleMap);

  // 對每個關聯規則進行分析
  selectedRules.value.forEach((rule) => {
    console.log(`\n--- 分析規則 ${rule.rank} ---`);

    // 找出該規則對應的前測題目
    const preTestQuestions = questionStore.preTestQuestions.filter(
      (q) => q.ruleIds && q.ruleIds.includes(rule.rank),
    );

    // 找出該規則對應的後測題目
    const postTestQuestions = questionStore.postTestQuestions.filter(
      (q) => q.ruleIds && q.ruleIds.includes(rule.rank),
    );

    console.log(`規則 ${rule.rank} 的題目:`, {
      前測題目數: preTestQuestions.length,
      前測題目ID: preTestQuestions.map((q) => q.id),
      後測題目數: postTestQuestions.length,
      後測題目ID: postTestQuestions.map((q) => q.id),
    });

    // 如果該規則沒有題目，跳過分析
    if (preTestQuestions.length === 0 && postTestQuestions.length === 0) {
      console.log(`規則 ${rule.rank} 沒有對應的題目，跳過分析`);
      return;
    }

    // 分析學生答題情況
    const studentResults = questionStore.studentAnswers.map((student) => {
      // 計算前測正確率
      let preTestCorrect = 0;
      let preTestTotal = preTestQuestions.length;

      preTestQuestions.forEach((q) => {
        const qIdx = questionStore.preTestQuestions.indexOf(q);
        if (
          student.preTestAnswers &&
          student.preTestAnswers[qIdx] === q.answer
        ) {
          preTestCorrect++;
        }
      });

      // 計算後測正確率
      let postTestCorrect = 0;
      let postTestTotal = postTestQuestions.length;

      postTestQuestions.forEach((q) => {
        const qIdx = questionStore.postTestQuestions.indexOf(q);
        if (
          student.postTestAnswers &&
          student.postTestAnswers[qIdx] === q.answer
        ) {
          postTestCorrect++;
        }
      });

      console.log(`學生 ${student.name} 在規則 ${rule.rank} 的表現:`, {
        前測: `${preTestCorrect}/${preTestTotal}`,
        後測: `${postTestCorrect}/${postTestTotal}`,
      });

      return {
        studentId: student.id,
        studentName: student.name,
        preTestPass: preTestTotal > 0 && preTestCorrect / preTestTotal >= 0.6,
        postTestPass:
          postTestTotal > 0 && postTestCorrect / postTestTotal >= 0.6,
        preTestScore:
          preTestTotal > 0
            ? Math.round((preTestCorrect / preTestTotal) * 100)
            : 0,
        postTestScore:
          postTestTotal > 0
            ? Math.round((postTestCorrect / postTestTotal) * 100)
            : 0,
      };
    });

    // 統計分析
    const totalStudents = studentResults.length;
    const bothPass = studentResults.filter(
      (r) => r.preTestPass && r.postTestPass,
    ).length;
    const onlyPrePass = studentResults.filter(
      (r) => r.preTestPass && !r.postTestPass,
    ).length;
    const onlyPostPass = studentResults.filter(
      (r) => !r.preTestPass && r.postTestPass,
    ).length;
    const nonePass = studentResults.filter(
      (r) => !r.preTestPass && !r.postTestPass,
    ).length;

    // 計算信心度：在前測不通過的情況下，後測也不通過的條件機率
    // 這反映了前項困難與後項困難之間的關聯強度
    const studentsFailedPreTest = onlyPostPass + nonePass;
    const confidence =
      studentsFailedPreTest > 0
        ? ((nonePass / studentsFailedPreTest) * 100).toFixed(1)
        : 0;

    analysis.push({
      rule,
      preTestQuestions: preTestQuestions.length,
      postTestQuestions: postTestQuestions.length,
      studentResults,
      statistics: {
        totalStudents,
        bothPass,
        onlyPrePass,
        onlyPostPass,
        nonePass,
        confidence,
      },
    });
  });

  return analysis;
});

// 返回出題頁面
const backToGenerator = () => {
  router.push('/');
};

// 前往練習頁面
const goToPractice = () => {
  router.push('/practice');
};

onMounted(() => {
  console.log('AnswerAnalysis mounted');
  console.log('selectedRules:', selectedRules.value);
  console.log('studentAnswers:', questionStore.studentAnswers);
  console.log('preTestQuestions:', questionStore.preTestQuestions);
  console.log('postTestQuestions:', questionStore.postTestQuestions);

  // 顯示每個題目的規則ID，幫助調試
  if (questionStore.preTestQuestions.length > 0) {
    console.log('前測題目的規則分配:');
    questionStore.preTestQuestions.forEach((q, idx) => {
      console.log(`  題目${idx + 1}: 規則${q.ruleIds}`);
    });
  }

  if (questionStore.postTestQuestions.length > 0) {
    console.log('後測題目的規則分配:');
    questionStore.postTestQuestions.forEach((q, idx) => {
      console.log(`  題目${idx + 1}: 規則${q.ruleIds}`);
    });
  }
});

// 移除模擬數據生成函數，只使用真實數據
</script>

<template>
  <div class="analysis-page">
    <TopBanner subtitle="作答分析" />

    <div class="analysis-container">
      <!-- 頁面標題 -->
      <div class="form-header">
        <div class="header-title">
          <h2><i class="fas fa-chart-bar"></i> 前後測對應分析</h2>
          <p>查看學生前測與後測的表現對比</p>
        </div>
      </div>

      <!-- 無數據提示 -->
      <div v-if="!hasData && selectedRules.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-chart-line fa-5x"></i>
        </div>
        <h2>尚無分析數據</h2>
        <p>請先完成出題設定並讓學生完成作答</p>
        <button @click="backToGenerator" class="btn btn-primary">
          前往出題設定
        </button>
      </div>

      <!-- 關聯規則分析表 -->
      <div
        v-else-if="
          selectedRules.length > 0 || questionStore.preTestQuestions.length > 0
        "
        class="analysis-content"
      >
        <!-- 選中的關聯規則列表 -->
        <div class="rules-section">
          <h3>出題關聯規則</h3>
          <div class="rules-table">
            <table>
              <thead>
                <tr>
                  <th width="60">規則<br />序號</th>
                  <th>
                    <div class="th-title">前項困難</div>
                    <div class="th-subtitle">(含意 / 基本學習內容)</div>
                  </th>
                  <th>
                    <div class="th-title">後項困難</div>
                    <div class="th-subtitle">(含意 / 基本學習內容)</div>
                  </th>
                  <th width="100">信心度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in ruleAnalysis" :key="item.rule.rank">
                  <td class="center">{{ item.rule.rank }}</td>
                  <td>
                    <div class="rule-content">
                      <div class="rule-main">
                        {{ item.rule.aImplication || item.rule.antecedents }}
                      </div>
                      <div class="rule-sub" v-if="item.rule.aBasicContent">
                        {{ item.rule.aBasicContent }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="rule-content">
                      <div class="rule-main">
                        {{ item.rule.bImplication || item.rule.consequents }}
                      </div>
                      <div class="rule-sub" v-if="item.rule.bBasicContent">
                        {{ item.rule.bBasicContent }}
                      </div>
                    </div>
                  </td>
                  <td class="center">
                    <span
                      class="confidence-badge"
                      :class="{
                        high: item.statistics.confidence >= 70,
                        medium:
                          item.statistics.confidence >= 50 &&
                          item.statistics.confidence < 70,
                        low: item.statistics.confidence < 50,
                      }"
                    >
                      {{ item.statistics.confidence }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 學生答題分析 -->
        <div class="students-analysis-section" v-if="hasData">
          <h3>學生答題狀況分析</h3>

          <div
            v-for="item in ruleAnalysis"
            :key="item.rule.rank"
            class="rule-analysis-card"
          >
            <div class="rule-header">
              <h4>
                規則 {{ item.rule.rank }}
              </h4>
              <div class="rule-details">
                <div class="rule-item">
                  <span class="rule-label">前項困難：</span>
                  <span class="rule-text">{{ item.rule.aImplication || item.rule.antecedents || item.rule.a_implication }}</span>
                </div>
                <div class="rule-arrow">→</div>
                <div class="rule-item">
                  <span class="rule-label">後項困難：</span>
                  <span class="rule-text">{{ item.rule.bImplication || item.rule.consequents || item.rule.b_implication }}</span>
                </div>
              </div>
            </div>

            <div class="analysis-stats">
              <div class="stat-grid">
                <div class="stat-item">
                  <div class="stat-label">前後測都通過</div>
                  <div class="stat-value success">
                    {{ item.statistics.bothPass }} 人
                  </div>
                  <div class="stat-percent">
                    {{
                      (
                        (item.statistics.bothPass /
                          item.statistics.totalStudents) *
                        100
                      ).toFixed(0)
                    }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">只通過前測</div>
                  <div class="stat-value warning">
                    {{ item.statistics.onlyPrePass }} 人
                  </div>
                  <div class="stat-percent">
                    {{
                      (
                        (item.statistics.onlyPrePass /
                          item.statistics.totalStudents) *
                        100
                      ).toFixed(0)
                    }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">只通過後測</div>
                  <div class="stat-value info">
                    {{ item.statistics.onlyPostPass }} 人
                  </div>
                  <div class="stat-percent">
                    {{
                      (
                        (item.statistics.onlyPostPass /
                          item.statistics.totalStudents) *
                        100
                      ).toFixed(0)
                    }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">都未通過</div>
                  <div class="stat-value danger">
                    {{ item.statistics.nonePass }} 人
                  </div>
                  <div class="stat-percent">
                    {{
                      (
                        (item.statistics.nonePass /
                          item.statistics.totalStudents) *
                        100
                      ).toFixed(0)
                    }}%
                  </div>
                </div>
              </div>

              <div class="analysis-insight">
                <i class="fas fa-lightbulb"></i>
                <span v-if="item.statistics.confidence >= 70" class="positive">
                  規則相關性高：前測通過的學生大多也能通過後測，顯示學習概念具有連貫性。
                </span>
                <span
                  v-else-if="item.statistics.confidence >= 50"
                  class="neutral"
                >
                  規則相關性中等：前後測表現有一定關聯，但仍有改善空間。
                </span>
                <span v-else class="negative">
                  規則相關性低：前後測表現差異較大，建議檢視教學方法或題目設計。
                </span>
              </div>
            </div>

            <!-- 詳細學生列表 -->
            <details class="student-details">
              <summary>查看詳細學生名單</summary>
              <div class="student-list">
                <table>
                  <thead>
                    <tr>
                      <th>學生</th>
                      <th>前測成績</th>
                      <th>後測成績</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="student in item.studentResults"
                      :key="student.studentId"
                    >
                      <td>{{ student.studentName }}</td>
                      <td>
                        <span
                          class="score-badge"
                          :class="{
                            pass: student.preTestPass,
                            fail: !student.preTestPass,
                          }"
                        >
                          {{ student.preTestScore }}%
                        </span>
                      </td>
                      <td>
                        <span
                          class="score-badge"
                          :class="{
                            pass: student.postTestPass,
                            fail: !student.postTestPass,
                          }"
                        >
                          {{ student.postTestScore }}%
                        </span>
                      </td>
                      <td>
                        <span
                          v-if="student.preTestPass && student.postTestPass"
                          class="status-badge success"
                        >
                          都通過
                        </span>
                        <span
                          v-else-if="
                            student.preTestPass && !student.postTestPass
                          "
                          class="status-badge warning"
                        >
                          只通過前測
                        </span>
                        <span
                          v-else-if="
                            !student.preTestPass && student.postTestPass
                          "
                          class="status-badge info"
                        >
                          只通過後測
                        </span>
                        <span v-else class="status-badge danger">
                          都未通過
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="action-buttons">
          <button @click="backToGenerator" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> 返回出題
          </button>
          <button v-if="!hasData" @click="goToPractice" class="btn btn-primary">
            <i class="fas fa-edit"></i> 開始作答
          </button>
        </div>
      </div>

      <!-- 預設狀態（當沒有任何數據時） -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-chart-line fa-5x"></i>
        </div>
        <h2>尚無分析數據</h2>
        <p>請先完成出題並進行作答</p>
        <button @click="backToGenerator" class="btn btn-primary">
          前往出題設定
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.analysis-container {
  max-width: 1400px;
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

/* 空狀態 */
.empty-state {
  background: white;
  border-radius: 10px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.3;
  color: #6c757d;
}

.empty-state h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 2rem;
}

/* 關聯規則表格 */
.rules-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.rules-section h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.rules-table {
  overflow-x: auto;
}

.rules-table table {
  width: 100%;
  border-collapse: collapse;
}

.rules-table th,
.rules-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.rules-table th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.th-title {
  font-weight: 700;
  color: #2c3e50;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.th-subtitle {
  font-weight: normal;
  color: #6c757d;
  font-size: 0.8rem;
}

.rules-table td.center,
.rules-table th.center {
  text-align: center;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rule-main {
  color: #2c3e50;
  font-weight: 500;
}

.rule-sub {
  color: #6c757d;
  font-size: 0.85rem;
}

.confidence-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.confidence-badge.high {
  background: #d4edda;
  color: #155724;
}

.confidence-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.confidence-badge.low {
  background: #f8d7da;
  color: #721c24;
}

/* 學生分析 */
.students-analysis-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.students-analysis-section h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.rule-analysis-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.rule-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.rule-header h4 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.rule-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-label {
  color: #6c757d;
  font-weight: 600;
  font-size: 0.95rem;
}

.rule-text {
  color: #2c3e50;
  font-size: 0.95rem;
}

.rule-arrow {
  color: #c8a882;
  font-size: 1.2rem;
  font-weight: bold;
}

.analysis-stats {
  padding: 1.5rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-value.success {
  color: #28a745;
}

.stat-value.warning {
  color: #ffc107;
}

.stat-value.info {
  color: #17a2b8;
}

.stat-value.danger {
  color: #dc3545;
}

.stat-percent {
  color: #6c757d;
  font-size: 0.85rem;
}

.analysis-insight {
  padding: 1rem;
  background: #e7f3ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.analysis-insight i {
  color: #2196f3;
  font-size: 1.2rem;
}

.analysis-insight span {
  flex: 1;
  line-height: 1.5;
}

.analysis-insight .positive {
  color: #155724;
}

.analysis-insight .neutral {
  color: #856404;
}

.analysis-insight .negative {
  color: #721c24;
}

/* 學生詳情 */
.student-details {
  margin: 1rem 1.5rem 1.5rem;
}

.student-details summary {
  cursor: pointer;
  color: #cebb6b;
  font-weight: 500;
  padding: 0.5rem;
  user-select: none;
}

.student-details summary:hover {
  color: #b8a55f;
}

.student-list {
  margin-top: 1rem;
  overflow-x: auto;
}

.student-list table {
  width: 100%;
  border-collapse: collapse;
}

.student-list th,
.student-list td {
  padding: 0.5rem;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.student-list th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  font-size: 0.85rem;
}

.score-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.score-badge.pass {
  background: #d4edda;
  color: #155724;
}

.score-badge.fail {
  background: #f8d7da;
  color: #721c24;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.status-badge.info {
  background: #cce5ff;
  color: #004085;
}

.status-badge.danger {
  background: #f8d7da;
  color: #721c24;
}

/* 操作按鈕 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(206, 187, 107, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .analysis-container {
    padding: 1rem;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rules-table {
    font-size: 0.85rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
