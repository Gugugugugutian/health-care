<template>
  <div class="family">
    <div class="page-header">
      <h1>家庭组管理</h1>
      <button @click="showAddModal = true" class="add-btn">创建家庭组</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="family-content">
      <div v-if="familyGroups.length === 0" class="empty-state">
        暂无家庭组
      </div>
      <div v-else class="family-grid">
        <div
          v-for="group in familyGroups"
          :key="group.id"
          class="family-card"
        >
          <div class="family-header">
            <h3>{{ group.group_name || `家庭组 #${group.id}` }}</h3>
            <button
              @click="deleteFamilyGroup(group.id)"
              class="delete-btn"
            >
              删除
            </button>
          </div>
          <div class="members-section">
            <h4>成员</h4>
            <div v-if="group.members && group.members.length === 0" class="no-members">
              暂无成员
            </div>
            <div v-else class="members-list">
              <div
                v-for="member in group.members"
                :key="member.user_id"
                class="member-item"
              >
                <span>{{ member.name || `用户 ${member.user_id}` }}</span>
                <span class="member-role">{{ member.relationship || '成员' }}</span>
                <button
                  @click="removeMember(group.id, member.user_id)"
                  class="remove-btn"
                >
                  移除
                </button>
              </div>
            </div>
            <div class="member-actions">
              <button
                @click="showAddMemberModal(group.id)"
                class="add-member-btn"
              >
                添加成员
              </button>
              <button
                @click="showInviteModal(group.id)"
                class="invite-btn"
              >
                邀请
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Family Group Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <h2>创建家庭组</h2>
        <form @submit.prevent="createFamilyGroup">
          <div class="form-group">
            <label>组名 *</label>
            <input v-model="newFamilyGroup.group_name" type="text" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">创建</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModalVisible" class="modal-overlay" @click="showAddMemberModalVisible = false">
      <div class="modal-content" @click.stop>
        <h2>添加成员</h2>
        <form @submit.prevent="addMember">
          <div class="form-group">
            <label>用户ID *</label>
            <input v-model="newMember.user_id" type="number" required />
          </div>
          <div class="form-group">
            <label>关系</label>
            <input v-model="newMember.relationship" type="text" placeholder="例如：父亲、母亲、孩子" />
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddMemberModalVisible = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">添加</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModalVisible" class="modal-overlay" @click="showInviteModalVisible = false">
      <div class="modal-content" @click.stop>
        <h2>邀请加入家庭组</h2>
        <form @submit.prevent="sendInvites">
          <div class="form-group">
            <label>邀请列表（每行一个邮箱或电话）*</label>
            <textarea
              v-model="inviteList"
              rows="5"
              required
              placeholder="email@example.com&#10;+1234567890"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showInviteModalVisible = false" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">发送邀请</button>
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
import { familyService } from '../services/family';

const familyGroups = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const showAddModal = ref(false);
const showAddMemberModalVisible = ref(false);
const showInviteModalVisible = ref(false);
const currentFamilyId = ref(null);
const inviteList = ref('');

const newFamilyGroup = ref({
  group_name: '',
});

const newMember = ref({
  user_id: '',
  relationship: '',
});

const loadFamilyGroups = async () => {
  try {
    loading.value = true;
    familyGroups.value = await familyService.getAll();
  } catch (err) {
    error.value = err.response?.data?.error || '加载家庭组失败';
  } finally {
    loading.value = false;
  }
};

const createFamilyGroup = async () => {
  try {
    error.value = '';
    success.value = '';
    await familyService.create(newFamilyGroup.value);
    success.value = '家庭组创建成功';
    showAddModal.value = false;
    newFamilyGroup.value = { group_name: '' };
    await loadFamilyGroups();
  } catch (err) {
    error.value = err.response?.data?.error || '创建家庭组失败';
  }
};

const showAddMemberModal = (familyId) => {
  currentFamilyId.value = familyId;
  newMember.value = { user_id: '', relationship: '' };
  showAddMemberModalVisible.value = true;
};

const addMember = async () => {
  try {
    error.value = '';
    success.value = '';
    await familyService.addMember(currentFamilyId.value, newMember.value);
    success.value = '成员添加成功';
    showAddMemberModalVisible.value = false;
    await loadFamilyGroups();
  } catch (err) {
    error.value = err.response?.data?.error || '添加成员失败';
  }
};

const removeMember = async (familyId, userId) => {
  if (!confirm('确定要移除此成员吗？')) return;

  try {
    error.value = '';
    success.value = '';
    await familyService.removeMember(familyId, userId);
    success.value = '成员已移除';
    await loadFamilyGroups();
  } catch (err) {
    error.value = err.response?.data?.error || '移除成员失败';
  }
};

const showInviteModal = (familyId) => {
  currentFamilyId.value = familyId;
  inviteList.value = '';
  showInviteModalVisible.value = true;
};

const sendInvites = async () => {
  const invites = inviteList.value.split('\n').filter(line => line.trim());
  
  try {
    error.value = '';
    success.value = '';
    await familyService.invite(currentFamilyId.value, invites);
    success.value = '邀请发送成功';
    showInviteModalVisible.value = false;
    inviteList.value = '';
  } catch (err) {
    error.value = err.response?.data?.error || '发送邀请失败';
  }
};

const deleteFamilyGroup = async (id) => {
  if (!confirm('确定要删除此家庭组吗？')) return;

  try {
    error.value = '';
    success.value = '';
    await familyService.delete(id);
    success.value = '家庭组已删除';
    await loadFamilyGroups();
  } catch (err) {
    error.value = err.response?.data?.error || '删除失败';
  }
};

onMounted(() => {
  loadFamilyGroups();
});
</script>

<style scoped>
.family {
  max-width: 1200px;
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

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.family-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.family-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.family-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.family-header h3 {
  margin: 0;
  color: #333;
}

.delete-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.delete-btn:hover {
  opacity: 0.9;
}

.members-section h4 {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 1rem;
}

.no-members {
  color: #999;
  padding: 1rem;
  text-align: center;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.member-role {
  color: #666;
  font-size: 0.9rem;
}

.remove-btn {
  padding: 0.25rem 0.75rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.remove-btn:hover {
  opacity: 0.9;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.add-member-btn,
.invite-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.add-member-btn {
  background-color: #667eea;
  color: white;
}

.invite-btn {
  background-color: #764ba2;
  color: white;
}

.add-member-btn:hover,
.invite-btn:hover {
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
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus,
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

