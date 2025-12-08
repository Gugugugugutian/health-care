<template>
  <div class="providers">
    <div class="page-header">
      <h1>医疗提供者</h1>
      <button @click="showAddModal = true" class="add-btn">添加提供者</button>
    </div>

    <div class="search-section">
      <input
        v-model="searchQuery"
        @input="searchProviders"
        type="text"
        placeholder="搜索提供者..."
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="providers-content">
      <div class="providers-section">
        <h2>我的提供者</h2>
        <div v-if="myProviders.length === 0" class="empty-state">
          暂无关联的提供者
        </div>
        <div v-else class="providers-grid">
          <div
            v-for="provider in myProviders"
            :key="provider.provider_id"
            class="provider-card"
          >
            <h3>{{ provider.name }}</h3>
            <p class="specialty">{{ provider.specialty }}</p>
            <p class="license">许可证: {{ provider.license_number }}</p>
            <div class="provider-actions">
              <span :class="['badge', provider.verified ? 'verified' : 'unverified']">
                {{ provider.verified ? '已验证' : '未验证' }}
              </span>
              <span v-if="provider.is_primary" class="badge primary">主要</span>
              <button
                @click="unlinkProvider(provider.provider_id)"
                class="unlink-btn"
              >
                取消关联
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="providers-section">
        <h2>所有提供者</h2>
        <div v-if="allProviders.length === 0" class="empty-state">
          暂无提供者
        </div>
        <div v-else class="providers-grid">
          <div
            v-for="provider in allProviders"
            :key="provider.provider_id"
            class="provider-card"
          >
            <h3>{{ provider.name }}</h3>
            <p class="specialty">{{ provider.specialty }}</p>
            <p class="license">许可证: {{ provider.license_number }}</p>
            <div class="provider-actions">
              <span :class="['badge', provider.verified ? 'verified' : 'unverified']">
                {{ provider.verified ? '已验证' : '未验证' }}
              </span>
              <button
                v-if="!isMyProvider(provider.provider_id) && provider.verified"
                @click="linkProvider(provider.provider_id)"
                class="link-btn"
              >
                关联
              </button>
              <button
                v-if="!isMyProvider(provider.provider_id) && provider.verified"
                @click="linkProvider(provider.provider_id, true)"
                class="link-primary-btn"
              >
                设为主要
              </button>
              <button
                v-if="!isMyProvider(provider.provider_id) && !provider.verified"
                @click="verifyProvider(provider.provider_id)"
                class="verify-btn"
              >
                验证
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Provider Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <h2>添加新提供者</h2>
        <form @submit.prevent="addProvider">
          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="newProvider.name" type="text" required />
          </div>
          <div class="form-group">
            <label>许可证号 *</label>
            <input v-model="newProvider.license_number" type="text" required />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="newProvider.email" type="email" />
          </div>
          <div class="form-group">
            <label>电话</label>
            <input v-model="newProvider.phone" type="tel" />
          </div>
          <div class="form-group">
            <label>专业 *</label>
            <input v-model="newProvider.specialty" type="text" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">添加</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { providerService } from '../services/providers';

const allProviders = ref([]);
const myProviders = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const searchQuery = ref('');
const showAddModal = ref(false);

const newProvider = ref({
  name: '',
  license_number: '',
  email: '',
  phone: '',
  specialty: '',
});

const loadProviders = async () => {
  try {
    loading.value = true;
    const [all, mine] = await Promise.all([
      providerService.getAll(),
      providerService.getMine().catch(() => []),
    ]);
    allProviders.value = all;
    myProviders.value = mine;
  } catch (err) {
    error.value = err.response?.data?.error || '加载提供者失败';
  } finally {
    loading.value = false;
  }
};

const searchProviders = async () => {
  if (!searchQuery.value.trim()) {
    loadProviders();
    return;
  }

  try {
    const results = await providerService.search(searchQuery.value);
    allProviders.value = results;
  } catch (err) {
    console.error('Search failed:', err);
  }
};

const isMyProvider = (providerId) => {
  return myProviders.value.some(p => p.provider_id === providerId);
};

const linkProvider = async (providerId, isPrimary = false) => {
  try {
    error.value = '';
    success.value = '';
    await providerService.link(providerId, isPrimary);
    success.value = isPrimary ? '已设为主要提供者' : '提供者关联成功';
    await loadProviders();
  } catch (err) {
    error.value = err.response?.data?.error || '关联失败';
  }
};

const unlinkProvider = async (providerId) => {
  if (!confirm('确定要取消关联此提供者吗？')) return;

  try {
    error.value = '';
    success.value = '';
    await providerService.unlink(providerId);
    success.value = '已取消关联';
    await loadProviders();
  } catch (err) {
    error.value = err.response?.data?.error || '取消关联失败';
  }
};

const addProvider = async () => {
  try {
    error.value = '';
    success.value = '';
    await providerService.create(newProvider.value);
    success.value = '提供者添加成功';
    showAddModal.value = false;
    newProvider.value = { name: '', license_number: '', email: '', phone: '', specialty: '' };
    await loadProviders();
  } catch (err) {
    error.value = err.response?.data?.error || '添加失败';
  }
};

const verifyProvider = async (providerId) => {
  try {
    error.value = '';
    success.value = '';
    await providerService.verify(providerId);
    success.value = '提供者验证成功';
    await loadProviders();
  } catch (err) {
    error.value = err.response?.data?.error || '验证失败';
  }
};

onMounted(() => {
  loadProviders();
});
</script>

<style scoped>
.providers {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  color: #333;
  margin: 0;
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

.search-section {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.providers-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.providers-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.providers-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.provider-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.provider-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.specialty {
  color: #2c3e50;
  font-weight: 500;
  margin: 0.5rem 0;
}

.license {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.provider-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
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

.link-btn,
.link-primary-btn,
.unlink-btn,
.verify-btn {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.link-btn {
  background-color: #2c3e50;
  color: white;
}

.link-primary-btn {
  background-color: #34495e;
  color: white;
}

.unlink-btn {
  background-color: #dc3545;
  color: white;
}

.verify-btn {
  background-color: #ffc107;
  color: #333;
}

.link-btn:hover {
  background-color: #34495e;
}

.link-primary-btn:hover {
  background-color: #2c3e50;
}

.unlink-btn:hover,
.verify-btn:hover {
  opacity: 0.9;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.submit-btn {
  background-color: #2c3e50;
  color: white;
}

.cancel-btn:hover {
  background-color: #d0d0d0;
}

.submit-btn:hover {
  background-color: #34495e;
}

.error-message,
.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
}

.error-message {
  background-color: #fee;
  color: #c33;
}

.success-message {
  background-color: #efe;
  color: #3c3;
}
</style>

