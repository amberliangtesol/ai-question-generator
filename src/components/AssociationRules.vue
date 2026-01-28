<script setup>
import { useQuestionStore } from '../stores/questionStore';
import { watch, ref } from 'vue';
import {
  getAssociationRules,
  formatRulesForPrompt,
} from '../services/associationRulesService';

const questionStore = useQuestionStore();
const isLoadingRules = ref(false);
const currentRules = ref([]);
const selectedRules = ref([]);
const showRulesTable = ref(false);
const antecedentPrompt = ref(''); // 前項困難提示語
const consequentPrompt = ref(''); // 後項困難提示語

// 監聽年級變化，自動載入關聯規則
watch(
  () => questionStore.selectedGrade,
  async (newGrade) => {
    if (newGrade) {
      isLoadingRules.value = true;
      selectedRules.value = []; // 清空選擇
      questionStore.setAssociationRules(''); // 清空 prompt

      try {
        const rules = await getAssociationRules(newGrade);
        currentRules.value = rules;
        showRulesTable.value = rules && rules.length > 0;
      } catch (error) {
        console.error('載入關聯規則失敗:', error);
        currentRules.value = [];
        showRulesTable.value = false;
      } finally {
        isLoadingRules.value = false;
      }
    } else {
      currentRules.value = [];
      selectedRules.value = [];
      showRulesTable.value = false;
      questionStore.setAssociationRules('');
    }
  },
);

// 處理規則選擇
const toggleRuleSelection = (rule) => {
  const index = selectedRules.value.findIndex((r) => r.rank === rule.rank);
  if (index > -1) {
    selectedRules.value.splice(index, 1);
  } else {
    selectedRules.value.push(rule);
  }
  questionStore.setSelectedRules(selectedRules.value); // 同步到 store
  generatePrompt();
};

// 檢查規則是否被選中
const isRuleSelected = (rule) => {
  return selectedRules.value.some((r) => r.rank === rule.rank);
};

// 全選/取消全選
const toggleSelectAll = () => {
  if (selectedRules.value.length === currentRules.value.length) {
    selectedRules.value = [];
  } else {
    selectedRules.value = [...currentRules.value];
  }
  generatePrompt();
};

