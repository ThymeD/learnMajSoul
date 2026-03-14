<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToTileTest = () => {
  router.push('/draft/tile-test')
}

const goToScrollTest = () => {
  router.push('/draft/scroll-test')
}
</script>

<template>
  <div class="page">
    <h2>草稿区</h2>
    <el-space direction="vertical" :size="16">
      <el-button type="primary" @click="goToTileTest">测试 MahjongTile 组件</el-button>
      <el-button type="success" @click="goToScrollTest">测试滚动固定</el-button>
    </el-space>
  </div>
</template>

<style scoped>
.page h2 {
  margin-bottom: 24px;
  color: #2c3e50;
}
</style>
