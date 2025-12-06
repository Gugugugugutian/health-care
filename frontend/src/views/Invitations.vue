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
          :key="invitation.id"
          class="invitation-card"
        >
          <div class="invitation-header">
            <h3>{{ getInvitationType(invitation) }}</h3>
            <span :class="['status-badge', getStatusClass(invitation)]">
              {{ getStatusText(invitation) }}
            </span>
          </div>
          <div class="invitation-details">
            <p><strong>收件人:</strong> {{ invitation.recipient_email || invitation.recipient_phone }}</p>
            <p><strong>发送时间:</strong> {{ formatDate(invitation.created_at) }}</p>
            <p v-if="invitation.completed_at">
              <strong>{{ invitation.status === 'accepted' ? '接受时间' : '过期时间' }}:</strong>
              {{ formatDate(invitation.completed_at) }}
            </p>
            <p v-if="invitation.expires_at">
              <strong>过期时间:</strong> {{ formatDate(invitation.expires_at) }}
            </p>
          </div>
          <div class="invitation-actions">
            <button
              v-if="activeTab === 'received' && invitation.status === 'pending'"
              @click="acceptInvitation(invitation.uid)"
              class="accept-btn"
            >
              接受
            </button>
            <button
              v-if="activeTab === 'sent' && invitation.status === 'pending'"
              @click="cancelInvitation(invitation.id)"
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
            <select v-model="newInvitation.invitation_type" required>
              <option value="">选择类型</option>
              <option value="challenge">健康挑战</option>
              <option value="family">家庭组</option>
              <option value="data_share">数据共享</option>
            </select>
          </div>
          <div class="form-group">
            <label>收件人邮箱或电话 *</label>
            <input
              v-model="newInvitation.recipient"
              type="text"
              required
              placeholder="email@example.com 或 +1234567890"
            />
          </div>
          <div class="form-group" v-if="newInvitation.invitation_type === 'challenge'">
            <label>挑战ID</label>
            <input v-model="newInvitation.challenge_id" type="number" />
          </div>
          <div class="form-group" v-if="newInvitation.invitation_type === 'family'">
            <label>家庭组ID</label>
            <input v-model="newInvitation.family_group_id" type="number" />
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
  recipient: '',
  challenge_id: '',
  family_group_id: '',
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
    challenge: '健康挑战邀请',
    family: '家庭组邀请',
    data_share: '数据共享邀请',
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

const sendInvitation = async () => {
  const invitationData = {
    invitation_type: newInvitation.value.invitation_type,
  };

  if (newInvitation.value.recipient.includes('@')) {
    invitationData.recipient_email = newInvitation.value.recipient;
  } else {
    invitationData.recipient_phone = newInvitation.value.recipient;
  }

  if (newInvitation.value.challenge_id) {
    invitationData.challenge_id = parseInt(newInvitation.value.challenge_id);
  }

  if (newInvitation.value.family_group_id) {
    invitationData.family_group_id = parseInt(newInvitation.value.family_group_id);
  }

  try {
    error.value = '';
    success.value = '';
    await invitationService.create(invitationData);
    success.value = '邀请发送成功';
    showAddModal.value = false;
    newInvitation.value = {
      invitation_type: '',
      recipient: '',
      challenge_id: '',
      family_group_id: '',
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
  color: #667eea;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
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