// 根據選中的規則生成 prompt
const generatePrompt = () => {
  if (selectedRules.value.length === 0) {
    antecedentPrompt.value = '';
    consequentPrompt.value = '';
    questionStore.setAssociationRules('');
    return;
  }

  const gradeName = `國小${questionStore.selectedGrade}年級`;

  // 處理內容並移除 Q 編號的函數
  const processContent = (content) => {
    if (!content) return '';
    // 移除 Q+數字 的模式（例如 Q16, Q18）
    return content.replace(/Q\d+[\s｜|]*/g, '').trim();
  };

  // 生成前項困難提示語 - 使用 108 課綱格式
  let aPrompt = `你是一位熟悉台灣 108 課綱國語文領域的${gradeName}國文老師，請設計題目來診斷學生是否掌握以下基礎概念。\n\n`;
  aPrompt += `對應 108 課綱基本學習內容\n`;

  // 使用 Set 來追蹤已經添加的規則，避免重複
  const addedRulesA = new Set();

  selectedRules.value.forEach((rule) => {
    // 處理可能有斜線分隔的內容
    const aBasicContents = rule.aBasicContent
      ? rule.aBasicContent.split(' / ')
      : [];
    const aImplications = (rule.aImplication || rule.antecedents || '').split(
      ' / ',
    );

    // 對每個基本學習內容分別處理
    aImplications.forEach((imp, idx) => {
      const processedImplication = processContent(imp.trim());
      const basicContent = aBasicContents[idx]?.trim() || '';

      if (processedImplication || basicContent) {
        // 建立規則字串，格式：含意在前，基本學習內容在後
        let ruleString = '';
        if (processedImplication && basicContent) {
          ruleString = `* ${processedImplication}: ${basicContent}`;
        } else if (processedImplication) {
          ruleString = `* ${processedImplication}`;
        } else if (basicContent) {
          ruleString = `* ${basicContent}`;
        }

        // 只有當規則尚未添加時才加入
        if (ruleString && !addedRulesA.has(ruleString)) {
          aPrompt += ruleString + '\n';
          addedRulesA.add(ruleString);
        }
      }
    });

    // 處理多餘的基本學習內容（如果基本學習內容比含意多）
    if (aBasicContents.length > aImplications.length) {
      for (let i = aImplications.length; i < aBasicContents.length; i++) {
        const basicContent = aBasicContents[i]?.trim();
        if (basicContent) {
          const ruleString = `* ${basicContent}`;
          if (!addedRulesA.has(ruleString)) {
            aPrompt += ruleString + '\n';
            addedRulesA.add(ruleString);
          }
        }
      }
    }
  });

  // 生成後項困難提示語 - 使用 108 課綱格式
  let bPrompt = `你是一位熟悉台灣 108 課綱國語文領域的${gradeName}國文老師，請設計題目來診斷學生是否掌握以下基礎概念。\n\n`;
  bPrompt += `對應 108 課綱基本學習內容\n`;

  // 使用 Set 來追蹤已經添加的規則，避免重複
  const addedRulesB = new Set();

  selectedRules.value.forEach((rule) => {
    // 處理可能有斜線分隔的內容
    const bBasicContents = rule.bBasicContent
      ? rule.bBasicContent.split(' / ')
      : [];
    const bImplications = (rule.bImplication || rule.consequents || '').split(
      ' / ',
    );

    // 對每個基本學習內容分別處理
    bImplications.forEach((imp, idx) => {
      const processedImplication = processContent(imp.trim());
      const basicContent = bBasicContents[idx]?.trim() || '';

      if (processedImplication || basicContent) {
        // 建立規則字串，格式：含意在前，基本學習內容在後
        let ruleString = '';
        if (processedImplication && basicContent) {
          ruleString = `* ${processedImplication}: ${basicContent}`;
        } else if (processedImplication) {
          ruleString = `* ${processedImplication}`;
        } else if (basicContent) {
          ruleString = `* ${basicContent}`;
        }

        // 只有當規則尚未添加時才加入
        if (ruleString && !addedRulesB.has(ruleString)) {
          bPrompt += ruleString + '\n';
          addedRulesB.add(ruleString);
        }
      }
    });

    // 處理多餘的基本學習內容（如果基本學習內容比含意多）
    if (bBasicContents.length > bImplications.length) {
      for (let i = bImplications.length; i < bBasicContents.length; i++) {
        const basicContent = bBasicContents[i]?.trim();
        if (basicContent) {
          const ruleString = `* ${basicContent}`;
          if (!addedRulesB.has(ruleString)) {
            bPrompt += ruleString + '\n';
            addedRulesB.add(ruleString);
          }
        }
      }
    }
  });

  antecedentPrompt.value = aPrompt;
  consequentPrompt.value = bPrompt;

  // 合併兩個 prompt 存入 store，並在兩段之間保留分隔線（但前後標題已經移除）
  const combinedPrompt = `【前項困難診斷題目】\n${aPrompt}\n--- 分隔線 ---\n\n【後項困難補強題目】\n${bPrompt}`;
  questionStore.setAssociationRules(combinedPrompt);
};

const handleRulesChange = (event) => {
  questionStore.setAssociationRules(event.target.value);
};

// 處理前項困難提示語變更
const handleAntecedentChange = (event) => {
  antecedentPrompt.value = event.target.value;
  updateCombinedPrompt();
};

// 處理後項困難提示語變更
const handleConsequentChange = (event) => {
  consequentPrompt.value = event.target.value;
  updateCombinedPrompt();
};

// 更新合併的提示語
const updateCombinedPrompt = () => {
  const combined = `${antecedentPrompt.value}\n\n--- 分隔線 ---\n\n${consequentPrompt.value}`;
  questionStore.setAssociationRules(combined);
};

