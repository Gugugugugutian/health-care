<template>
  <div class="invitations">
    <div class="page-header">
      <h1>邀请管理</h1>
      <button @click="showAddModal = true" class="add-btn">发送邀请</button>
    </div>

    <div class="tabs">
      <button
        :class="['tab', activeTab === 'sent' ? 'active' : '']"
        @click="activeTab = 'sent'"
      >
        已发送
      </button>
      <button
        :class="['tab', activeTab === 'received' ? 'active' : '']"
        @click="activeTab = 'received'"
      >
        收到的邀请
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="invitations-content">
      <div v-if="currentInvitations.length === 0" class="empty-state">
        暂无邀请
      </div>
      <div v-else class="invitations-list">
        <div
          v-for="invitation in currentInvitations"
          :key="invitation.invitation_id || invitation.id"
          class="invitation-card"
        >
          <div class="invitation-header">
            <h3>{{ getInvitationType(invitation) }}</h3>
            <span :class="['status-badge', getStatusClass(invitation)]">
              {{ getStatusText(invitation) }}
            </span>
          </div>
          <div class="invitation-details">
            <p><strong>收件人:</strong> {{ invitation.email || invitation.phone || '未知' }}</p>
            <p><strong>发送时间:</strong> {{ formatDate(invitation.initiated_at || invitation.created_at) }}</p>
            <p v-if="invitation.status === 'cancelled' && invitation.completed_at">
              <strong>取消时间:</strong> {{ formatDate(invitation.completed_at) }}
            </p>
            <p v-else-if="invitation.status === 'accepted' && invitation.completed_at">
              <strong>接受时间:</strong> {{ formatDate(invitation.completed_at) }}
            </p>
            <p v-else-if="invitation.status === 'expired' && invitation.completed_at">
              <strong>过期时间:</strong> {{ formatDate(invitation.completed_at) }}
            </p>
            <p v-if="invitation.status === 'pending' && invitation.expires_at">
              <strong>过期时间:</strong> {{ formatDate(invitation.expires_at) }}
            </p>
          </div>
          <div class="invitation-actions">
            <button
              v-if="activeTab === 'received' && invitation.status === 'pending'"
              @click="acceptInvitation(invitation.invitation_uid || invitation.uid)"
              class="accept-btn"
            >
              接受
            </button>
            <button
              v-if="activeTab === 'sent' && invitation.status === 'pending'"
              @click="cancelInvitation(invitation.invitation_id || invitation.id)"
              class="cancel-btn"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Send Invitation Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <h2>发送邀请</h2>
        <form @submit.prevent="sendInvitation">
          <div class="form-group">
            <label>邀请类型 *</label>
            <select v-model="newInvitation.invitation_type" required @change="onInvitationTypeChange">
              <option value="">选择类型</option>
              <option value="platform">平台注册邀请（未注册用户）</option>
              <option value="challenge">健康挑战</option>
              <option value="family">家庭组</option>
            </select>
          </div>
          <div class="form-group" v-if="newInvitation.invitation_type === 'platform'">
            <label>邮箱或手机号 *</label>
            <input
              v-model="newInvitation.contact"
              type="text"
              required
              placeholder="例如：user@example.com 或 +1234567890"
            />
            <p class="form-hint">要邀请的未注册用户的邮箱或手机号</p>
          </div>
          <div class="form-group" v-if="newInvitation.invitation_type !== 'platform'">
            <label>用户健康ID (Health ID) *</label>
            <input
              v-model="newInvitation.recipient_health_id"
              type="text"
              :required="newInvitation.invitation_type !== 'platform'"
              placeholder="例如：HT001、HT002"
            />
            <p class="form-hint">要邀请的用户的健康ID（包含字母和数字）</p>
          </div>
          <div class="form-group" v-if="newInvitation.invitation_type === 'challenge'">
            <label>挑战名称 *</label>
            <input v-model="newInvitation.challenge_name" type="text" :required="newInvitation.invitation_type === 'challenge'" placeholder="例如：December Fitness Challenge" />
            <p class="form-hint">要邀请的挑战的名称</p>
          </div>
          <div class="form-group" v-if="newInvitation.invitation_type === 'family'">
            <label>家庭组标识符</label>
            <input v-model="newInvitation.family_group_identifier" type="text" placeholder="例如：家庭组名称或标识符" />
            <p class="form-hint">家庭组的名称或其他标识符</p>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">发送</button>
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
import { invitationService } from '../services/invitations';

