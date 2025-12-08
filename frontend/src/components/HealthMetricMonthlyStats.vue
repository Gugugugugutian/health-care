<template>
  <div class="health-metric-monthly-stats">
    <h3>健康指标月度统计</h3>

    <div class="controls">
      <div class="filter-item">
        <label for="year">年份</label>
        <select id="year" v-model="selectedYear" @change="loadMonthlySummary">
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}年</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="month">月份</label>
        <select id="month" v-model="selectedMonth" @change="loadMonthlySummary">
          <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="metricType">指标类型</label>
        <select id="metricType" v-model="selectedMetricType" @change="loadMonthlySummary">
          <option value="">全部类型</option>
          <option v-for="type in metricTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="Object.keys(monthlySummary).length === 0" class="empty-state">
      该月份暂无健康指标数据
    </div>

    <div v-else-if="!hasMatchingMetrics" class="empty-state">
      数据存在但无匹配项
    </div>

    <div v-else class="stats-grid">
      <template v-for="(stats, metricType) in monthlySummary" :key="metricType">
        <div
          v-if="!selectedMetricType || selectedMetricType === metricType"
          class="metric-card"
        >
          <h4>{{ metricType }}</h4>
          <div class="stat-item">
            <span class="stat-label">记录数:</span>
            <span class="stat-value">{{ stats.count }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">数值范围:</span>
            <span class="stat-value">
              {{ formatValue(stats.min_value) }} - {{ formatValue(stats.max_value) }}
              <span class="avg-text">(Avg. {{ formatValue(stats.avg_value) }})</span>
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">日期范围:</span>
            <span class="stat-value">{{ formatDate(stats.first_date) }} - {{ formatDate(stats.last_date) }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { healthMetricService } from '../services/healthMetrics';

const selectedYear = ref(2024); // Default to 2024 since we have sample data
const selectedMonth = ref(12);   // Default to December
const selectedMetricType = ref('');
const monthlySummary = ref({});
const metricTypes = ref([]);
const loading = ref(false);

// Check if there are matching metrics after filtering
const hasMatchingMetrics = computed(() => {
  const summary = monthlySummary.value;
  const summaryKeys = Object.keys(summary);

  if (summaryKeys.length === 0) return false;
  if (!selectedMetricType.value) return true; // No filter, all metrics match

  // Check if the selected metric type exists in the summary
  return selectedMetricType.value in summary;
});

// Generate available years (include 2024 for sample data)
const availableYears = [2024, 2025];

const loadMonthlySummary = async () => {
  loading.value = true;
  try {
    const summary = await healthMetricService.getMonthlySummary(selectedYear.value, selectedMonth.value);
    monthlySummary.value = summary.summary || summary || {};

    // Extract metric types from summary
    const keys = Object.keys(monthlySummary.value);
    if (keys.length > 0) {
      metricTypes.value = keys;
      console.log('Metric types extracted:', metricTypes.value);
    } else {
      metricTypes.value = [];
      console.log('No metric types found in summary');
    }
  } catch (error) {
    console.error('Failed to load monthly summary:', error);
    monthlySummary.value = {};

    // If it's an authentication error, show a message
    if (error.response?.status === 401) {
      console.log('Authentication required for monthly summary');
    }
  } finally {
    loading.value = false;
  }
};

const formatValue = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return Number(value).toFixed(2);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

onMounted(() => {
  loadMonthlySummary();
});
</script>

<style scoped>
.health-metric-monthly-stats {
  padding: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.15rem;
  font-weight: 600;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

select {
  padding: 0.625rem 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
  color: #333;
  font-size: 0.9rem;
  width: 100%;
  transition: all 0.2s ease;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

select:hover {
  border-color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

select:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08);
}

select:active {
  border-color: #2c3e50;
}

.loading,
.empty-state {
  text-align: center;
  color: #999;
  padding: 1.5rem;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.metric-card {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #2c3e50;
}

.metric-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #333;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.avg-text {
  color: #666;
  font-size: 0.9em;
  font-weight: 400;
}
</style>