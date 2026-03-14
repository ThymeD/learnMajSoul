<script setup lang="ts">
import { } from 'vue'

interface TileCategory {
  name: string
  label: string
  tiles: { id: string; name: string }[]
}

const categories: TileCategory[] = [
  {
    name: 'wan',
    label: '万子',
    tiles: Array.from({ length: 9 }, (_, i) => ({ id: `w${i + 1}`, name: `${i + 1}万` }))
  },
  {
    name: 'tong',
    label: '筒子',
    tiles: Array.from({ length: 9 }, (_, i) => ({ id: `b${i + 1}`, name: `${i + 1}筒` }))
  },
  {
    name: 'tiao',
    label: '条子',
    tiles: Array.from({ length: 9 }, (_, i) => ({ id: `s${i + 1}`, name: `${i + 1}条` }))
  },
  {
    name: 'zi',
    label: '字牌',
    tiles: [
      { id: 'f1', name: '东风' },
      { id: 'f2', name: '南风' },
      { id: 'f3', name: '西风' },
      { id: 'f4', name: '北风' }
    ]
  },
  {
    name: 'fa',
    label: '三元牌',
    tiles: [
      { id: 'z1', name: '中' },
      { id: 'z2', name: '发' },
      { id: 'z3', name: '白' }
    ]
  }
]

const getTileImage = (id: string) => {
  return new URL(`../assets/mahjong/${id}.jpg`, import.meta.url).href
}
</script>

<template>
  <div class="tiles-page">
    <h2>麻将素材验证</h2>
    <el-tabs type="border-card" class="tabs">
      <el-tab-pane v-for="cat in categories" :key="cat.name" :label="cat.label">
        <div class="tiles-grid">
          <div v-for="tile in cat.tiles" :key="tile.id" class="tile-item">
            <el-image 
              :src="getTileImage(tile.id)" 
              :alt="tile.name"
              class="tile-image"
              fit="contain"
            />
            <div class="tile-name">{{ tile.name }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.tiles-page h2 {
  margin-bottom: 24px;
  color: #303133;
}

.tabs {
  margin-top: 16px;
}

.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.tile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tile-image {
  width: 60px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.tile-name {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}
</style>
