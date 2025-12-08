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
        </div>

        <div class="challenge-content">
          <div class="challenge-title-row">
            <h4>{{ challenge.title }}</h4>
            <span v-if="challenge.avg_progress" class="avg-progress">
              {{ Math.round(parseFloat(challenge.avg_progress)) }}%
            </span>
          </div>
          <p class="challenge-goal">{{ challenge.goal }}</p>

          <div class="challenge-meta">
            <div class="meta-item">
              <span class="meta-icon">👥</span>
              <span class="meta-text">{{ challenge.participant_count }}人</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-text">{{ formatDate(challenge.start_date) }} - {{ formatDate(challenge.end_date) }}</span>
            </div>
          </div>

          <div v-if="challenge.description" class="challenge-description">
            {{ challenge.description }}
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
  padding: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 1.15rem;
  font-weight: 600;
}

.subtitle {
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.loading,
.empty-state {
  text-align: center;
  color: #999;
  padding: 1.5rem;
  font-size: 0.9rem;
}

.challenges-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.challenge-card {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.challenge-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #f0f0f0;
}

.challenge-card.top-challenge {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
}

.challenge-rank {
  display: flex;
  align-items: center;
  min-width: 35px;
}

.rank-number {
  font-size: 1.2rem;
  font-weight: 600;
  color: #666;
}

.challenge-content {
  flex: 1;
}

.challenge-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  gap: 0.5rem;
}

.challenge-content h4 {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
}

.avg-progress {
  color: #2c3e50;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.challenge-goal {
  margin: 0 0 0.4rem 0;
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.challenge-meta {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.9rem;
  align-items: center;
  margin-bottom: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
}

.challenge-meta::-webkit-scrollbar {
  height: 3px;
}

.challenge-meta::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.meta-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.meta-text {
  color: #666;
  font-size: 0.8rem;
}

.challenge-description {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid #e0e0e0;
}

.participant-count {
  display: flex;
  align-items: center;
  margin-left: 0.75rem;
}

.count-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #2c3e50;
  border-radius: 50%;
  color: white;
}

.count-number {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.count-label {
  font-size: 0.7rem;
  opacity: 0.9;
}
</style>