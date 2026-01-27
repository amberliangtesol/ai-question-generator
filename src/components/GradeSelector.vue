<script setup>
import { useQuestionStore } from '../stores/questionStore';

const questionStore = useQuestionStore();

const handleGradeChange = (event) => {
  questionStore.setGrade(event.target.value);
};
</script>

<template>
  <div class="grade-subject-wrapper">
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
    
    <div class="subject-display">
      <label class="form-label">教學科目</label>
      <div class="subject-badge">
        <i class="fas fa-book"></i>
        國文科
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-subject-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
}

.form-group,
.subject-display {
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

.subject-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 500;
  height: 48px;
  box-shadow: 0 2px 4px rgba(206, 187, 107, 0.3);
}

.subject-badge i {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .grade-subject-wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