// 格式化顯示文字（處理可能的空值）
const formatDisplayText = (text, fallback = '') => {
  return text || fallback || '(未提供)';
};

// 解析並格式化規則內容（將斜線分隔的內容轉換為多行格式）
const formatRuleContent = (implication, basicContent) => {
  if (!implication) return [];

  const implications = implication.split(' / ');
  const contents = basicContent ? basicContent.split(' / ') : [];

  return implications.map((imp, index) => {
    const content = contents[index] || '';
    return {
      implication: imp.trim(),
      basicContent: content.trim(),
    };
  });
};
</script>

<template>
  <div class="association-rules-container">
    <!-- 規則選擇區域 -->
    <div v-if="questionStore.selectedGrade" class="rules-selection">
      <!-- 載入狀態 -->
      <div v-if="isLoadingRules" class="loading-status">
        <i class="fas fa-spinner fa-spin"></i> 載入關聯規則中...
      </div>

      <!-- 規則表格 -->
      <div v-else-if="showRulesTable" class="rules-table-container">
        <div class="table-header">
          <h4>請選擇要使用的關聯規則</h4>
          <button @click="toggleSelectAll" class="select-all-btn" type="button">
            {{
              selectedRules.length === currentRules.length ? '取消全選' : '全選'
            }}
          </button>
        </div>

        <div class="table-wrapper">
          <table class="rules-table">
            <thead>
              <tr>
                <th class="checkbox-col">選擇</th>
                <th class="rank-col">序號</th>
                <th class="combined-col">
                  前項困難<br /><small>(A_含意 / 基本學習內容)</small>
                </th>
                <th class="combined-col">
                  後項困難<br /><small>(B_含意 / 基本學習內容)</small>
                </th>
                <th class="confidence-col">信心度</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rule in currentRules"
                :key="rule.rank"
                :class="{ selected: isRuleSelected(rule) }"
                @click="toggleRuleSelection(rule)"
              >
                <td class="checkbox-col">
                  <input
                    type="checkbox"
                    :checked="isRuleSelected(rule)"
                    @click.stop="toggleRuleSelection(rule)"
                  />
                </td>
                <td class="rank-col">{{ rule.rank }}</td>
                <td class="combined-col">
                  <div class="rule-display">
                    <div
                      v-for="(item, idx) in formatRuleContent(
                        rule.aImplication || rule.antecedents,
                        rule.aBasicContent,
                      )"
                      :key="idx"
                      class="rule-line"
                    >
                      <span class="implication-part">{{
                        item.implication
                      }}</span>
                      <span v-if="item.basicContent" class="separator">|</span>
                      <span v-if="item.basicContent" class="basic-content">{{
                        item.basicContent
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="combined-col">
                  <div class="rule-display">
                    <div
                      v-for="(item, idx) in formatRuleContent(
                        rule.bImplication || rule.consequents,
                        rule.bBasicContent,
                      )"
                      :key="idx"
                      class="rule-line"
                    >
                      <span class="implication-part">{{
                        item.implication
                      }}</span>
                      <span v-if="item.basicContent" class="separator">|</span>
                      <span v-if="item.basicContent" class="basic-content">{{
                        item.basicContent
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="confidence-col">
                  {{ (rule.confidence * 100).toFixed(1) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="selection-status">
          已選擇 {{ selectedRules.length }} / {{ currentRules.length }} 條規則
        </div>
      </div>

      <!-- 無資料提示 -->
      <div v-else class="no-rules">
        <i class="fas fa-info-circle"></i> 該年級暫無關聯規則資料
      </div>
    </div>

    <!-- 提示文字 -->
    <div v-else class="select-grade-hint">
      <i class="fas fa-arrow-up"></i> 請先選擇年級以載入關聯規則
    </div>

    <!-- 生成的 prompt 文字框 - 分成兩塊 -->
    <div class="prompts-container">
      <!-- 前項困難出題 -->
      <div class="prompt-section">
        <label class="prompt-label">
          <i class="fas fa-diagnoses"></i> 前項困難診斷題目 (AI 提示詞)
        </label>
        <textarea
          :value="antecedentPrompt"
          @input="handleAntecedentChange"
          class="form-textarea"
          :placeholder="
            selectedRules.length > 0
              ? '已根據選擇的規則自動生成前項困難診斷提示語'
              : '請選擇上方的關聯規則，系統將自動生成前項困難診斷題目'
          "
          rows="8"
        />
      </div>

      <!-- 後項困難出題 -->
      <div class="prompt-section">
        <label class="prompt-label">
          <i class="fas fa-graduation-cap"></i> 後項困難補強題目 (AI 提示詞)
        </label>
        <textarea
          :value="consequentPrompt"
          @input="handleConsequentChange"
          class="form-textarea"
          :placeholder="
            selectedRules.length > 0
              ? '已根據選擇的規則自動生成後項困難補強提示語'
              : '請選擇上方的關聯規則，系統將自動生成後項困難補強題目'
          "
          rows="8"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.association-rules-container {
  width: 100%;
}

.loading-status {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.loading-status i {
  color: #c8a882;
  margin-right: 0.5rem;
}

.rules-selection {
  margin-bottom: 1.5rem;
}

.rules-table-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #dee2e6;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.table-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.select-all-btn {
  padding: 0.4rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.select-all-btn:hover {
  background: #5a6268;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.rules-table thead {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
}

.rules-table th {
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.rules-table th small {
  display: block;
  font-weight: normal;
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

.rules-table tbody tr {
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #e9ecef;
}

.rules-table tbody tr:hover {
  background: #f8f9fa;
}

.rules-table tbody tr.selected {
  background: #fff3cd;
}

.rules-table tbody tr.selected:hover {
  background: #ffe9a1;
}

.rules-table td {
  padding: 0.75rem 0.5rem;
  vertical-align: top;
}

.checkbox-col {
  width: 50px;
  text-align: center;
}

.checkbox-col input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.rank-col {
  width: 60px;
  font-weight: 600;
  color: #495057;
  text-align: center;
}

.combined-col {
  width: 35%;
  vertical-align: top;
  padding: 0.75rem 0.5rem;
}

.rule-display {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.rule-line {
  line-height: 1.5;
  padding: 0.2rem 0;
  border-bottom: 1px dotted #e9ecef;
}

.rule-line:last-child {
  border-bottom: none;
}

.implication-part {
  color: #2c3e50;
  font-weight: 500;
}

.separator {
  color: #c8a882;
  font-weight: bold;
  margin: 0 0.5rem;
}

.basic-content {
  color: #6c757d;
  font-size: 0.9rem;
}

.confidence-col {
  width: 80px;
  text-align: center;
  font-weight: 600;
  color: #28a745;
}

.selection-status {
  margin-top: 1rem;
  padding: 0.5rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  background: #f1f3f5;
  border-radius: 4px;
}

.no-rules {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

.select-grade-hint {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
  margin-bottom: 1.5rem;
}

.prompts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.prompt-section {
  display: flex;
  flex-direction: column;
}

.prompt-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #333;
  padding: 0.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 4px;
}

.prompt-label i {
  color: #c8a882;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  font-family: inherit;
  background-color: white;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
  resize: vertical;
  min-height: 100px;
}

.form-textarea.large {
  min-height: 200px;
  font-size: 1rem;
  line-height: 1.6;
  padding: 1rem;
}

.form-textarea:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
}

.form-textarea:hover {
  border-color: #bbb;
}

/* 響應式設計 */
/* 響應式設計 - 手機版將兩個文字框上下排列 */
@media (max-width: 1024px) {
  .prompts-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .rules-table {
    font-size: 0.8rem;
  }

  .rules-table th,
  .rules-table td {
    padding: 0.5rem 0.3rem;
  }

  .combined-col {
    width: 40%;
  }

  .basic-content {
    font-size: 0.75rem;
  }

  .rule-display {
    font-size: 0.8rem;
  }

  .separator {
    margin: 0 0.3rem;
  }

  .table-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .select-all-btn {
    width: 100%;
  }
}
</style>
