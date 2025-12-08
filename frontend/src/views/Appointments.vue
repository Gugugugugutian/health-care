<template>
  <div class="appointments">
    <div class="page-header">
      <h1>预约管理</h1>
      <button @click="showAddModal = true" class="add-btn">新建预约</button>
    </div>

    <div class="filters-section">
      <div class="search-filters">
        <div class="filter-group">
          <label>医生:</label>
          <select v-model="selectedProvider" class="filter-select">
            <option value="all">所有医生</option>
            <option
              v-for="provider in availableProviders"
              :key="provider.provider_id"
              :value="provider.provider_id"
            >
              {{ provider.name }} - {{ provider.specialty }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>预约类型:</label>
          <select v-model="selectedConsultationType" class="filter-select">
            <option value="all">所有类型</option>
            <option value="In-Person">面对面</option>
            <option value="Virtual">虚拟</option>
          </select>
        </div>

        <div class="filter-group">
          <label>开始日期:</label>
          <input
            v-model="startDate"
            type="date"
            class="filter-input"
            placeholder="开始日期"
          />
        </div>

        <div class="filter-group">
          <label>结束日期:</label>
          <input
            v-model="endDate"
            type="date"
            class="filter-input"
            placeholder="结束日期"
          />
        </div>

        <div class="filter-actions">
          <button @click="searchAppointments" class="filter-btn">搜索</button>
          <button @click="clearFilters" class="filter-btn">清除</button>
        </div>
      </div>
    </div>

    <!-- Statistics Display -->
    <div v-if="searchStats.count > 0 || searchStats.totalInDateRange !== null" class="statistics-section">
      <div class="stats-card">
        <h3>搜索统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">匹配结果:</span>
            <span class="stat-value">{{ searchStats.count }}</span>
          </div>
          <div v-if="searchStats.totalInDateRange !== null && (startDate || endDate)" class="stat-item">
            <span class="stat-label">日期范围内总数:</span>
            <span class="stat-value">{{ searchStats.totalInDateRange }}</span>
            <div class="stat-note">
              <span v-if="startDate && endDate">{{ startDate }} 至 {{ endDate }}</span>
              <span v-else-if="startDate">{{ startDate }} 之后</span>
              <span v-else-if="endDate">{{ endDate }} 之前</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="appointments-list">
      <div v-if="appointments.length === 0" class="empty-state">
        暂无预约
      </div>
      <div
        v-for="appointment in appointments"
        :key="appointment.appointment_id || appointment.id"
        class="appointment-card"
      >
        <div class="appointment-header">
          <h3>{{ appointment.provider_name || '未知提供者' }}</h3>
          <span :class="['status-badge', appointment.status]">
            {{ appointment.status === 'cancelled' ? '已取消' : '已预约' }}
          </span>
        </div>
        <div class="appointment-details">
          <p><strong>日期:</strong> {{ formatDate(appointment.appointment_date) }}</p>
          <p><strong>时间:</strong> {{ appointment.appointment_time }}</p>
          <p><strong>类型:</strong> {{ appointment.consultation_type }}</p>
          <p v-if="appointment.memo"><strong>备注:</strong> {{ appointment.memo }}</p>
          <p v-if="appointment.cancellation_reason">
            <strong>取消原因:</strong> {{ appointment.cancellation_reason }}
          </p>
        </div>
        <div class="appointment-actions">
          <button
            v-if="appointment.status === 'scheduled' && canCancel(appointment)"
            @click="cancelAppointment(appointment.appointment_id || appointment.id)"
            class="cancel-btn"
          >
            取消预约
          </button>
          <span v-else-if="appointment.status === 'scheduled' && !canCancel(appointment)" class="cancel-hint">
            距离预约时间不足24小时，无法取消
          </span>
        </div>
      </div>
    </div>

    <!-- Add Appointment Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <h2>新建预约</h2>
        <form @submit.prevent="createAppointment">
          <div class="form-group">
            <label>医疗提供者 *</label>
            <select v-model="newAppointment.provider_id" required>
              <option value="">选择提供者</option>
              <option
                v-for="provider in availableProviders"
                :key="provider.provider_id"
                :value="provider.provider_id"
              >
                {{ provider.name }} - {{ provider.specialty }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>日期 *</label>
            <input
              v-model="newAppointment.appointment_date"
              type="date"
              required
            />
          </div>
          <div class="form-group">
            <label>时间 *</label>
            <input
              v-model="newAppointment.appointment_time"
              type="time"
              required
            />
          </div>
          <div class="form-group">
            <label>咨询类型 *</label>
            <select v-model="newAppointment.consultation_type" required>
              <option value="In-Person">面对面</option>
              <option value="Virtual">虚拟</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea
              v-model="newAppointment.memo"
              rows="3"
              placeholder="症状或问题..."
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">创建</button>
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
import { appointmentService } from '../services/appointments';
import { providerService } from '../services/providers';

const appointments = ref([]);
const availableProviders = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const showAddModal = ref(false);
const selectedProvider = ref('all');
const selectedConsultationType = ref('all');
const startDate = ref('');
const endDate = ref('');
const searchStats = ref({
  count: 0,
  totalInDateRange: null
});

const newAppointment = ref({
  provider_id: '',
  appointment_date: '',
  appointment_time: '',
  consultation_type: 'In-Person',
  memo: '',
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const canCancel = (appointment) => {
  if (appointment.status === 'cancelled' || appointment.status === 'completed') return false;
  if (!appointment.appointment_date || !appointment.appointment_time) return false;
  
  try {
    let dateStr;
    let hourStr;
    let timeStr = appointment.appointment_time; // Format: "HH:mm:ss" or "mm:ss"
    
    // Extract date and hour from appointment_date
    if (appointment.appointment_date.includes('T')) {
      // If it's a datetime string like "2025-12-09T16:00:00.000Z"
      const parts = appointment.appointment_date.split('T');
      dateStr = parts[0]; // "2025-12-09"
      
      // Extract hour from time part (before the first colon or dot)
      const timePart = parts[1]; // "16:00:00.000Z" or "16:00:00"
      hourStr = timePart.split(':')[0]; // "16"
    } else {
      // If it's just a date string, we can't get the hour
      console.error('appointment_date does not contain time information');
      return false;
    }
    
    // Extract minutes and seconds from appointment_time
    // appointment_time format: "00:34:00" or "34:00"
    const timeParts = timeStr.split(':');
    let minuteStr, secondStr;
    
    if (timeParts.length >= 2) {
      // If format is "HH:mm:ss" or "mm:ss"
      if (timeParts.length === 3) {
        // Format: "00:34:00" - first is hour (ignore), second is minute, third is second
        minuteStr = timeParts[1]; // "34"
        secondStr = timeParts[2]; // "00"
      } else if (timeParts.length === 2) {
        // Format: "34:00" - first is minute, second is second
        minuteStr = timeParts[0]; // "34"
        secondStr = timeParts[1]; // "00"
      }
    } else {
      console.error('Invalid appointment_time format:', timeStr);
      return false;
    }
    
    // Combine: date from appointment_date, hour from appointment_date, minutes/seconds from appointment_time
    const combinedTimeStr = `${hourStr}:${minuteStr}:${secondStr}`;
    const appointmentDateTime = new Date(`${dateStr}T${combinedTimeStr}`);
    
    // Check if date is valid
    if (isNaN(appointmentDateTime.getTime())) {
      console.error('Invalid appointment date:', dateStr, combinedTimeStr);
      return false;
    }
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
    
    // Debug log (can be removed later)
    console.log('Appointment date (from appointment_date):', dateStr);
    console.log('Appointment hour (from appointment_date):', hourStr);
    console.log('Appointment minutes/seconds (from appointment_time):', minuteStr + ':' + secondStr);
    console.log('Combined appointment datetime:', appointmentDateTime);
    console.log('Current datetime:', now);
    console.log('Hours until appointment:', hoursUntilAppointment.toFixed(2));
    console.log('Can cancel (>= 24 hours):', hoursUntilAppointment >= 24);
    
    return hoursUntilAppointment >= 24;
  } catch (error) {
    console.error('Error calculating cancel eligibility:', error, appointment);
    return false;
  }
};

const loadAppointments = async () => {
  try {
    loading.value = true;
    appointments.value = await appointmentService.getAll();
    searchStats.value = {
      count: appointments.value.length,
      totalInDateRange: null
    };
  } catch (err) {
    error.value = err.response?.data?.error || '加载预约失败';
  } finally {
    loading.value = false;
  }
};

const loadProviders = async () => {
  try {
    availableProviders.value = await providerService.getMine();
  } catch (err) {
    console.error('Failed to load providers:', err);
  }
};

const searchAppointments = async () => {
  try {
    loading.value = true;

    // Build filters object
    const filters = {};

    if (selectedProvider.value && selectedProvider.value !== 'all') {
      filters.provider_id = selectedProvider.value;
    }

    if (selectedConsultationType.value && selectedConsultationType.value !== 'all') {
      filters.consultation_type = selectedConsultationType.value;
    }

    if (startDate.value) {
      filters.start_date = startDate.value;
    }

    if (endDate.value) {
      filters.end_date = endDate.value;
    }

    // Validate date range if both dates are provided
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      if (start > end) {
        error.value = '开始日期不能晚于结束日期';
        loading.value = false;
        return;
      }
    }

    const result = await appointmentService.search(filters);
    appointments.value = result.appointments;
    searchStats.value = {
      count: result.count,
      totalInDateRange: result.totalInDateRange
    };
    error.value = '';
  } catch (err) {
    error.value = err.response?.data?.error || '搜索失败';
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  selectedProvider.value = 'all';
  selectedConsultationType.value = 'all';
  startDate.value = '';
  endDate.value = '';
  searchStats.value = {
    count: 0,
    totalInDateRange: null
  };
  loadAppointments();
};

const createAppointment = async () => {
  try {
    error.value = '';
    success.value = '';
    await appointmentService.create(newAppointment.value);
    success.value = '预约创建成功';
    showAddModal.value = false;
    newAppointment.value = {
      provider_id: '',
      appointment_date: '',
      appointment_time: '',
      consultation_type: 'In-Person',
      memo: '',
    };
    await loadAppointments();
  } catch (err) {
    error.value = err.response?.data?.error || '创建预约失败';
  }
};

const cancelAppointment = async (id) => {
  if (!id) {
    error.value = '预约ID无效';
    return;
  }
  
  const reason = prompt('请输入取消原因:');
  if (!reason || reason.trim() === '') {
    return;
  }

  try {
    error.value = '';
    success.value = '';
    await appointmentService.cancel(id, reason.trim());
    success.value = '预约已取消';
    await loadAppointments();
  } catch (err) {
    error.value = err.response?.data?.error || '取消预约失败';
  }
};

onMounted(async () => {
  await Promise.all([loadAppointments(), loadProviders()]);
});
</script>

<style scoped>
.appointments {
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

.search-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.filter-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.filter-select {
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
  box-sizing: border-box;
  transition: all 0.2s ease;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-select:hover {
  border-color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.filter-select:active {
  border-color: #2c3e50;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
  grid-column: 1 / -1;
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

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.appointment-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.appointment-header h3 {
  margin: 0;
  color: #333;
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

.appointment-details {
  margin-bottom: 1rem;
}

.appointment-details p {
  margin: 0.5rem 0;
  color: #666;
}

.appointment-actions {
  display: flex;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.cancel-btn:hover {
  opacity: 0.9;
}

.cancel-hint {
  color: #856404;
  font-size: 0.85rem;
  padding: 0.5rem;
  background-color: #fff3cd;
  border-radius: 6px;
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

/* Statistics Styles */
.statistics-section {
  margin: 1.5rem 0;
}

.stats-card {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.stats-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-weight: 500;
  color: #555;
  font-size: 0.95rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-note {
  font-size: 0.85rem;
  color: #777;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}
</style>

