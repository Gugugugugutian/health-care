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
            <div class="info-with-actions">
              <p>{{ profile.health_id }}</p>
              <span class="info-note">（不可修改）</span>
            </div>
          </div>
          <div class="info-item">
            <label>姓名</label>
            <div class="info-with-actions">
              <p v-if="!editingName">{{ profile.name }}</p>
              <input
                v-else
                v-model="editName"
                type="text"
                class="edit-input"
                placeholder="输入姓名"
              />
              <button
                v-if="!editingName"
                @click="startEditName"
                class="edit-btn"
              >
                编辑
              </button>
              <div v-else class="edit-actions">
                <button @click="saveName" class="save-btn">保存</button>
                <button @click="cancelEditName" class="cancel-btn">取消</button>
              </div>
            </div>
          </div>
          <div class="info-item">
            <label>电话</label>
            <div class="info-with-actions">
              <div v-if="!editingPhone" class="phone-display">
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
              <div v-else class="phone-edit">
                <input
                  v-model="editPhone"
                  type="tel"
                  class="edit-input"
                  placeholder="输入新电话号码"
                />
                <div class="edit-actions">
                  <button @click="savePhone" class="save-btn">保存</button>
                  <button @click="cancelEditPhone" class="cancel-btn">取消</button>
                </div>
              </div>
              <button
                v-if="!editingPhone"
                @click="startEditPhone"
                class="edit-btn"
              >
                编辑
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
            :key="email.email_id || email.id"
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
                @click="verifyEmail(email.email_id || email.id)"
                class="verify-btn"
              >
                验证
              </button>
              <button
                v-if="!email.is_primary"
                @click="deleteEmail(email.email_id || email.id)"
                class="delete-btn"
              >
                删除
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

// Edit states
const editingName = ref(false);
const editingPhone = ref(false);
const editName = ref('');
const editPhone = ref('');

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

// Name editing
const startEditName = () => {
  editingName.value = true;
  editName.value = profile.value.name || '';
};

const cancelEditName = () => {
  editingName.value = false;
  editName.value = '';
};

const saveName = async () => {
  if (!editName.value.trim()) {
    error.value = '姓名不能为空';
    return;
  }

  try {
    error.value = '';
    success.value = '';
    await authService.updateProfile({ name: editName.value.trim() });
    success.value = '姓名更新成功';
    editingName.value = false;
    editName.value = '';
    await loadProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '更新失败';
  }
};

// Phone editing
const startEditPhone = () => {
  editingPhone.value = true;
  editPhone.value = profile.value.phone || '';
};

const cancelEditPhone = () => {
  editingPhone.value = false;
  editPhone.value = '';
};

const savePhone = async () => {
  if (!editPhone.value.trim()) {
    error.value = '电话号码不能为空';
    return;
  }

  try {
    error.value = '';
    success.value = '';
    await authService.updatePhone(editPhone.value.trim());
    success.value = '电话号码更新成功';
    editingPhone.value = false;
    editPhone.value = '';
    await loadProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '更新失败';
  }
};

// Delete email
const deleteEmail = async (emailId) => {
  if (!confirm('确定要删除这个邮箱地址吗？')) {
    return;
  }

  try {
    error.value = '';
    success.value = '';
    await authService.deleteEmail(emailId);
    success.value = '邮箱删除成功';
    await loadProfile();
  } catch (err) {
    error.value = err.response?.data?.error || '删除失败';
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
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.verify-btn:hover {
  background-color: #34495e;
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
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background-color: #34495e;
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

/* New styles for edit functionality */
.info-with-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-note {
  font-size: 0.85rem;
  color: #999;
}

.phone-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.phone-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-input {
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
}

.edit-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.edit-btn {
  padding: 0.25rem 0.75rem;
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  align-self: flex-start;
  transition: all 0.3s;
}

.edit-btn:hover {
  background-color: #e9ecef;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-btn {
  padding: 0.25rem 0.75rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.save-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  padding: 0.25rem 0.75rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.cancel-btn:hover {
  opacity: 0.9;
}

.delete-btn {
  padding: 0.25rem 0.75rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.delete-btn:hover {
  opacity: 0.9;
}
</style>

