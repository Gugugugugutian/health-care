<template>
  <div class="health-metrics">
    <div class="page-header">
      <h1>健康指标</h1>
      <button @click="showAddModal = true" class="add-btn">添加指标</button>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <input
          v-model="searchQuery"
          @input="searchMetrics"
          type="text"
          placeholder="搜索指标..."
          class="search-input"
        />
        <select v-model="selectedYear" @change="loadMonthlySummary" class="year-select">
          <option value="">选择年份</option>
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
        <select v-model="selectedMonth" @change="loadMonthlySummary" class="month-select">
          <option value="">选择月份</option>
          <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
        </select>
        <button @click="clearFilters" class="filter-btn">清除</button>
      </div>
    </div>

    <div v-if="showMonthlySummary && monthlySummary" class="summary-section">
      <h2>月度摘要</h2>
      <div class="summary-content">
        <pre>{{ JSON.stringify(monthlySummary, null, 2) }}</pre>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="metrics-content">
      <div v-if="metrics.length === 0" class="empty-state">
        暂无健康指标记录
      </div>
      <div v-else class="metrics-list">
        <div
          v-for="metric in metrics"
          :key="metric.id"
          class="metric-card"
        >
          <div class="metric-header">
            <h3>{{ metric.metric_type || '未知类型' }}</h3>
            <div class="metric-actions">
              <button @click="editMetric(metric)" class="edit-btn">编辑</button>
              <button @click="deleteMetric(metric.id)" class="delete-btn">删除</button>
            </div>
          </div>
          <div class="metric-details">
            <p><strong>值:</strong> {{ metric.metric_value }} {{ metric.unit || '' }}</p>
            <p><strong>日期:</strong> {{ formatDate(metric.recorded_date) }}</p>
            <p v-if="metric.notes"><strong>备注:</strong> {{ metric.notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Metric Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ showEditModal ? '编辑指标' : '添加健康指标' }}</h2>
        <form @submit.prevent="saveMetric">
          <div class="form-group">
            <label>指标类型 *</label>
            <select v-model="currentMetric.metric_type" required>
              <option value="">选择类型</option>
              <option value="weight">体重</option>
              <option value="blood_pressure">血压</option>
              <option value="heart_rate">心率</option>
              <option value="steps">步数</option>
              <option value="calories">卡路里</option>
              <option value="sleep_hours">睡眠时长</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>值 *</label>
            <input
              v-model.number="currentMetric.metric_value"
              type="number"
              step="0.01"
              required
            />
          </div>
          <div class="form-group">
            <label>单位</label>
            <input v-model="currentMetric.unit" type="text" placeholder="例如：kg, bpm, steps" />
          </div>
          <div class="form-group">
            <label>记录日期 *</label>
            <input
              v-model="currentMetric.recorded_date"
              type="date"
              required
            />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="currentMetric.notes" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">保存</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { healthMetricService } from '../services/healthMetrics';

const metrics = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const searchQuery = ref('');
const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedYear = ref('');
const selectedMonth = ref('');
const monthlySummary = ref(null);
const showMonthlySummary = ref(false);

const currentMetric = ref({
  metric_type: '',
  metric_value: '',
  unit: '',
  recorded_date: '',
  notes: '',
});

const currentMetricId = ref(null);

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});

const months = [
  { value: '01', label: '1月' },
  { value: '02', label: '2月' },
  { value: '03', label: '3月' },
  { value: '04', label: '4月' },
  { value: '05', label: '5月' },
  { value: '06', label: '6月' },
  { value: '07', label: '7月' },
  { value: '08', label: '8月' },
  { value: '09', label: '9月' },
  { value: '10', label: '10月' },
  { value: '11', label: '11月' },
  { value: '12', label: '12月' },
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const loadMetrics = async () => {
  try {
    loading.value = true;
    metrics.value = await healthMetricService.getAll();
  } catch (err) {
    error.value = err.response?.data?.error || '加载指标失败';
  } finally {
    loading.value = false;
  }
};

const searchMetrics = async () => {
  if (!searchQuery.value.trim()) {
    loadMetrics();
    return;
  }

  try {
    const results = await healthMetricService.search(searchQuery.value);
    metrics.value = results;
  } catch (err) {
    console.error('Search failed:', err);
  }
};

const loadMonthlySummary = async () => {
  if (!selectedYear.value || !selectedMonth.value) {
    showMonthlySummary.value = false;
    return;
  }

  try {
    monthlySummary.value = await healthMetricService.getMonthlySummary(
      selectedYear.value,
      selectedMonth.value
    );
    showMonthlySummary.value = true;
  } catch (err) {
    error.value = err.response?.data?.error || '加载月度摘要失败';
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedYear.value = '';
  selectedMonth.value = '';
  showMonthlySummary.value = false;
  loadMetrics();
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  currentMetric.value = {
    metric_type: '',
    metric_value: '',
    unit: '',
    recorded_date: '',
    notes: '',
  };
  currentMetricId.value = null;
};

const editMetric = (metric) => {
  currentMetricId.value = metric.id;
  currentMetric.value = { ...metric };
  showEditModal.value = true;
};

const saveMetric = async () => {
  try {
    error.value = '';
    success.value = '';
    
    if (showEditModal.value) {
      await healthMetricService.update(currentMetricId.value, currentMetric.value);
      success.value = '指标更新成功';
    } else {
      await healthMetricService.create(currentMetric.value);
      success.value = '指标添加成功';
    }
    
    closeModal();
    await loadMetrics();
  } catch (err) {
    error.value = err.response?.data?.error || '保存失败';
  }
};

const deleteMetric = async (id) => {
  if (!confirm('确定要删除此指标吗？')) return;

  try {
    error.value = '';
    success.value = '';
    await healthMetricService.delete(id);
    success.value = '指标已删除';
    await loadMetrics();
  } catch (err) {
    error.value = err.response?.data?.error || '删除失败';
  }
};

onMounted(() => {
  loadMetrics();
});
</script>

<style scoped>
.health-metrics {
  max-width: 1000px;
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

.filters-section {
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-input,
.year-select,
.month-select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.year-select,
.month-select {
  min-width: 120px;
}

.search-input:focus,
.year-select:focus,
.month-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-btn {
  padding: 0.75rem 1.5rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.filter-btn:hover {
  opacity: 0.9;
}

.summary-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.summary-section h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.summary-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.summary-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.metric-header h3 {
  margin: 0;
  color: #333;
}

.metric-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.edit-btn {
  background-color: #667eea;
  color: white;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 0.9;
}

.metric-details p {
  margin: 0.5rem 0;
  color: #666;
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
  max-height: 90vh;
  overflow-y: auto;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
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

