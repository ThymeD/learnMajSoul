<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToTileTest = () => {
  router.push('/draft/tile-test')
}
</script>

<template>
  <div class="page">
    <h2>草稿区</h2>
    <el-button type="primary" @click="goToTileTest">测试 MahjongTile 组件</el-button>
  </div>
</template>

<style scoped>
.page h2 {
  margin-bottom: 24px;
  color: #2c3e50;
}
</style>
