<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  subtitle: {
    type: String,
    default: 'AI 出題系統',
  },
});
</script>

<template>
  <div class="top-banner">
    <div class="banner-content">
      <img src="/logo.png" alt="AI智多興" class="banner-logo" />
      <div class="banner-text">
        <h1>AI 智慧出題系統</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: linear-gradient(135deg, #8b7a3f 0%, #6b5d2f 50%, #4a3f1f 100%);
  color: white;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
}

.banner-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  position: relative;
}

.banner-logo {
  height: 40px;
  width: auto;
  filter: brightness(0) invert(1);
  position: absolute;
  left: 2rem;
}

.banner-text {
  flex: 1;
  text-align: center;
}

.banner-text h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.banner-text p {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  opacity: 0.95;
  font-weight: 400;
}

@media (max-width: 768px) {
  .banner-content {
    padding: 0.75rem 1rem;
  }

  .banner-logo {
    height: 40px;
    left: 1rem;
  }

  .banner-text h1 {
    font-size: 1.3rem;
  }

  .banner-text p {
    font-size: 0.9rem;
  }
}
</style>
