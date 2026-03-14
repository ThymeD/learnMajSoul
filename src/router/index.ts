import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/hand',
    name: 'hand',
    component: () => import('../views/HandView.vue')
  },
  {
    path: '/strategy',
    name: 'strategy',
    component: () => import('../views/StrategyView.vue')
  },
  {
    path: '/tiles',
    name: 'tiles',
    component: () => import('../views/TilesView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
