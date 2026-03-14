<script setup lang="ts">
import { ref, computed } from 'vue'
import { yakuData } from '../data/yaku'
import MahjongTile from '../components/MahjongTile.vue'

const hanGroups = [
  { han: 1, label: '一番' },
  { han: 2, label: '二番' },
  { han: 3, label: '三番' },
  { han: 6, label: '六番' },
  { han: -1, label: '役满' }
]

const categoryGroups = [
  { key: '无限制', label: '无限制' },
  { key: '副露后', label: '副露后' },
  { key: '门前清', label: '门前清' }
]

const activeHan = ref(1)
const activeCategory = ref<string>('无限制')

const filteredYaku = computed(() => {
  return yakuData.filter(y => y.han === activeHan.value && y.category === activeCategory.value)
})

const getCategoryOptions = (han: number) => {
  const categories = new Set(yakuData.filter(y => y.han === han).map(y => y.category as string))
  return categoryGroups.filter(c => categories.has(c.key))
}

const currentCategoryOptions = computed(() => {
  return getCategoryOptions(activeHan.value)
})

const selectHan = (han: number) => {
  activeHan.value = han
  const options = getCategoryOptions(han)
  if (options.length > 0 && !options.some(o => o.key === activeCategory.value)) {
    activeCategory.value = options[0].key as '无限制' | '门前清' | '副露后'
  }
}

const activeId = ref('')

const selectYaku = (id: string) => {
  activeId.value = id
}
</script>

<template>
  <div class="yaku-page">
    <el-row :gutter="24">
      <el-col :span="21" class="main-col">
        <div class="sticky-header">
          <h2>役种一览</h2>
          <div class="han-tabs">
            <el-radio-group :model-value="activeHan" @update:model-value="selectHan">
              <el-radio-button v-for="g in hanGroups" :key="g.han" :value="g.han">
                {{ g.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="currentCategoryOptions.length > 1" class="category-tabs">
            <el-radio-group v-model="activeCategory">
              <el-radio-button v-for="c in currentCategoryOptions" :key="c.key" :value="c.key">
                {{ c.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="yaku-list">
          <div 
            v-for="yaku in filteredYaku" 
            :key="yaku.id" 
            :id="`yaku-${yaku.id}`"
            class="yaku-card"
            :class="{ active: activeId === yaku.id }"
            @click="selectYaku(yaku.id)"
          >
            <div class="yaku-top">
              <span class="yaku-name">{{ yaku.name }}</span>
              <el-tag type="warning" size="small">{{ yaku.han > 0 ? yaku.han + '番' : '役满' }}</el-tag>
              <span class="yaku-difficulty">{{ yaku.difficulty }}</span>
              <span v-if="yaku.category === '门前清'" class="yaku-condition">门前清限定</span>
            </div>
            <div class="yaku-middle">{{ yaku.desc }}</div>
            <div class="yaku-bottom">
              <MahjongTile 
                v-for="(tile, index) in yaku.tiles" 
                :key="index" 
                :tile-id="tile" 
                :width="80"
              />
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="3" class="nav-area">
        <el-affix :offset="80">
          <el-card class="nav-card" shadow="never">
            <template #header>
              <span class="nav-title">导航</span>
            </template>
            <div class="nav-list">
              <div 
                v-for="yaku in filteredYaku" 
                :key="yaku.id"
                class="nav-item"
                :class="{ active: activeId === yaku.id }"
                @click="selectYaku(yaku.id)"
              >
                {{ yaku.name }}
              </div>
            </div>
          </el-card>
        </el-affix>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.yaku-page {
  display: flex;
  height: calc(100vh - 64px);
}

.main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-area {
  width: 200px;
  flex-shrink: 0;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 10;
  padding-bottom: 16px;
  flex-shrink: 0;
}

.yaku-page h2 {
  margin: 0 0 16px;
  color: #303133;
}

.han-tabs {
  margin-bottom: 12px;
}

.category-tabs {
  margin-bottom: 12px;
}

.yaku-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.yaku-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.yaku-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.yaku-card.active {
  background: #fef9e6;
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
  gap: 8px;
}

.nav-card {
  width: 180px;
}

.nav-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.nav-title {
  font-size: 14px;
  font-weight: 500;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.nav-item {
  padding: 8px 12px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
</style>
