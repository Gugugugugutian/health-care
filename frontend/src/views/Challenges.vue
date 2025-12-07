<template>
  <div class="challenges">
    <div class="page-header">
      <h1>健康挑战</h1>
      <button @click="showAddModal = true" class="add-btn">创建挑战</button>
    </div>

    <div class="search-section">
      <input
        v-model="searchQuery"
        @input="searchChallenges"
        type="text"
        placeholder="搜索挑战..."
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="challenges-content">
      <div class="challenges-section">
        <h2>我的挑战</h2>
        <div v-if="myChallenges.length === 0" class="empty-state">
          暂无挑战
        </div>
        <div v-else class="challenges-grid">
          <div
            v-for="challenge in myChallenges"
            :key="challenge.challenge_id"
            class="challenge-card"
          >
            <h3>{{ challenge.title || challenge.goal || challenge.challenge_goal }}</h3>
            <p v-if="challenge.goal && challenge.title" class="challenge-goal">{{ challenge.goal }}</p>
            <p class="challenge-dates">
              {{ formatDate(challenge.start_date) }} - {{ formatDate(challenge.end_date) }}
            </p>
            <div class="progress-section">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${(challenge.progress || 0)}%` }"
                ></div>
              </div>
              <p class="progress-text">进度: {{ challenge.progress || 0 }}%</p>
            </div>
            <div class="challenge-actions">
              <button
                @click="showProgressModal(challenge)"
                class="update-btn"
              >
                更新进度
              </button>
              <button
                v-if="challenge.user_role === 'creator'"
                @click="deleteChallenge(challenge.challenge_id)"
                class="delete-btn"
              >
                删除
              </button>
              <button
                v-if="challenge.user_role === 'participant'"
                @click="leaveChallenge(challenge.challenge_id)"
                class="leave-btn"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="challenges-section">
        <h2>活跃挑战</h2>
        <div v-if="activeChallenges.length === 0" class="empty-state">
          暂无活跃挑战
        </div>
        <div v-else class="challenges-grid">
          <div
            v-for="challenge in activeChallenges"
            :key="challenge.challenge_id"
            class="challenge-card"
          >
            <h3>{{ challenge.title || challenge.goal || challenge.challenge_goal }}</h3>
            <p v-if="challenge.goal && challenge.title" class="challenge-goal">{{ challenge.goal }}</p>
            <p class="challenge-dates">
              {{ formatDate(challenge.start_date) }} - {{ formatDate(challenge.end_date) }}
            </p>
            <div class="challenge-actions">
              <button
                v-if="!isMyChallenge(challenge.challenge_id)"
                @click="joinChallenge(challenge.challenge_id)"
                class="join-btn"
              >
                加入挑战
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Challenge Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <h2>创建健康挑战</h2>
        <form @submit.prevent="createChallenge">
          <div class="form-group">
            <label>挑战标题 *</label>
            <input v-model="newChallenge.title" type="text" required placeholder="例如：月度步行挑战" />
          </div>
          <div class="form-group">
            <label>挑战目标 *</label>
            <input v-model="newChallenge.goal" type="text" required placeholder="例如：一个月内走100英里" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="newChallenge.description" rows="3" placeholder="挑战描述（可选）"></textarea>
          </div>
          <div class="form-group">
            <label>开始日期 *</label>
            <input v-model="newChallenge.start_date" type="date" required />
          </div>
          <div class="form-group">
            <label>结束日期 *</label>
            <input v-model="newChallenge.end_date" type="date" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">创建</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Progress Modal -->
    <div v-if="showProgressModalVisible" class="modal-overlay" @click="showProgressModalVisible = false">
      <div class="modal-content" @click.stop>
        <h2>更新进度</h2>
        <form @submit.prevent="updateProgress">
          <div class="form-group">
            <label>进度 (%) *</label>
            <input
              v-model.number="progressValue"
              type="number"
              min="0"
              max="100"
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="showProgressModalVisible = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">更新</button>
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
import { challengeService } from '../services/challenges';

const myChallenges = ref([]);
const activeChallenges = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const searchQuery = ref('');
const showAddModal = ref(false);
const showProgressModalVisible = ref(false);
const currentChallengeId = ref(null);
const progressValue = ref(0);

const newChallenge = ref({
  title: '',
  goal: '',
  description: '',
  start_date: '',
  end_date: '',
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const loadChallenges = async () => {
  try {
    loading.value = true;
    const [mine, active] = await Promise.all([
      challengeService.getAll().catch(() => []),
      challengeService.getActive().catch(() => []),
    ]);
    myChallenges.value = mine;
    activeChallenges.value = active;
  } catch (err) {
    error.value = err.response?.data?.error || '加载挑战失败';
  } finally {
    loading.value = false;
  }
};

const searchChallenges = async () => {
  if (!searchQuery.value.trim()) {
    loadChallenges();
    return;
  }

  try {
    const results = await challengeService.search(searchQuery.value);
    activeChallenges.value = results;
  } catch (err) {
    console.error('Search failed:', err);
  }
};

const isMyChallenge = (challengeId) => {
  return myChallenges.value.some(c => c.challenge_id === challengeId);
};

const createChallenge = async () => {
  try {
    error.value = '';
    success.value = '';
    await challengeService.create(newChallenge.value);
    success.value = '挑战创建成功';
    showAddModal.value = false;
    newChallenge.value = { title: '', goal: '', description: '', start_date: '', end_date: '' };
    await loadChallenges();
  } catch (err) {
    error.value = err.response?.data?.error || '创建挑战失败';
  }
};

const showProgressModal = (challenge) => {
  currentChallengeId.value = challenge.challenge_id;
  progressValue.value = challenge.progress || 0;
  showProgressModalVisible.value = true;
};

const updateProgress = async () => {
  try {
    error.value = '';
    success.value = '';
    await challengeService.updateProgress(currentChallengeId.value, progressValue.value);
    success.value = '进度更新成功';
    showProgressModalVisible.value = false;
    await loadChallenges();
  } catch (err) {
    error.value = err.response?.data?.error || '更新进度失败';
  }
};


const joinChallenge = async (id) => {
  try {
    error.value = '';
    success.value = '';
    await challengeService.join(id);
    success.value = '已加入挑战';
    await loadChallenges();
  } catch (err) {
    error.value = err.response?.data?.error || '加入挑战失败';
  }
};

const deleteChallenge = async (id) => {
  if (!confirm('确定要删除这个挑战吗？此操作不可撤销。')) return;

  try {
    error.value = '';
    success.value = '';
    await challengeService.delete(id);
    success.value = '挑战已删除';
    await loadChallenges();
  } catch (err) {
    error.value = err.response?.data?.error || '删除挑战失败';
  }
};

const leaveChallenge = async (id) => {
  if (!confirm('确定要退出这个挑战吗？')) return;

  try {
    error.value = '';
    success.value = '';
    await challengeService.leave(id);
    success.value = '已退出挑战';
    await loadChallenges();
  } catch (err) {
    error.value = err.response?.data?.error || '退出挑战失败';
  }
};

onMounted(() => {
  loadChallenges();
});
</script>

<style scoped>
.challenges {
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
  border-color: #667eea;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.challenges-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.challenges-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.challenges-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.challenge-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.challenge-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.challenge-dates {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0 1rem 0;
}

.challenge-goal {
  color: #667eea;
  font-weight: 500;
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.progress-section {
  margin: 1rem 0;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
}

.challenge-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.update-btn,
.join-btn,
.delete-btn,
.leave-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.update-btn {
  background-color: #667eea;
  color: white;
}

.join-btn {
  background-color: #28a745;
  color: white;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.leave-btn {
  background-color: #ffc107;
  color: #333;
}

.update-btn:hover,
.join-btn:hover,
.delete-btn:hover,
.leave-btn:hover {
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cancel-btn:hover,
.submit-btn:hover {
  opacity: 0.9;
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

