<template>
  <div class="most-popular-challenges">
    <div class="section-header">
      <h3>最热门的健康挑战</h3>
      <span class="subtitle">按参与人数排序</span>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="challenges.length === 0" class="empty-state">
      暂无活跃的健康挑战
    </div>

    <div v-else class="challenges-list">
      <div
        v-for="(challenge, index) in challenges"
        :key="challenge.challenge_id"
        class="challenge-card"
        :class="{ 'top-challenge': index === 0 }"
      >
        <div class="challenge-rank">
          <span class="rank-number">#{{ index + 1 }}</span>
          <span v-if="index === 0" class="rank-badge">🏆 最热门</span>
        </div>

        <div class="challenge-content">
          <h4>{{ challenge.title }}</h4>
          <p class="challenge-goal">{{ challenge.goal }}</p>

          <div class="challenge-meta">
            <div class="meta-item">
              <span class="meta-icon">👥</span>
              <span class="meta-text">{{ challenge.participant_count }} 人参与</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-text">{{ formatDate(challenge.start_date) }} - {{ formatDate(challenge.end_date) }}</span>
            </div>
            <div v-if="challenge.avg_progress" class="meta-item">
              <span class="meta-icon">📊</span>
              <span class="meta-text">平均进度: {{ Math.round(parseFloat(challenge.avg_progress)) }}%</span>
            </div>
          </div>

          <div v-if="challenge.description" class="challenge-description">
            {{ challenge.description }}
          </div>
        </div>

        <div class="participant-count">
          <div class="count-circle">
            <span class="count-number">{{ challenge.participant_count }}</span>
            <span class="count-label">参与者</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { challengeService } from '../services/challenges';

const challenges = ref([]);
const loading = ref(false);

const loadMostPopularChallenges = async () => {
  loading.value = true;
  try {
    const popularChallenges = await challengeService.getMostPopular(5);
    challenges.value = popularChallenges;
  } catch (error) {
    console.error('Failed to load most popular challenges:', error);
    challenges.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

onMounted(() => {
  loadMostPopularChallenges();
});
</script>

<style scoped>
.most-popular-challenges {
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

.challenges-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.challenge-card {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.challenge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.challenge-card.top-challenge {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
}

.challenge-rank {
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

.challenge-content {
  flex: 1;
}

.challenge-content h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.challenge-goal {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.challenge-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-icon {
  font-size: 0.9rem;
}

.meta-text {
  color: #666;
  font-size: 0.85rem;
}

.challenge-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.participant-count {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.count-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
}

.count-number {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.count-label {
  font-size: 0.75rem;
  opacity: 0.9;
}
</style>