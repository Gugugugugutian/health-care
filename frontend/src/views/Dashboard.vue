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
  margin-bottom: 1.25rem;
  font-size: 1.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

.stat-label {
  color: #999;
  font-size: 0.8rem;
  margin: 0.25rem 0 0 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.dashboard-section {
  background: white;
  padding: 1.25rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.dashboard-section h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.15rem;
  font-weight: 600;
}

.loading,
.empty-state {
  text-align: center;
  color: #999;
  padding: 1.5rem;
  font-size: 0.9rem;
}

.appointments-list,
.challenges-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.appointment-item,
.challenge-item {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.appointment-item:hover {
  background-color: #f0f0f0;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.appointment-info strong {
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
}

.appointment-info span {
  color: #666;
  font-size: 0.85rem;
}

.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
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
  gap: 0.5rem;
}

.challenge-item:hover {
  background-color: #f0f0f0;
}

.challenge-item h4 {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
}

.challenge-dates {
  color: #666;
  font-size: 0.8rem;
  margin: 0;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin: 0.25rem 0;
}

.progress-fill {
  height: 100%;
  background-color: #2c3e50;
  transition: width 0.3s;
}

.progress-text {
  margin: 0;
  color: #666;
  font-size: 0.8rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.analytics-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
</style>

