<template>
  <div class="profile">
    <h1>个人资料</h1>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="profile-content">
      <div class="profile-section">
        <h2>基本信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>健康ID</label>
            <p>{{ profile.health_id }}</p>
          </div>
          <div class="info-item">
            <label>姓名</label>
            <p>{{ profile.name }}</p>
          </div>
          <div class="info-item">
            <label>电话</label>
            <div class="info-with-badge">
              <p>{{ profile.phone }}</p>
              <span :class="['badge', profile.phone_verified ? 'verified' : 'unverified']">
                {{ profile.phone_verified ? '已验证' : '未验证' }}
              </span>
              <button
                v-if="!profile.phone_verified"
                @click="verifyPhone"
                class="verify-btn"
              >
                验证
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2>邮箱地址</h2>
        <div class="emails-list">
          <div
            v-for="email in profile.emails || []"
            :key="email.id"
            class="email-item"
          >
            <span>{{ email.email }}</span>
            <div class="email-actions">
              <span :class="['badge', email.verified ? 'verified' : 'unverified']">
                {{ email.verified ? '已验证' : '未验证' }}
              </span>
              <span v-if="email.is_primary" class="badge primary">主要</span>
              <button
                v-if="!email.verified"
                @click="verifyEmail(email.id)"
                class="verify-btn"
              >
                验证
              </button>
            </div>
          </div>
        </div>
        <div class="add-email-section">
          <input
            v-model="newEmail"
            type="email"
            placeholder="输入新邮箱地址"
            class="email-input"
          />
          <button @click="addEmail" class="add-btn">添加邮箱</button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '../services/auth';

const profile = ref({});
const loading = ref(true);
const error = ref('');
const success = ref('');
const newEmail = ref('');

const loadProfile = async () => {
  try {
    loading.value = true;
    profile.value = await authService.getProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '加载资料失败';
  } finally {
    loading.value = false;
  }
};

const addEmail = async () => {
  if (!newEmail.value) return;

  try {
    error.value = '';
    success.value = '';
    await authService.addEmail(newEmail.value);
    success.value = '邮箱添加成功';
    newEmail.value = '';
    await loadProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '添加邮箱失败';
  }
};

const verifyEmail = async (emailId) => {
  try {
    error.value = '';
    success.value = '';
    await authService.verifyEmail(emailId);
    success.value = '邮箱验证成功';
    await loadProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '验证失败';
  }
};

const verifyPhone = async () => {
  try {
    error.value = '';
    success.value = '';
    await authService.verifyPhone();
    success.value = '电话验证成功';
    await loadProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '验证失败';
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.info-item p {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.info-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge.verified {
  background-color: #d4edda;
  color: #155724;
}

.badge.unverified {
  background-color: #fff3cd;
  color: #856404;
}

.badge.primary {
  background-color: #cfe2ff;
  color: #084298;
}

.verify-btn {
  padding: 0.25rem 0.75rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.verify-btn:hover {
  opacity: 0.9;
}

.emails-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.email-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.email-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.add-email-section {
  display: flex;
  gap: 1rem;
}

.email-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.email-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.add-btn:hover {
  opacity: 0.9;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee;
  color: #c33;
  border-radius: 6px;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #efe;
  color: #3c3;
  border-radius: 6px;
}
</style>

