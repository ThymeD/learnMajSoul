<script setup lang="ts">
import MahjongTile from '../../components/MahjongTile.vue'

const yakuList = [
  {
    id: 'reach',
    name: '立直',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 's4', 's5', 's6', 'w7'],
    desc: '听牌后宣言并打出振听棒'
  }
]
</script>

<template>
  <div class="test-page">
    <h2>役种布局测试</h2>
    <div 
      v-for="yaku in yakuList" 
      :key="yaku.id" 
      class="yaku-card"
    >
      <div class="yaku-top">
        <span class="yaku-name">{{ yaku.name }}</span>
        <el-tag type="warning" size="small">{{ yaku.han }}番</el-tag>
      </div>
      <div class="yaku-middle">
        {{ yaku.desc }}
      </div>
      <div class="yaku-bottom">
        <MahjongTile 
          v-for="(tile, index) in yaku.tiles" 
          :key="index" 
          :tile-id="tile" 
          :width="60"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-page {
  padding: 24px;
}

.test-page h2 {
  margin-bottom: 24px;
}

.yaku-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.yaku-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  background: #ecf5ff;
  padding: 12px 16px;
  border-radius: 4px;
}

.yaku-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.yaku-middle {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.yaku-bottom {
  display: flex;
  gap: 8px;
}
</style>
