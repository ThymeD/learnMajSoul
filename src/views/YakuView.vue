<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { yakuData as originYakuData, type Yaku } from '../data/yaku'
import MahjongTile from '../components/MahjongTile.vue'
import MasteryStars from '../components/MasteryStars.vue'

const searchText = ref('')

const yakuData = reactive<Yaku[]>(originYakuData.map(y => ({ ...y })))

const STORAGE_KEY = 'yaku-mastery'

const loadMastery = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const masteryMap = JSON.parse(stored)
    yakuData.forEach(y => {
      if (masteryMap[y.id] !== undefined) {
        y.mastery = masteryMap[y.id]
      }
    })
  }
}

const saveMastery = () => {
  const masteryMap: Record<string, number> = {}
  yakuData.forEach(y => {
    if (y.mastery) {
      masteryMap[y.id] = y.mastery
    }
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(masteryMap))
}

onMounted(() => {
  loadMastery()
})

const hanGroups = [
  { han: 1, label: '一番' },
  { han: 2, label: '二番' },
  { han: 3, label: '三番' },
  { han: 6, label: '六番' },
  { han: -1, label: '役满' }
]

const categoryGroups = [
  { key: '', label: '全部' },
  { key: '无限制', label: '无限制' },
  { key: '副露后', label: '副露后' },
  { key: '门前清', label: '门前清' }
]

const activeHan = ref(1)
const activeCategory = ref<string>('')

const filteredYaku = computed(() => {
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    return yakuData.filter(y => 
      y.name.toLowerCase().includes(keyword) || 
      y.desc.toLowerCase().includes(keyword)
    )
  }
  let result = yakuData.filter(y => y.han === activeHan.value)
  if (activeCategory.value) {
    result = result.filter(y => y.category === activeCategory.value)
  }
  return result
})

const getCategoryOptions = (han: number) => {
  const categories = new Set(yakuData.filter(y => y.han === han).map(y => y.category as string))
  return categoryGroups.filter(c => c.key === '' || categories.has(c.key))
}

const currentCategoryOptions = computed(() => {
  return getCategoryOptions(activeHan.value)
})

const selectHan = (han: number) => {
  activeHan.value = han
  const options = getCategoryOptions(han)
  if (options.length > 0 && !options.some(o => o.key === activeCategory.value)) {
    activeCategory.value = options[0].key
  }
}

const activeId = ref('')

