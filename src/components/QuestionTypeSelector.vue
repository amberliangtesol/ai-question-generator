<script setup>
import { ref, watch } from 'vue';
import { useQuestionStore } from '../stores/questionStore';

const questionStore = useQuestionStore();

const selectedTypes = ref({});
const typeCounts = ref({});

// 監聽科目變化，重置選擇
watch(
  () => questionStore.selectedSubject,
  () => {
    selectedTypes.value = {};
    typeCounts.value = {};
    updateQuestionTypes();
  },
);

const toggleQuestionType = (category, type) => {
  const key = `${category}_${type.value}`;
  if (selectedTypes.value[key]) {
    delete selectedTypes.value[key];
    delete typeCounts.value[key];
  } else {
    selectedTypes.value[key] = {
      category,
      ...type,
    };
    typeCounts.value[key] = 1;
  }
  updateQuestionTypes();
};

const updateTypeCount = (key, count) => {
  if (count < 1) count = 1;
  if (count > 20) count = 20;
  typeCounts.value[key] = count;
  updateQuestionTypes();
};

const updateQuestionTypes = () => {
  const types = Object.keys(selectedTypes.value).map((key) => ({
    ...selectedTypes.value[key],
    count: typeCounts.value[key] || 1,
  }));

  const totalCount = types.reduce((sum, type) => sum + type.count, 0);

  questionStore.setQuestionTypes(types);
  questionStore.setQuestionCount(totalCount);
};

const isTypeSelected = (category, type) => {
  const key = `${category}_${type.value}`;
  return !!selectedTypes.value[key];
};

const getTypeCount = (category, type) => {
  const key = `${category}_${type.value}`;
  return typeCounts.value[key] || 1;
};
</script>

<template>
  <div class="question-type-selector">
    <div class="form-group">
      <div v-if="!questionStore.selectedSubject" class="no-subject-hint">
        請先選擇科目
      </div>

      <div v-else class="type-categories">
        <!-- 單選題 -->
        <div class="type-category">
          <h4 class="category-title">單選題</h4>
          <div class="type-options">
            <div
              v-for="type in questionStore.availableQuestionTypes.single"
              :key="type.value"
              class="type-option"
              :class="{ selected: isTypeSelected('single', type) }"
            >
              <div class="type-header">
                <label class="type-checkbox">
                  <input
                    type="checkbox"
                    :checked="isTypeSelected('single', type)"
                    @change="toggleQuestionType('single', type)"
                  />
                  <span class="checkmark"></span>
                  {{ type.label }}
                </label>
              </div>

              <div v-if="isTypeSelected('single', type)" class="count-selector">
                <label class="count-label">題數：</label>
                <div class="count-input-group">
                  <button
                    type="button"
                    @click="
                      updateTypeCount(
                        `single_${type.value}`,
                        getTypeCount('single', type) - 1,
                      )
                    "
                    class="count-btn"
                    :disabled="getTypeCount('single', type) <= 1"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    :value="getTypeCount('single', type)"
                    @input="
                      updateTypeCount(
                        `single_${type.value}`,
                        parseInt($event.target.value) || 1,
                      )
                    "
                    class="count-input"
                    min="1"
                    max="20"
                  />
                  <button
                    type="button"
                    @click="
                      updateTypeCount(
                        `single_${type.value}`,
                        getTypeCount('single', type) + 1,
                      )
                    "
                    class="count-btn"
                    :disabled="getTypeCount('single', type) >= 20"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 題組題 -->
        <div class="type-category">
          <h4 class="category-title">題組題</h4>
          <div class="type-options">
            <div
              v-for="type in questionStore.availableQuestionTypes.group"
              :key="type.value"
              class="type-option"
              :class="{ selected: isTypeSelected('group', type) }"
            >
              <div class="type-header">
                <label class="type-checkbox">
                  <input
                    type="checkbox"
                    :checked="isTypeSelected('group', type)"
                    @change="toggleQuestionType('group', type)"
                  />
                  <span class="checkmark"></span>
                  {{ type.label }}
                </label>
              </div>

              <div v-if="isTypeSelected('group', type)" class="count-selector">
                <label class="count-label">題組數：</label>
                <div class="count-input-group">
                  <button
                    type="button"
                    @click="
                      updateTypeCount(
                        `group_${type.value}`,
                        getTypeCount('group', type) - 1,
                      )
                    "
                    class="count-btn"
                    :disabled="getTypeCount('group', type) <= 1"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    :value="getTypeCount('group', type)"
                    @input="
                      updateTypeCount(
                        `group_${type.value}`,
                        parseInt($event.target.value) || 1,
                      )
                    "
                    class="count-input"
                    min="1"
                    max="10"
                  />
                  <button
                    type="button"
                    @click="
                      updateTypeCount(
                        `group_${type.value}`,
                        getTypeCount('group', type) + 1,
                      )
                    "
                    class="count-btn"
                    :disabled="getTypeCount('group', type) >= 10"
                  >
                    +
                  </button>
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
.question-type-selector {
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
  text-align: left;
}

.no-subject-hint {
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  color: #6c757d;
  text-align: center;
  font-style: italic;
}

.type-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.type-category {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  background-color: #fafafa;
}

.category-title {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.type-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.type-option {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  transition: all 0.3s;
}

.type-option.selected {
  border-color: #2c3e50;
  background-color: #ecf0f1;
}

.type-header {
  margin-bottom: 0.5rem;
}

.type-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
}

.type-checkbox input[type='checkbox'] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.type-checkbox input[type='checkbox']:checked + .checkmark {
  background-color: #2c3e50;
  border-color: #2c3e50;
}

.type-checkbox input[type='checkbox']:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.count-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #eee;
}

.count-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.count-input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.count-btn {
  background: #f8f9fa;
  border: none;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.count-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.count-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-input {
  border: none;
  padding: 0.5rem;
  width: 60px;
  text-align: center;
  font-size: 0.9rem;
}

.count-input:focus {
  outline: none;
}

.total-count {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-left: 4px solid #2c3e50;
  color: #2c3e50;
  border-radius: 0 4px 4px 0;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: none;
  cursor: default;
}

@media (max-width: 768px) {
  .count-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
