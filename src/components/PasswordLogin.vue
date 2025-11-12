<script setup>
import { ref } from 'vue';

const emit = defineEmits(['login']);

const password = ref('');
const error = ref('');
const isLoading = ref(false);
const showPassword = ref(false);

const correctPassword = 'nchuai';

const handleLogin = () => {
  if (!password.value.trim()) {
    error.value = '請輸入密碼';
    return;
  }

  isLoading.value = true;
  error.value = '';

  // 模擬驗證延遲
  setTimeout(() => {
    if (password.value === correctPassword) {
      // 驗證成功，儲存到localStorage
      localStorage.setItem('ai-generator-auth', 'true');
      emit('login', true);
    } else {
      error.value = '密碼錯誤，請重新輸入';
      password.value = '';
    }
    isLoading.value = false;
  }, 500);
};

const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    handleLogin();
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="password-login">
    <div class="login-container">
      <div class="login-header">
        <img src="/logo.png" alt="AI智多興" class="login-logo" />
        <h1>AI 智慧出題系統</h1>
        <p>請輸入密碼以訪問系統</p>
      </div>

      <div class="login-form">
        <div class="input-group">
          <label for="password">密碼</label>
          <div class="password-input-container">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="請輸入系統密碼"
              class="password-input"
              :class="{ error: error }"
              @keypress="handleKeyPress"
              :disabled="isLoading"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="password-toggle"
              :disabled="isLoading"
            >
              <i v-if="showPassword" class="fas fa-eye-slash"></i>
              <i v-else class="fas fa-eye"></i>
            </button>
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>

        <button
          @click="handleLogin"
          class="login-btn"
          :disabled="isLoading || !password.trim()"
        >
          <span v-if="isLoading"><i class="fas fa-spinner fa-spin"></i> 驗證中...</span>
          <span v-else><i class="fas fa-lock"></i> 登入系統</span>
        </button>
      </div>

      <div class="login-footer">
        <p>© 2025 AI智多興出題系統</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f3e9 0%, #e8e4d6 100%);
}

.login-container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  max-width: 180px;
  height: auto;
  margin-bottom: 20px;
}

.login-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.login-header p {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.login-form {
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  width: 100%;
  padding: 12px 16px;
  padding-right: 48px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s;
  background: #f8f9fa;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s;
  opacity: 0.7;
}

.password-toggle:hover:not(:disabled) {
  opacity: 1;
  background: rgba(206, 187, 107, 0.1);
  color: #b8a55f;
}

.password-toggle:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.password-input:focus {
  outline: none;
  border-color: #cebb6b;
  background: white;
  box-shadow: 0 0 0 3px rgba(206, 187, 107, 0.2);
}

.password-input.error {
  border-color: #dc3545;
  background: #fff5f5;
}

.password-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 8px;
  color: #dc3545;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.login-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #cebb6b 0%, #b8a55f 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(206, 187, 107, 0.4);
  background: linear-gradient(135deg, #b8a55f 0%, #a69550 100%);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  text-align: center;
  color: #8b7d5c;
  font-size: 14px;
}

.login-footer p {
  margin: 0;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .password-login {
    padding: 10px;
  }

  .login-container {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 1.6rem;
  }

  .password-input,
  .login-btn {
    font-size: 14px;
  }
}
</style>
