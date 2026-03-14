<script setup lang="ts">
import { ref } from 'vue'

interface YakuItem {
  id: string
  name: string
  han: number
  image: string
  desc?: string
}

const yakuItems = ref<YakuItem[]>([
  {
    id: '1',
    name: '立直',
    han: 1,
    image: '一番-1.jpg',
    desc: '听牌后听牌宣言并打出振听'
  }
])

const getImageUrl = (filename: string) => {
  return `/src/assets/hand-patterns/${filename}`
}
</script>

<template>
  <div class="yaku-page">
    <h2>役种一览</h2>
    <div class="yaku-list">
      <el-card v-for="item in yakuItems" :key="item.id" class="yaku-item">
        <template #header>
          <div class="yaku-header">
            <span class="yaku-name">{{ item.name }}</span>
            <el-tag type="warning">{{ item.han }}番</el-tag>
          </div>
        </template>
        <div class="yaku-content">
          <el-image 
            :src="getImageUrl(item.image)" 
            :alt="item.name"
            class="yaku-image"
            fit="contain"
          />
          <div v-if="item.desc" class="yaku-desc">{{ item.desc }}</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.yaku-page h2 {
  margin-bottom: 24px;
  color: #303133;
}

.yaku-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.yaku-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.yaku-name {
  font-size: 16px;
  font-weight: 500;
}

.yaku-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yaku-image {
  width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.yaku-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
