<script setup>
import { useQuestionStore } from '../stores/questionStore';

const questionStore = useQuestionStore();

const handleGradeChange = (event) => {
  questionStore.setGrade(event.target.value);
};
</script>

<template>
  <div class="form-group">
    <label for="grade" class="form-label">教學年段</label>
    <select
      id="grade"
      :value="questionStore.selectedGrade"
      @change="handleGradeChange"
      class="form-select"
    >
      <option value="">請選擇年段</option>
      <option
        v-for="grade in questionStore.gradeOptions"
        :key="grade.value"
        :value="grade.value"
      >
        {{ grade.label }}
      </option>
    </select>
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

.form-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  background-color: white;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-select:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
}

.form-select:hover {
  border-color: #bbb;
}
</style>
