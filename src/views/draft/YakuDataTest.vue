<script setup lang="ts">
import { ref, computed } from 'vue'
import { yakuData } from '../../data/yaku'
import MahjongTile from '../../components/MahjongTile.vue'

const categories = [
  { key: '无限制', label: '一番 - 无限制' },
  { key: '门前清', label: '一番 - 门前清' }
]

const activeCategory = ref('无限制')

const filteredYaku = computed(() => {
  return yakuData.filter(y => y.category === activeCategory.value && y.han === 1)
})
</script>

<template>
  <div class="test-page">
    <h2>役种数据测试</h2>
    <el-radio-group v-model="activeCategory" class="category-tabs">
      <el-radio-button v-for="cat in categories" :key="cat.key" :value="cat.key">
        {{ cat.label }}
      </el-radio-button>
    </el-radio-group>
    
    <div class="yaku-list">
      <div v-for="yaku in filteredYaku" :key="yaku.id" class="yaku-card">
        <div class="yaku-top">
          <span class="yaku-name">{{ yaku.name }}</span>
          <el-tag type="warning" size="small">{{ yaku.han }}番</el-tag>
          <span v-if="yaku.category === '门前清'" class="yaku-condition">门前清限定</span>
          <span v-if="yaku.isEffectOnly" class="yaku-condition effect-only">不是役</span>
        </div>
        <div class="yaku-middle">{{ yaku.desc }}</div>
        <div class="yaku-bottom">
          <MahjongTile 
            v-for="(tile, index) in yaku.tiles" 
            :key="index" 
            :tile-id="tile" 
            :width="40"
          />
        </div>
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

.category-tabs {
  margin-bottom: 24px;
}

.yaku-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.yaku-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
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
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.yaku-difficulty {
  margin-left: auto;
  font-size: 14px;
  color: #909399;
}

.yaku-condition {
  font-size: 14px;
  color: #909399;
}

.yaku-middle {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.yaku-bottom {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
