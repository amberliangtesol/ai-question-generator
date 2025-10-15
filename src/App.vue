<script setup>
import { ref, onMounted } from 'vue'
import PasswordLogin from './components/PasswordLogin.vue'

const isAuthenticated = ref(false)

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

onMounted(() => {
  checkAuth()
})
</script>

<template>
  <div id="app">
    <PasswordLogin v-if="!isAuthenticated" @login="handleLogin" />
    <main v-else class="main-content">
      <router-view />
    </main>
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


.main-content {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .main-content {
    max-width: 100%;
    padding: 1rem;
  }
}
</style>
