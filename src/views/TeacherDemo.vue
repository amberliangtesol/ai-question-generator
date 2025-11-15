<script setup>
import { ref } from 'vue';
import TopBanner from '../components/TopBanner.vue';

const selectedAnswer = ref('');

const selectOption = (option) => {
  selectedAnswer.value = option;
};
</script>

<template>
  <div class="teacher-demo">
    <TopBanner subtitle="老師說明" />
    
    <div class="demo-container">
      <div class="form-header">
        <div class="header-title">
          <h2><i class="fas fa-chalkboard-teacher"></i> 老師說明</h2>
          <p>系統功能展示與教學範例</p>
        </div>
      </div>

      <div class="demo-content">
        <!-- 影片區塊 -->
        <div class="video-section">
          <div class="video-wrapper">
            <video
              controls
              controlsList="nodownload"
              preload="metadata"
              title="AI智多興出題系統教學"
            >
              <source src="/teacher.mp4" type="video/mp4">
              <track 
                kind="captions" 
                src="/caption.vtt" 
                srclang="zh-TW" 
                label="中文"
                default
              >
              您的瀏覽器不支援 HTML5 影片播放。
            </video>
          </div>
        </div>

        <!-- 範例題目區塊 -->
        <div class="example-section">
          <div class="example-question">
            <div class="question-header">
              <span class="question-type">單選題</span>
              <span class="question-category">詞彙理解與使用</span>
            </div>
            
            <div class="question-content">
              <div class="question-text">
                下面句子中的「促進」，可以換成哪個意思相近的語詞？
                <br><br>
                <strong>學校舉辦親子共讀活動，可以「促進」親子間的互動。</strong>
              </div>
              
              <div class="options">
                <div 
                  class="option"
                  :class="{ 
                    selected: selectedAnswer === 'A',
                    incorrect: selectedAnswer === 'A'
                  }"
                  @click="selectOption('A')"
                >
                  (1) 督促
                </div>
                <div 
                  class="option"
                  :class="{ 
                    selected: selectedAnswer === 'B',
                    incorrect: selectedAnswer === 'B'
                  }"
                  @click="selectOption('B')"
                >
                  (2) 催促
                </div>
                <div 
                  class="option correct"
                  :class="{ 
                    selected: selectedAnswer === 'C'
                  }"
                  @click="selectOption('C')"
                >
                  (3) 增進
                </div>
                <div 
                  class="option"
                  :class="{ 
                    selected: selectedAnswer === 'D',
                    incorrect: selectedAnswer === 'D'
                  }"
                  @click="selectOption('D')"
                >
                  (4) 邁進
                </div>
              </div>

              <div class="answer-section">
                <div class="explanation-box">
                  <strong>解析：</strong>
                  「促進」意思是推動使其前進、發展，在這個句子中指的是增進親子之間的互動關係。「增進」有增加、促進的意思，最符合句意。而「督促」、「催促」都有催趕的意思，「邁進」則是向前進的意思，都不符合原句的語境。
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
.teacher-demo {
  min-height: 100vh;
}

.demo-container {
  width: 100%;
  padding: 2rem;
  margin-top: 80px;
}

.form-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.header-title {
  text-align: center;
}

.form-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.form-header p {
  color: #6c757d;
  font-size: 1rem;
  margin: 0;
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 影片區塊 */
.video-section {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.video-wrapper video {
  width: 100%;
  height: auto;
  display: block;
}

/* 範例題目區塊 */
.example-section {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.example-question {
  border: 2px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.question-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #e9ecef;
}

.question-type {
  background: #cebb6b;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.question-category {
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.question-content {
  padding: 2rem;
}

.question-text {
  font-size: 1.2rem;
  line-height: 1.8;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.1rem;
  color: #495057;
}

.option:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.option.selected {
  background: #fff3cd;
  border-color: #ffc107;
}

.option.correct {
  background: #d4edda !important;
  border-color: #28a745 !important;
  color: #155724;
  font-weight: 500;
}

.option.incorrect {
  background: #f8d7da !important;
  border-color: #dc3545 !important;
  color: #721c24;
}

.answer-section {
  margin-top: 2rem;
}

.answer-box {
  background: #d4edda;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #28a745;
  margin-bottom: 1rem;
  color: #155724;
  font-size: 1.1rem;
}

.explanation-box {
  background: #e7f3ff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
  color: #0d47a1;
  line-height: 1.6;
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

/* 手機版響應式 */
@media (max-width: 768px) {
  .demo-container {
    padding: 1rem;
  }
  
  .video-section,
  .example-section {
    padding: 1.5rem;
  }
  
  .question-text {
    font-size: 1rem;
  }
  
  .option {
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }
}
</style>