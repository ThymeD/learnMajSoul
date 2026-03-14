<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const menuItems = [
  { path: '/home', label: '首页', icon: '🏠' },
  { path: '/hand', label: '手牌分析', icon: '🀄' },
  { path: '/strategy', label: '策略指南', icon: '📖' }
]
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <h1>雀魂攻略</h1>
      </div>
      <nav class="menu">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          active-class="active"
        >
          <span class="icon">{{ item.icon }}</span>
          <span class="label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #2c3e50;
  color: #fff;
  flex-shrink: 0;
}

.logo {
  padding: 24px 16px;
  border-bottom: 1px solid #34495e;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.menu {
  padding: 16px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #34495e;
  color: #fff;
}

.menu-item.active {
  background: #3498db;
  color: #fff;
}

.icon {
  margin-right: 12px;
  font-size: 18px;
}

.label {
  font-size: 15px;
}

.main-content {
  flex: 1;
  padding: 32px;
  background: #f5f6fa;
  overflow-y: auto;
}
</style>
