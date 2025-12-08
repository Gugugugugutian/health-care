<template>
  <div class="register-container">
    <div class="register-card">
      <h1>注册 HealthTrack</h1>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label>健康ID *</label>
          <input
            v-model="form.health_id"
            type="text"
            required
            placeholder="输入唯一的健康ID"
          />
        </div>
        <div class="form-group">
          <label>姓名 *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="输入您的姓名"
          />
        </div>
        <div class="form-group">
          <label>电话 *</label>
          <input
            v-model="form.phone"
            type="tel"
            required
            placeholder="+1234567890"
          />
        </div>
        <div class="form-group">
          <label>邮箱 *</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="输入您的邮箱"
          />
        </div>
        <div class="form-group">
          <label>密码 *</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="至少8位，包含大小写字母和数字"
            minlength="8"
          />
        </div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <p class="login-link">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </p>
      </form>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';

const router = useRouter();

const form = ref({
  health_id: '',
  name: '',
  phone: '',
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref('');
const success = ref('');

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await authService.register(form.value);
    success.value = '注册成功！正在跳转...';
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (err) {
    error.value = err.response?.data?.error || '注册失败，请检查输入信息';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 2rem;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.submit-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background-color: #34495e;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}

.login-link a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee;
  color: #c33;
  border-radius: 6px;
  text-align: center;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #efe;
  color: #3c3;
  border-radius: 6px;
  text-align: center;
}
</style>

