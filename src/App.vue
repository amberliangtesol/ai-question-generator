<script setup>
import { ref, onMounted } from 'vue'
import PasswordLogin from './components/PasswordLogin.vue'
import AppSidebar from './components/AppSidebar.vue'

const isAuthenticated = ref(false)
const isMobileMenuOpen = ref(false)

const checkAuth = () => {
  const authStatus = localStorage.getItem('ai-generator-auth')
  isAuthenticated.value = authStatus === 'true'
}

const handleLogin = (success) => {
  if (success) {
    isAuthenticated.value = true
    // 登入成功後滾動到頁面頂部
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }, 100)
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

onMounted(() => {
  checkAuth()
})
</script>

<template>
  <div id="app">
    <PasswordLogin v-if="!isAuthenticated" @login="handleLogin" />
    <div v-else class="app-layout">
      <AppSidebar :class="{ 'mobile-open': isMobileMenuOpen }" />
      
      <div class="content-wrapper">
        <!-- 手機版頂部選單 -->
        <header class="mobile-header">
          <button class="menu-toggle" @click="toggleMobileMenu">
            <span>☰</span>
          </button>
          <h1 class="mobile-title">AI智多興出題系統</h1>
        </header>
        
        <main class="main-content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft JhengHei', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.content-wrapper {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
  width: 100%;
}

.mobile-header {
  display: none;
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
  padding: 1rem 1.5rem;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.menu-toggle {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
}

.mobile-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.app-layout .main-content {
  flex: 1;
  width: 100%;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .content-wrapper {
    margin-left: 0;
  }
  
  .mobile-header {
    display: flex;
  }
  
}
</style>
