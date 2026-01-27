<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuestionStore } from '../stores/questionStore';

const route = useRoute();
const router = useRouter();
const questionStore = useQuestionStore();

const menuItems = ref([
  {
    id: 'generator',
    title: '出題設定',
    icon: 'fa-cog',
    path: '/',
    description: '設定參數並生成題目',
  },
  {
    id: 'review',
    title: '題目檢視',
    icon: 'fa-clipboard-list',
    path: '/review',
    description: '檢視生成的題目',
    badge: computed(() => questionStore.currentQuestions?.length || 0),
  },
  {
    id: 'practice',
    title: '作答頁面',
    icon: 'fa-edit',
    path: '/practice',
    description: '練習模式',
  },
  {
    id: 'analysis',
    title: '作答分析',
    icon: 'fa-chart-bar',
    path: '/analysis',
    description: '前後測對應分析',
    badge: computed(() => questionStore.studentAnswers?.length || 0),
  },
  {
    id: 'teacher',
    title: '老師說明',
    icon: 'fa-chalkboard-teacher',
    path: '/teacher-demo',
    description: '教學展示範例',
  },
]);

const handleNavigation = (path) => {
  router.push(path);
};

const handleLogout = () => {
  localStorage.removeItem('ai-generator-auth');
  window.location.reload();
};
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        @click="handleNavigation(item.path)"
      >
        <i class="fas nav-icon" :class="item.icon"></i>
        <div class="nav-content">
          <div class="nav-title">{{ item.title }}</div>
          <div class="nav-description">{{ item.description }}</div>
        </div>
        <div v-if="item.badge && item.badge.value > 0" class="nav-badge">
          {{ item.badge.value }}
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <i class="fas fa-sign-out-alt"></i>
        <span>登出系統</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 80px;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-nav {
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: #f5f5f5;
}

.nav-item.active {
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
}

.nav-icon {
  font-size: 1.25rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
}

.nav-content {
  flex: 1;
}

.nav-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: inherit;
  margin-bottom: 0.125rem;
}

.nav-item:not(.active) .nav-title {
  color: #2c3e50;
}

.nav-description {
  font-size: 0.75rem;
  opacity: 0.7;
}

.nav-item:not(.active) .nav-description {
  color: #6c757d;
}

.nav-badge {
  background: #cebb6b;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 1rem;
  min-width: 1.25rem;
  text-align: center;
}

.nav-item.active .nav-badge {
  background: rgba(255, 255, 255, 0.3);
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  border-top: 1px solid #e5e5e5;
  background: #ffffff;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid #e5e5e5;
  border-radius: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #f5f5f5;
  color: #2c3e50;
  border-color: #2c3e50;
}

/* 手機版響應式 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>
