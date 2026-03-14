<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/home', label: '首页', icon: 'House' },
  { path: '/hand', label: '手牌分析', icon: 'Grid' },
  { path: '/tiles', label: '素材验证', icon: 'Picture' },
  { path: '/yaku', label: '役种一览', icon: 'List' },
  { path: '/draft', label: '草稿区', icon: 'Edit' },
  { path: '/strategy', label: '策略指南', icon: 'Reading' }
]

const handleMenuSelect = (index: string) => {
  router.push(index)
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="fixed-aside">
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

.fixed-aside {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.main-content {
  margin-left: 220px;
  padding: 32px;
  background: #fafafa;
  min-height: 100vh;
}

.logo {
  padding: 24px 16px;
  border-bottom: 1px solid #ebeef5;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.menu {
  border-right: none;
}

.menu :deep(.el-menu-item) {
  color: #606266;
}

.menu :deep(.el-menu-item:hover) {
  background: #f5f7fa;
  color: #409eff;
}

.menu :deep(.el-menu-item.is-active) {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
</style>
