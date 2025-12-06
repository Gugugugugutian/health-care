<template>
  <div class="appointments">
    <div class="page-header">
      <h1>预约管理</h1>
      <button @click="showAddModal = true" class="add-btn">新建预约</button>
    </div>

    <div class="filters-section">
      <div class="date-filters">
        <input
          v-model="startDate"
          type="date"
          class="date-input"
          placeholder="开始日期"
        />
        <input
          v-model="endDate"
          type="date"
          class="date-input"
          placeholder="结束日期"
        />
        <button @click="searchByDate" class="filter-btn">搜索</button>
        <button @click="clearFilters" class="filter-btn">清除</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="appointments-list">
      <div v-if="appointments.length === 0" class="empty-state">
        暂无预约
      </div>
      <div
        v-for="appointment in appointments"
        :key="appointment.id"
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
            v-if="appointment.status !== 'cancelled' && canCancel(appointment)"
            @click="cancelAppointment(appointment.id)"
            class="cancel-btn"
          >
            取消预约
          </button>
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
const startDate = ref('');
const endDate = ref('');

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
  if (appointment.status === 'cancelled') return false;
  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
  return hoursUntilAppointment >= 24;
};

const loadAppointments = async () => {
  try {
    loading.value = true;
    appointments.value = await appointmentService.getAll();
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

const searchByDate = async () => {
  if (!startDate.value || !endDate.value) {
    error.value = '请选择开始和结束日期';
    return;
  }

  try {
    loading.value = true;
    appointments.value = await appointmentService.searchByDate(startDate.value, endDate.value);
  } catch (err) {
    error.value = err.response?.data?.error || '搜索失败';
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  startDate.value = '';
  endDate.value = '';
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
  const reason = prompt('请输入取消原因:');
  if (!reason) return;

  try {
    error.value = '';
    success.value = '';
    await appointmentService.cancel(id, reason);
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

.date-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.date-input:focus {
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

