<template>
  <div class="most-active-users">
    <div class="section-header">
      <h3>最活跃的用户</h3>
      <span class="subtitle">按健康活动参与度排序</span>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="users.length === 0" class="empty-state">
      暂无用户活动数据
    </div>

    <div v-else class="users-list">
      <div
        v-for="(user, index) in users"
        :key="user.user_id"
        class="user-card"
        :class="{ 'top-user': index === 0 }"
      >
        <div class="user-rank">
          <span class="rank-number">#{{ index + 1 }}</span>
          <span v-if="index === 0" class="rank-badge">🌟 最活跃</span>
        </div>

        <div class="user-avatar">
          <div class="avatar-circle">
            {{ getUserInitials(user.name) }}
          </div>
        </div>

        <div class="user-info">
          <h4>{{ user.name }}</h4>
          <p class="user-id">ID: {{ user.health_id }}</p>

          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-icon">📊</span>
              <span class="stat-text">{{ user.health_metric_count }} 条健康记录</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🏆</span>
              <span class="stat-text">{{ user.challenge_count }} 个挑战</span>
            </div>
          </div>
        </div>

        <div class="activity-score">
          <div class="score-circle">
            <span class="score-number">{{ user.activity_score }}</span>
            <span class="score-label">活跃度</span>
          </div>
        </div>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item">
        <span class="legend-color" style="background-color: #4caf50;"></span>
        <span class="legend-text">健康记录数</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: #2196f3;"></span>
        <span class="legend-text">挑战参与数</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: #ff9800;"></span>
        <span class="legend-text">活跃度分数 = 健康记录数 + 挑战数×2</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userStatsService } from '../services/userStats';

const users = ref([]);
const loading = ref(false);

const loadMostActiveUsers = async () => {
  loading.value = true;
  try {
    const activeUsers = await userStatsService.getMostActiveUsers(5);
    users.value = activeUsers;
  } catch (error) {
    console.error('Failed to load most active users:', error);
    users.value = [];
  } finally {
    loading.value = false;
  }
};

const getUserInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

onMounted(() => {
  loadMostActiveUsers();
});
</script>

<style scoped>
.most-active-users {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.loading,
.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-card.top-user {
  border-color: #ff9800;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.user-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 1rem;
  min-width: 60px;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.rank-badge {
  font-size: 0.75rem;
  color: #ff9800;
  font-weight: 600;
  background: #fff3cd;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.user-avatar {
  margin-right: 1rem;
}

.avatar-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1.1rem;
}

.user-id {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.85rem;
  font-family: monospace;
}

.user-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 0.9rem;
}

.stat-text {
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.activity-score {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
  border-radius: 50%;
  color: white;
}

.score-number {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-text {
  color: #666;
  font-size: 0.85rem;
}
</style>