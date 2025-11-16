<script setup>
import { useQuestionStore } from '../stores/questionStore';

const questionStore = useQuestionStore();

const learningDifficultyTemplate = `你是一位資深的教育數據分析師與補救教學專家，學生的學習困難規則如下：若學生有「4-3-1 能認識常用國字2,200-2,700字。；6-3-1能正確流暢的遣詞造句、安排段落、組織成篇。；5-3-7能配合語言情境閱讀，並瞭解不同語言情境中字詞的正確使用。；4-3-1 能認識常用國字 2,200-2,700 字。；5-3-7 能配合語言情境閱讀，並瞭解不同語言情境中字詞的正確使用」請以此規則進行出題。`;

const handleRulesChange = (event) => {
  questionStore.setAssociationRules(event.target.value);
};

const applyTemplate = () => {
  questionStore.setAssociationRules(learningDifficultyTemplate);
};
</script>

<template>
  <div class="form-group">
    <div class="header-with-button">
      <span></span>
      <button 
        @click="applyTemplate" 
        class="template-btn"
        type="button"
      >
        <i class="fas fa-lightbulb"></i>
        套用學習困難規則
      </button>
    </div>
    
    <textarea
      id="rules"
      :value="questionStore.associationRules"
      @input="handleRulesChange"
      class="form-textarea large"
      placeholder="請輸入出題的關聯規則或特殊要求"
      rows="6"
    />
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

.form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  text-align: left;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  font-family: inherit;
  background-color: white;
  transition: border-color 0.3s, box-shadow 0.3s;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 10px;
}

.form-textarea.large {
  min-height: 150px;
  font-size: 1.05rem;
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

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.header-with-button {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.75rem;
  margin-top: -2.5rem;
}

.template-btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  background: #c8a882;
  color: white;
}

.template-btn:hover {
  background: #b39770;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(200, 168, 130, 0.3);
}
</style>
