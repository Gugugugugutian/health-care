<template>
  <div class="dashboard">
    <h1>欢迎回来，{{ user?.name || '用户' }}！</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>我的预约</h3>
        <p class="stat-number">{{ appointmentStats.total || 0 }}</p>
        <p class="stat-label">总计</p>
      </div>
      <div class="stat-card">
        <h3>活跃挑战</h3>
        <p class="stat-number">{{ challengeStats.active || 0 }}</p>
        <p class="stat-label">进行中</p>
      </div>
      <div class="stat-card">
        <h3>健康指标</h3>
        <p class="stat-number">{{ healthMetricStats.total || 0 }}</p>
        <p class="stat-label">记录数</p>
      </div>
      <div class="stat-card">
        <h3>家庭组</h3>
        <p class="stat-number">{{ familyStats.total || 0 }}</p>
        <p class="stat-label">成员数</p>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-section">
        <h2>最近的预约</h2>
        <div v-if="loadingAppointments" class="loading">加载中...</div>
        <div v-else-if="recentAppointments.length === 0" class="empty-state">
          暂无预约
        </div>
        <div v-else class="appointments-list">
          <div
            v-for="appointment in recentAppointments"
            :key="appointment.id"
            class="appointment-item"
          >
            <div class="appointment-info">
              <strong>{{ appointment.provider_name || '未知提供者' }}</strong>
              <span>{{ formatDate(appointment.appointment_date) }} {{ appointment.appointment_time }}</span>
            </div>
            <span :class="['status-badge', appointment.status]">
              {{ appointment.status === 'cancelled' ? '已取消' : '已预约' }}
            </span>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>活跃的健康挑战</h2>
        <div v-if="loadingChallenges" class="loading">加载中...</div>
        <div v-else-if="activeChallenges.length === 0" class="empty-state">
          暂无活跃挑战
        </div>
        <div v-else class="challenges-list">
          <div
            v-for="challenge in activeChallenges"
            :key="challenge.id"
            class="challenge-item"
          >
            <h4>{{ challenge.title || challenge.goal || challenge.challenge_goal }}</h4>
            <p class="challenge-dates">
              {{ formatDate(challenge.start_date) }} - {{ formatDate(challenge.end_date) }}
            </p>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(challenge.progress || 0) / 100 * 100}%` }"
              ></div>
            </div>
            <p class="progress-text">进度: {{ challenge.progress || 0 }}%</p>
          </div>
        </div>
      </div>
    </div>

    <div class="analytics-grid">
      <div class="analytics-section">
        <HealthMetricMonthlyStats />
      </div>

      <div class="analytics-section">
        <MostPopularChallenges />
      </div>

      <div class="analytics-section">
        <MostActiveUsers />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '../services/auth';
import { appointmentService } from '../services/appointments';
import { challengeService } from '../services/challenges';
import { healthMetricService } from '../services/healthMetrics';
import { familyService } from '../services/family';
import HealthMetricMonthlyStats from '../components/HealthMetricMonthlyStats.vue';
import MostPopularChallenges from '../components/MostPopularChallenges.vue';
import MostActiveUsers from '../components/MostActiveUsers.vue';

const user = ref(authService.getCurrentUser());

const appointmentStats = ref({});
const challengeStats = ref({});
const healthMetricStats = ref({});
const familyStats = ref({});

const recentAppointments = ref([]);
const activeChallenges = ref([]);

const loadingAppointments = ref(true);
const loadingChallenges = ref(true);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

onMounted(async () => {
  try {
    // Load stats
    const [appStats, chStats, hmStats, famStats] = await Promise.all([
      appointmentService.getStats().catch(() => ({})),
      challengeService.getStats().catch(() => ({})),
      healthMetricService.getStats().catch(() => ({})),
      familyService.getStats().catch(() => ({})),
    ]);

    appointmentStats.value = appStats;
    challengeStats.value = chStats;
    healthMetricStats.value = hmStats;
    familyStats.value = famStats;

    // Load recent appointments
    try {
      const appointments = await appointmentService.getAll();
      recentAppointments.value = appointments.slice(0, 5);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      loadingAppointments.value = false;
    }

    // Load active challenges
    try {
      const challenges = await challengeService.getActive();
      activeChallenges.value = challenges.slice(0, 5);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      loadingChallenges.value = false;
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.stat-label {
  color: #999;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.dashboard-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.loading,
.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.appointments-list,
.challenges-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-item,
.challenge-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.appointment-info strong {
  color: #333;
}

.appointment-info span {
  color: #666;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge:not(.cancelled) {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.challenge-item {
  flex-direction: column;
  align-items: flex-start;
}

.challenge-item h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.challenge-dates {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
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

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.analytics-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>

