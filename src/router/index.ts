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
    component: () => import('../views/HandView/index.vue')
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
  },
  {
    path: '/yaku',
    name: 'yaku',
    component: () => import('../views/YakuView.vue')
  },
  {
    path: '/rule-review',
    name: 'ruleReview',
    component: () => import('../views/RuleReviewView.vue')
  },
  {
    path: '/data-management',
    name: 'dataManagement',
    component: () => import('../pm/views/DataManagementView.vue')
  },
  {
    path: '/delivery',
    name: 'delivery',
    component: () => import('../pm/views/DeliveryView.vue')
  },
  {
    path: '/draft',
    name: 'draft',
    component: () => import('../views/DraftView.vue')
  },
  {
    path: '/draft/tile-test',
    name: 'tileTest',
    component: () => import('../views/draft/TileTestView.vue')
  },
  {
    path: '/draft/scroll-test',
    name: 'scrollTest',
    component: () => import('../views/draft/ScrollTestView.vue')
  },
  {
    path: '/draft/yaku-layout-test',
    name: 'yakuLayoutTest',
    component: () => import('../views/draft/YakuLayoutTest.vue')
  },
  {
    path: '/draft/yaku-data-test',
    name: 'yakuDataTest',
    component: () => import('../views/draft/YakuDataTest.vue')
  },
  {
    path: '/draft/drag-poc',
    name: 'dragPoc',
    component: () => import('../views/draft/DragPoc.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
