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
        <div class="date-filters">
          <select v-model="selectedYear" @change="loadMonthlySummary" class="year-select">
            <option value="">选择年份</option>
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
          <select v-model="selectedMonth" @change="loadMonthlySummary" class="month-select">
            <option value="">选择月份</option>
            <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
          </select>
        </div>
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
          <div class="form-group" v-if="isAdmin && familyMembers.length > 0">
            <label>为家庭成员添加（可选）</label>
            <select v-model="currentMetric.target_user_id">
              <option :value="null">为自己添加</option>
              <option
                v-for="member in familyMembers"
                :key="member.user_id"
                :value="member.user_id"
              >
                {{ member.name }} ({{ member.health_id }})
              </option>
            </select>
            <p class="form-hint">作为家庭组管理员，您可以为其他成员添加健康指标</p>
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
import { familyService } from '../services/family';

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
const familyGroups = ref([]);
const familyMembers = ref([]);
const isAdmin = ref(false);

const currentMetric = ref({
  metric_type: '',
  metric_value: '',
  unit: '',
  recorded_date: '',
  notes: '',
  target_user_id: null,  // For family group admins
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

const loadFamilyGroups = async () => {
  try {
    const groups = await familyService.getAll();
    familyGroups.value = groups;
    
    // Check if user is an admin in any family group
    isAdmin.value = groups.some(g => g.can_manage);
    
    // Collect all family members from all groups where user is admin
    const allMembers = [];
    for (const group of groups) {
      if (group.can_manage) {
        try {
          const members = await familyService.getMembers(group.family_id);
          allMembers.push(...members);
        } catch (err) {
          console.error('Failed to load members for group', group.family_id, err);
        }
      }
    }
    
    // Remove duplicates
    const uniqueMembers = [];
    const seenIds = new Set();
    for (const member of allMembers) {
      if (!seenIds.has(member.user_id)) {
        seenIds.add(member.user_id);
        uniqueMembers.push(member);
      }
    }
    
    familyMembers.value = uniqueMembers;
  } catch (err) {
    console.error('Failed to load family groups:', err);
  }
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
    target_user_id: null,
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

onMounted(async () => {
  await Promise.all([loadMetrics(), loadFamilyGroups()]);
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

.filters-section {
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.date-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.year-select,
.month-select {
  min-width: 120px;
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
  transition: all 0.2s ease;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.year-select:hover,
.month-select:hover {
  border-color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.search-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.year-select:focus,
.month-select:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.year-select:active,
.month-select:active {
  border-color: #2c3e50;
}

.filter-btn {
  padding: 0.75rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.filter-btn:hover {
  background-color: #34495e;
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
  background-color: #2c3e50;
  color: white;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.edit-btn:hover {
  background-color: #34495e;
}

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
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group select {
  width: 100%;
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
  transition: all 0.2s ease;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-group select:hover {
  border-color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
}

.form-group select:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.form-group select:active {
  border-color: #2c3e50;
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

