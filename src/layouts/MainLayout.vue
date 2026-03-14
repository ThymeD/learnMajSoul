<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/home', label: '首页', icon: 'House' },
  { path: '/hand', label: '手牌分析', icon: 'Grid' },
  { path: '/strategy', label: '策略指南', icon: 'Reading' }
]

const handleMenuSelect = (index: string) => {
  router.push(index)
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px">
      <div class="logo">
        <h1>雀魂攻略</h1>
      </div>
      <el-menu
        :default-active="route.path"
        class="menu"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="main-content">
      <RouterView />
    </el-main>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.el-aside {
  background: #304157;
}

.logo {
  padding: 24px 16px;
  border-bottom: 1px solid #3d4f68;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.menu {
  border-right: none;
  background: #304157;
}

.menu :deep(.el-menu-item) {
  color: #bdc3c7;
}

.menu :deep(.el-menu-item:hover) {
  background: #3d4f68;
  color: #fff;
}

.menu :deep(.el-menu-item.is-active) {
  background: #409eff;
  color: #fff;
}

.main-content {
  padding: 32px;
  background: #f5f6fa;
}
</style>
