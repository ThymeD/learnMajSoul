<script setup lang="ts">
import MahjongTile from '../../components/MahjongTile.vue'

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
      { id: 'd1', name: '东风' },
      { id: 'd2', name: '南风' },
      { id: 'd3', name: '西风' },
      { id: 'd4', name: '北风' }
    ]
  },
  {
    name: 'fa',
    label: '三元牌',
    tiles: [
      { id: 'z1', name: '白' },
      { id: 'z2', name: '中' },
      { id: 'z3', name: '发' }
    ]
  }
]
</script>

<template>
  <div class="draft-page">
    <h2>麻将组件测试 - 草稿区</h2>
    <el-alert title="此页面用于验证 MahjongTile 组件" type="info" :closable="false" />
    <el-tabs type="border-card" class="tabs">
      <el-tab-pane v-for="cat in categories" :key="cat.name" :label="cat.label">
        <div class="tiles-grid">
          <div v-for="tile in cat.tiles" :key="tile.id" class="tile-item">
            <MahjongTile :tile-id="tile.id" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.draft-page h2 {
  margin-bottom: 16px;
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
  justify-content: center;
}
</style>
