<script setup>
import { useQuestionStore } from '../stores/questionStore';

const questionStore = useQuestionStore();

const handleRulesChange = (event) => {
  questionStore.setAssociationRules(event.target.value);
};
</script>

<template>
  <div class="form-group">
    <label for="rules" class="form-label">關聯規則</label>
    <textarea
      id="rules"
      :value="questionStore.associationRules"
      @input="handleRulesChange"
      class="form-textarea large"
      placeholder="請輸入出題的關聯規則或特殊要求"
      rows="5"
    />
  </div>
</template>

<style scoped>
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
</style>