const selectYaku = (id: string) => {
  activeId.value = id
  const el = document.getElementById(`yaku-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const longPressTimers: Record<string, ReturnType<typeof setTimeout>> = {}
const pressingYakuId = ref<string>('')
const incrementingYakuId = ref<string>('')
const decrementingYakuId = ref<string>('')
const isDecrementZone = ref(false)

const startLongPress = (yaku: any, isDecrement: boolean) => {
  if (incrementingYakuId.value || decrementingYakuId.value) return
  if (isDecrement && (yaku.mastery === undefined || yaku.mastery <= 0)) return
  
  const timerKey = `${yaku.id}-${isDecrement}`
  if (longPressTimers[timerKey]) return
  
  if (isDecrement) {
    pressingYakuId.value = yaku.id + '-decrement'
  } else {
    if (isDecrementZone.value) return
    pressingYakuId.value = yaku.id
  }
  
  longPressTimers[timerKey] = setTimeout(() => {
    if (isDecrement) {
      yaku.mastery = Math.max(0, (yaku.mastery || 0) - 1)
    } else {
      yaku.mastery = (yaku.mastery || 0) + 1
    }
    delete longPressTimers[timerKey]
    pressingYakuId.value = ''
    if (isDecrement) {
      decrementingYakuId.value = yaku.id
      setTimeout(() => { decrementingYakuId.value = '' }, 500)
    } else {
      incrementingYakuId.value = yaku.id
      setTimeout(() => { incrementingYakuId.value = '' }, 500)
    }
  }, 500)
}

const endLongPress = (yakuId: string, isDecrement: boolean) => {
  isDecrementZone.value = false
  const timerKey = `${yakuId}-${isDecrement}`
  if (longPressTimers[timerKey]) {
    clearTimeout(longPressTimers[timerKey])
    delete longPressTimers[timerKey]
  }
  pressingYakuId.value = ''
}

watch(() => yakuData.map(y => y.mastery), () => {
  saveMastery()
}, { deep: true })
</script>

<template>
  <div class="yaku-page">
    <div class="main-area">
      <div class="main-col">
        <div class="sticky-header">
          <h2>役种一览</h2>
          <el-input 
            v-model="searchText" 
            placeholder="搜索役种名称或描述" 
            class="search-input"
          >
            <template #append>
              <el-button @click="searchText = ''">清除</el-button>
            </template>
          </el-input>
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
        <div class="yaku-list">
          <div 
            v-for="yaku in filteredYaku" 
            :key="yaku.id" 
            :id="`yaku-${yaku.id}`"
            class="yaku-card"
            :class="{ active: activeId === yaku.id, pressing: pressingYakuId === yaku.id || pressingYakuId === yaku.id + '-decrement', incrementing: incrementingYakuId === yaku.id, decrementing: decrementingYakuId === yaku.id }"
            @click="selectYaku(yaku.id)"
            @mousedown.prevent="startLongPress(yaku, false)"
            @mouseup="endLongPress(yaku.id, false)"
            @mouseleave="endLongPress(yaku.id, false)"
          >
            <div v-if="pressingYakuId === yaku.id" class="press-progress"></div>
            <div class="yaku-top">
              <span class="yaku-name">{{ yaku.name }}</span>
              <span class="han-text">{{ yaku.han > 0 ? yaku.han + '番' : '役满' }}</span>
              <span v-if="yaku.category === '门前清'" class="yaku-condition">门前清限定</span>
              <span 
                class="yaku-count"
                @mousedown.prevent="isDecrementZone = true; startLongPress(yaku, true)"
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
      </div>
      <div class="nav-area">
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
            :class="{ active: activeId === yaku.id, pressing: pressingYakuId === yaku.id }"
                @click="selectYaku(yaku.id)"
              >
                {{ yaku.name }}
              </div>
            </div>
          </el-card>
        </el-affix>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yaku-page {
  display: flex;
  height: calc(100vh - 64px);
  background: linear-gradient(180deg, #f0f2f5 0%, #e8eaed 100%);
  position: relative;
}

.main-area {
  flex: 1;
  display: flex;
  min-width: 0;
}

.main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-area {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 10;
  padding-bottom: 16px;
  flex-shrink: 0;
}

.yaku-page h2 {
  margin: 0 0 16px;
  color: #303133;
}

.search-input {
  margin-bottom: 16px;
  max-width: 300px;
}

.han-tabs {
  margin-bottom: 12px;
}

.han-tabs :deep(.el-radio-group) {
  width: 100%;
}

.han-tabs :deep(.el-radio-button__inner) {
  width: 100%;
  min-width: 100px;
  padding: 8px 20px;
}

.category-tabs {
  margin-bottom: 12px;
}

.category-tabs :deep(.el-radio-group) {
  width: 100%;
}

.category-tabs :deep(.el-radio-button__inner) {
  width: 100%;
  min-width: 100px;
  padding: 8px 20px;
}

.yaku-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.yaku-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  z-index: 0;
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
  animation: chargeWave 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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

.yaku-card.incrementing {
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
  background: rgba(64, 158, 255, 0.15);
  padding: 12px 16px;
  border-radius: 8px;
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

.increment-text {
  position: absolute;
  font-size: 200px;
  font-weight: 700;
  color: #64b5f6;
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

.han-text {
  font-size: 20px;
  font-weight: 600;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
}

.yaku-name {
  font-size: 28px;
  font-weight: 700;
  color: #e6b800;
}

.yaku-condition {
  font-size: 28px;
  color: #4caf50;
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
  gap: 8px;
  position: relative;
  z-index: 1;
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
  max-height: calc(100vh - 200px);
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
