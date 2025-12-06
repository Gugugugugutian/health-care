<template>
  <div class="main-layout">
    <nav class="navbar">
      <div class="navbar-brand">
        <h2>HealthTrack</h2>
      </div>
      <div class="navbar-menu">
        <router-link to="/" class="nav-link">仪表板</router-link>
        <router-link to="/profile" class="nav-link">个人资料</router-link>
        <router-link to="/providers" class="nav-link">医疗提供者</router-link>
        <router-link to="/appointments" class="nav-link">预约</router-link>
        <router-link to="/challenges" class="nav-link">健康挑战</router-link>
        <router-link to="/family" class="nav-link">家庭组</router-link>
        <router-link to="/health-metrics" class="nav-link">健康指标</router-link>
        <router-link to="/invitations" class="nav-link">邀请</router-link>
        <button @click="handleLogout" class="logout-btn">退出</button>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';

const router = useRouter();

const handleLogout = () => {
  authService.logout();
  router.push('/login');
};
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-brand h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.navbar-menu {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
  font-weight: 500;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: #f5f7fa;
}
</style>

