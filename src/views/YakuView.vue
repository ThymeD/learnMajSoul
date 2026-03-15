<template>
  <div class="yaku-page">
    <div class="yaku-header">
      <h2>役种一览</h2>
      <div class="header-row">
        <div class="filter-groups">
          <div class="han-tabs">
            <el-radio-group :model-value="activeHan" @update:model-value="selectHan">
              <el-radio-button v-for="g in hanGroups" :key="g.han" :value="g.han">
                {{ g.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="category-tabs">
            <el-radio-group v-model="activeCategory">
              <el-radio-button v-for="c in currentCategoryOptions" :key="c.key" :value="c.key">
                {{ c.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-input 
          v-model="searchText" 
          placeholder="搜索役种名称或描述" 
          class="search-input"
        >
          <template #append>
            <el-button @click="searchText = ''">清除</el-button>
          </template>
        </el-input>
      </div>
    </div>
    <div class="yaku-content">
      <div class="yaku-list">
        <div 
          v-for="yaku in filteredYaku" 
          :key="yaku.id" 
          :id="`yaku-${yaku.id}`"
          class="yaku-card"
          :class="{ active: activeId === yaku.id, pressing: pressingYakuId === yaku.id || pressingYakuId === yaku.id + '-decrement', incrementing: incrementingYakuId === yaku.id, decrementing: decrementingYakuId === yaku.id }"
          @click="selectYaku(yaku.id)"
          @mousedown.prevent="activeId === yaku.id && !pressingYakuId && startLongPress(yaku, false)"
          @mouseup="endLongPress(yaku.id, false)"
          @mouseleave="endLongPress(yaku.id, false)"
        >
          <div v-if="pressingYakuId === yaku.id || pressingYakuId === yaku.id + '-decrement'" class="press-progress" :class="{ decrement: pressingYakuId === yaku.id + '-decrement' }" :style="{ '--press-duration': LONG_PRESS_DELAY + 'ms' }"></div>
          <div class="yaku-top">
            <span class="yaku-name">{{ yaku.name }}</span>
            <span class="han-text">{{ yaku.han === 5 ? '满贯' : yaku.han === 8 ? '役满' : yaku.han > 0 ? yaku.han + '番' : yaku.han === -3 ? '流局' : yaku.han === -2 ? '双倍役满' : '役满' }}</span>
            <span v-if="yaku.category === '门前清'" class="yaku-condition">门前清限定</span>
            <span v-if="yaku.category === '副露后'" class="yaku-condition">副露减1番</span>
            <span v-if="yaku.isDealerOnly" class="yaku-condition">庄家限定</span>
            <span v-if="yaku.isNonDealerOnly" class="yaku-condition">子家限定</span>
            <span v-if="yaku.note" class="yaku-condition">{{ yaku.note }}</span>
            <span v-if="yaku.isEffectOnly" class="yaku-condition effect-only">不是役</span>
            <span 
              v-if="yaku.isHu"
              class="yaku-count"
              @mousedown.prevent.stop="isDecrementZone = true; startLongPress(yaku, true)"
              @mouseup="isDecrementZone = false; endLongPress(yaku.id, true)"
              @mouseleave="isDecrementZone = false; endLongPress(yaku.id, true)"
            >已胡：{{ yaku.mastery || 0 }}</span>
            <span v-if="incrementingYakuId === yaku.id" class="increment-text">+1</span>
            <span v-if="decrementingYakuId === yaku.id" class="decrement-text">-1</span>
          </div>
          <div class="yaku-middle">{{ yaku.desc }}</div>
          <div class="yaku-bottom">
            <MahjongTile 
              v-for="(tile, index) in yaku.tiles" 
              :key="index" 
              :tile-id="tile" 
              :width="80"
              :show-name="false"
              :split="yaku.splitAt?.includes(index)"
            />
          </div>
        </div>
      </div>
      <div class="nav-area">
        <el-card class="nav-card" shadow="never">
          <template #header>
            <div class="nav-header">
              <span class="nav-title">导航</span>
              <span class="nav-count">{{ filteredYaku.length }}</span>
            </div>
          </template>
          <div class="nav-list">
            <div 
              v-for="yaku in filteredYaku" 
              :key="yaku.id"
              class="nav-item"
              :class="{ active: activeId === yaku.id, pressing: pressingYakuId === yaku.id }"
              @click="selectYaku(yaku.id)"
            >
              {{ yaku.name }}
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { yakuData, type Yaku } from '../data/yaku'
import MahjongTile from '../components/MahjongTile.vue'

const LONG_PRESS_DELAY = 800

const searchText = ref('')
const activeId = ref('')
const pressingYakuId = ref('')
const incrementingYakuId = ref('')
const decrementingYakuId = ref('')
const isDecrementZone = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let intervalTimer: ReturnType<typeof setInterval> | null = null

const YAKU_FILTER_KEY = 'yaku-filter'

const hanGroups = [
  { han: '', label: '全部牌型' },
  { han: 1, label: '一番' },
  { han: 2, label: '二番' },
  { han: 3, label: '三番' },
  { han: 6, label: '六番' },
  { han: 5, label: '满贯' },
  { han: 8, label: '役满' },
  { han: -2, label: '双倍役满' },
  { han: -3, label: '流局' }
]

const activeHan = ref<number | string>(1)
const activeCategory = ref<string>('')

onMounted(() => {
  const stored = localStorage.getItem(YAKU_FILTER_KEY)
  if (stored) {
    try {
      const { han, category } = JSON.parse(stored)
      activeHan.value = han
      activeCategory.value = category || ''
    } catch (e) {}
  }
})

watch([activeHan, activeCategory], () => {
  localStorage.setItem(YAKU_FILTER_KEY, JSON.stringify({ han: activeHan.value, category: activeCategory.value }))
})

const filteredYaku = computed(() => {
  let result = yakuData
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(y => 
      y.name.toLowerCase().includes(keyword) || 
      y.desc.toLowerCase().includes(keyword)
    )
  }
  
  if (activeHan.value !== '') {
    result = result.filter(y => y.han === activeHan.value)
  }
  
  if (activeCategory.value === 'notYaku') {
    result = result.filter(y => y.isEffectOnly)
  } else if (activeCategory.value === '无限制') {
    result = result.filter(y => (y.category === '无限制' || y.category === '副露后') && !y.isEffectOnly)
  } else if (activeCategory.value) {
    result = result.filter(y => y.category === activeCategory.value)
  }
  
  return result
})

const getCategoryOptions = (han: number | string) => {
  const baseOptions = [
    { key: '', label: '不过滤条件' },
    { key: '无限制', label: '无限制' },
    { key: '门前清', label: '门前清' }
  ]
  if (han === '') {
    return baseOptions
  }
  const categories = new Set(yakuData.filter(y => y.han === han).map(y => y.category as string))
  const hasFulong = yakuData.some(y => y.han === han && y.category === '副露后')
  const hasMenqian = yakuData.some(y => y.han === han && y.category === '门前清')
  let options = baseOptions.filter(c => c.key === '' || categories.has(c.key))
  
  if (han === 8) {
    if (hasFulong && hasMenqian) {
      options = [{ key: '', label: '全部' }, { key: '无限制', label: '无限制' }, { key: '门前清', label: '门前清' }]
    } else if (hasFulong) {
      options = [{ key: '', label: '全部' }, { key: '无限制', label: '无限制' }]
    }
  } else if (han !== 1 && hasFulong) {
    options = options.filter(o => o.key !== '无限制')
    options.splice(1, 0, { key: '无限制', label: '无限制' })
  }
  
  if (han === 1 && yakuData.some(y => y.han === 1 && y.isEffectOnly)) {
    options.push({ key: 'notYaku', label: '不是役' })
  }
  return options
}

const currentCategoryOptions = computed(() => getCategoryOptions(activeHan.value))

const selectHan = (han: number | string) => {
  activeHan.value = han
  activeCategory.value = ''
}

const selectYaku = (id: string) => {
  activeId.value = id
  const el = document.getElementById(`yaku-${id}`)
  if (el) {
    const rect = el.getBoundingClientRect()
    const parent = el.parentElement
    if (parent) {
      const parentRect = parent.getBoundingClientRect()
      const isFullyVisible = rect.top >= parentRect.top && rect.bottom <= parentRect.bottom
      if (!isFullyVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }
}

const startLongPress = (yaku: Yaku, isDecrement: boolean) => {
  pressingYakuId.value = isDecrement ? `${yaku.id}-decrement` : yaku.id
  
  longPressTimer = setTimeout(() => {
    if (isDecrement) {
      decrementingYakuId.value = yaku.id
    } else {
      incrementingYakuId.value = yaku.id
    }
    
    updateMastery(yaku.id, isDecrement ? -1 : 1)
    
    intervalTimer = setInterval(() => {
      updateMastery(yaku.id, isDecrement ? -1 : 1)
    }, 100)
  }, LONG_PRESS_DELAY)
}

const endLongPress = (_id: string, _isDecrement: boolean) => {
  pressingYakuId.value = ''
  incrementingYakuId.value = ''
  decrementingYakuId.value = ''
  
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  if (intervalTimer) {
    clearInterval(intervalTimer)
    intervalTimer = null
  }
}

const updateMastery = (id: string, delta: number) => {
  const yaku = yakuData.find(y => y.id === id)
  if (yaku) {
    yaku.mastery = (yaku.mastery || 0) + delta
    if (yaku.mastery < 0) yaku.mastery = 0
  }
}
</script>

<style scoped>
.yaku-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background: #fafafa;
}

.yaku-header {
  flex-shrink: 0;
  background: #fafafa;
  padding: 16px 32px;
}

.yaku-header h2 {
  margin: 0 0 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filter-groups {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: nowrap;
}

.han-tabs {
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.han-tabs :deep(.el-radio-button) {
  margin: 0 !important;
}

.han-tabs :deep(.el-radio-button__inner) {
  padding: 6px 4px !important;
  font-size: 12px;
  line-height: 1;
  min-width: auto;
}

.han-tabs :deep(.el-radio-group) {
  width: 100%;
}

.han-tabs :deep(.el-radio-button__inner) {
  width: 100%;
  min-width: 30px;
  padding: 6px 4px !important;
  font-size: 12px;
  line-height: 1;
}

.han-tabs :deep(.el-radio-button) {
  margin: 0 !important;
}

.han-tabs :deep(.el-radio-button__original-radio + .el-radio-button__inner) {
  padding: 6px 4px;
}

.category-tabs {
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.search-input {
  width: 300px;
  flex-shrink: 0;
}

.han-tabs {
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.han-tabs :deep(.el-radio-button) {
  margin: 0 !important;
}

.han-tabs :deep(.el-radio-button__inner) {
  padding: 8px 12px !important;
  font-size: 13px;
  line-height: 1;
  min-width: 80px;
}

.category-tabs {
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.category-tabs :deep(.el-radio-button) {
  margin: 0 !important;
}

.category-tabs :deep(.el-radio-button__inner) {
  padding: 8px 12px !important;
  font-size: 13px;
  line-height: 1;
  min-width: 80px;
}

.yaku-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 0 32px 16px;
}

.yaku-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 16px;
}

.yaku-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  z-index: 0;
  transition: all 0.2s;
}

.yaku-card:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.yaku-card.active {
  background: #fef9e6;
}

.yaku-card.pressing {
  transform: scale(0.98);
}

.yaku-card.incrementing {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@keyframes pulse-green {
  0%, 100% { background: rgba(255, 255, 255, 0.7); }
  50% { background: rgba(76, 175, 80, 0.3); }
}

@keyframes pulse-red {
  0%, 100% { background: rgba(255, 255, 255, 0.7); }
  50% { background: rgba(244, 67, 54, 0.3); }
}

.press-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}

.press-progress::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, 
    rgba(64, 158, 255, 0.1) 0%, 
    rgba(64, 158, 255, 0.3) 30%,
    rgba(64, 158, 255, 0.5) 60%, 
    rgba(64, 158, 255, 0.8) 100%
  );
  transform-origin: left;
  animation: chargeWave var(--press-duration, 0.5s) cubic-bezier(0, 0, 0.2, 1) forwards;
}

.press-progress.decrement::before {
  background: linear-gradient(90deg, 
    rgba(255, 107, 107, 0.1) 0%, 
    rgba(255, 107, 107, 0.3) 30%,
    rgba(255, 107, 107, 0.5) 60%, 
    rgba(255, 107, 107, 0.8) 100%
  );
}

@keyframes chargeWave {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes incrementAnim {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(30px, -30px) scale(0.8);
  }
}

.yaku-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  background: rgba(64, 158, 255, 0.15);
  padding: 12px 16px;
  border-radius: 8px;
}

.yaku-name {
  font-size: 28px;
  font-weight: 700;
  color: #e6b800;
}

.han-text {
  font-size: 20px;
  font-weight: 600;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
}

.yaku-condition {
  font-size: 28px;
  color: #4caf50;
}

.yaku-condition.effect-only {
  color: #909399;
}

.yaku-count {
  margin-left: auto;
  font-size: 24px;
  font-weight: 700;
  color: #64b5f6;
  min-width: 32px;
  text-align: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  user-select: none;
}

.yaku-count:hover {
  background: rgba(64, 158, 255, 0.2);
}

.increment-text {
  position: absolute;
  font-size: 200px;
  font-weight: 700;
  color: #1565c0;
  z-index: 100;
  animation: incrementAnim 0.75s ease-out forwards;
  pointer-events: none;
  right: 40px;
  top: 40px;
}

.decrement-text {
  position: absolute;
  font-size: 200px;
  font-weight: 700;
  color: #f44336;
  z-index: 100;
  animation: decrementAnim 0.75s ease-out forwards;
  pointer-events: none;
  right: 40px;
  top: 40px;
}

@keyframes decrementAnim {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(30px, -30px) scale(0.8);
  }
}

.yaku-middle {
  font-size: 24px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.yaku-bottom {
  display: flex;
  align-items: center;
  gap: 0px;
  position: relative;
  z-index: 1;
}

.nav-area {
  width: 180px;
  flex-shrink: 0;
  margin-left: 16px;
}

.nav-card {
  width: 180px;
}

.nav-card :deep(.el-card__body) {
  padding: 12px;
}

.nav-card :deep(.el-card__header) {
  padding: 12px 16px;
  margin-bottom: 0;
}

.nav-title {
  font-size: 14px;
  font-weight: 500;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-count {
  font-size: 14px;
  color: #909399;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: calc(100vh - 400px);
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
