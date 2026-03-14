<script setup lang="ts">
</script>

<template>
  <div class="test-page">
    <div class="header">固定头部</div>
    <div class="content">
      <div v-for="i in 30" :key="i" class="item">内容 {{ i }}</div>
    </div>
  </div>
</template>

<style scoped>
.test-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
}

.header {
  position: sticky;
  top: 0;
  background: #409eff;
  color: #fff;
  padding: 20px;
  font-size: 18px;
  font-weight: bold;
  z-index: 100;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f6fa;
}

.item {
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
</style>