const sentInvitations = ref([]);
const receivedInvitations = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const showAddModal = ref(false);
const activeTab = ref('sent');

const newInvitation = ref({
  invitation_type: '',
  recipient_health_id: '',
  challenge_name: '',
  family_group_identifier: '',
  contact: '',
});

const currentInvitations = computed(() => {
  return activeTab.value === 'sent' ? sentInvitations.value : receivedInvitations.value;
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInvitationType = (invitation) => {
  const types = {
    platform: '平台注册邀请',
    challenge: '健康挑战邀请',
    family: '家庭组邀请',
  };
  return types[invitation.invitation_type] || '邀请';
};

const getStatusClass = (invitation) => {
  if (invitation.status === 'accepted') return 'accepted';
  if (invitation.status === 'expired' || invitation.status === 'cancelled') return 'expired';
  return 'pending';
};

const getStatusText = (invitation) => {
  const statuses = {
    pending: '待处理',
    accepted: '已接受',
    expired: '已过期',
    cancelled: '已取消',
  };
  return statuses[invitation.status] || invitation.status;
};

const loadInvitations = async () => {
  try {
    loading.value = true;
    const [sent, received] = await Promise.all([
      invitationService.getSent().catch(() => []),
      invitationService.getMine().catch(() => []),
    ]);
    sentInvitations.value = sent;
    receivedInvitations.value = received;
  } catch (err) {
    error.value = err.response?.data?.error || '加载邀请失败';
  } finally {
    loading.value = false;
  }
};

const onInvitationTypeChange = () => {
  // Reset form when type changes
  if (newInvitation.value.invitation_type === 'platform') {
    newInvitation.value.recipient_health_id = '';
    newInvitation.value.challenge_name = '';
    newInvitation.value.family_group_identifier = '';
  }
};

const sendInvitation = async () => {
  const invitationData = {
    invitation_type: newInvitation.value.invitation_type,
  };

  if (newInvitation.value.invitation_type === 'platform') {
    // Platform invitation - use email or phone
    const contact = newInvitation.value.contact.trim();
    if (contact.includes('@')) {
      invitationData.email = contact;
    } else {
      invitationData.phone = contact;
    }
  } else {
    // Other invitation types
    invitationData.recipient_health_id = newInvitation.value.recipient_health_id;
    
    if (newInvitation.value.challenge_name) {
      invitationData.challenge_name = newInvitation.value.challenge_name;
    }

    if (newInvitation.value.family_group_identifier) {
      invitationData.family_group_identifier = newInvitation.value.family_group_identifier;
    }
  }

  try {
    error.value = '';
    success.value = '';
    await invitationService.create(invitationData);
    success.value = '邀请发送成功';
    showAddModal.value = false;
    newInvitation.value = {
      invitation_type: '',
      recipient_health_id: '',
      challenge_name: '',
      family_group_identifier: '',
      contact: '',
    };
    await loadInvitations();
  } catch (err) {
    error.value = err.response?.data?.error || '发送邀请失败';
  }
};

const acceptInvitation = async (uid) => {
  try {
    error.value = '';
    success.value = '';
    await invitationService.accept(uid);
    success.value = '邀请已接受';
    await loadInvitations();
  } catch (err) {
    error.value = err.response?.data?.error || '接受邀请失败';
  }
};

const cancelInvitation = async (id) => {
  if (!confirm('确定要取消此邀请吗？')) return;

  try {
    error.value = '';
    success.value = '';
    await invitationService.cancel(id);
    success.value = '邀请已取消';
    await loadInvitations();
  } catch (err) {
    error.value = err.response?.data?.error || '取消邀请失败';
  }
};

onMounted(() => {
  loadInvitations();
});
</script>

<style scoped>
.invitations {
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

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab:hover {
  color: #2c3e50;
}

.tab.active {
  color: #2c3e50;
  border-bottom-color: #2c3e50;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invitation-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invitation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.invitation-header h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.accepted {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.expired {
  background-color: #f8d7da;
  color: #721c24;
}

.invitation-details {
  margin-bottom: 1rem;
}

.invitation-details p {
  margin: 0.5rem 0;
  color: #666;
}

.invitation-actions {
  display: flex;
  gap: 1rem;
}

.accept-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.accept-btn {
  background-color: #28a745;
  color: white;
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
}

.accept-btn:hover,
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

.form-group input {
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

.form-group input:focus {
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

