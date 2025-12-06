import { createRouter, createWebHistory } from 'vue-router';
import { authService } from '../services/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
      },
      {
        path: 'providers',
        name: 'Providers',
        component: () => import('../views/Providers.vue'),
      },
      {
        path: 'appointments',
        name: 'Appointments',
        component: () => import('../views/Appointments.vue'),
      },
      {
        path: 'challenges',
        name: 'Challenges',
        component: () => import('../views/Challenges.vue'),
      },
      {
        path: 'family',
        name: 'Family',
        component: () => import('../views/Family.vue'),
      },
      {
        path: 'health-metrics',
        name: 'HealthMetrics',
        component: () => import('../views/HealthMetrics.vue'),
      },
      {
        path: 'invitations',
        name: 'Invitations',
        component: () => import('../views/Invitations.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated();

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;

