<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MahjongTile from './MahjongTile.vue'

// Types
interface TileInfo {
  id: string
  name: string
}

interface TileCategory {
  key: string
  label: string
  tiles: TileInfo[]
}

interface Props {
  disabled?: boolean
  maxCount?: number
  selectedTiles?: string[]
  filterSuits?: string[]
  searchText?: string
  usedTiles?: string[] // 已使用的牌，用于计算剩余数量
}

interface Emits {
  (e: 'select', tile: string): void
  (e: 'search', text: string): void
  (e: 'remove', tile: string, source: 'hand' | 'river' | 'fulu' | 'draw' | 'fulu-temp'): void
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxCount: 4,
  selectedTiles: () => [],
  filterSuits: () => [],
  searchText: '',
  usedTiles: () => []
})

const emit = defineEmits<Emits>()

// 配置：是否在数量为0时仍显示占位
const showWhenEmpty = ref(true)

// All tile categories data
const categories: TileCategory[] = [
  {
    key: 'wan',
    label: '万',
    tiles: Array.from({ length: 9 }, (_, i) => ({
      id: `w${i + 1}`,
      name: `${i + 1}万`
    }))
  },
  {
    key: 'tong',
    label: '筒',
    tiles: Array.from({ length: 9 }, (_, i) => ({
      id: `b${i + 1}`,
      name: `${i + 1}筒`
    }))
  },
  {
    key: 'tiao',
    label: '索',
    tiles: Array.from({ length: 9 }, (_, i) => ({
      id: `s${i + 1}`,
      name: `${i + 1}索`
    }))
  },
  {
    key: 'zi',
    label: '风',
    tiles: [
      { id: 'd1', name: '东风' },
      { id: 'd2', name: '南风' },
      { id: 'd3', name: '西风' },
      { id: 'd4', name: '北风' }
    ]
  },
  {
    key: 'dragon',
    label: '三元',
    tiles: [
      { id: 'z1', name: '白' },
      { id: 'z2', name: '中' },
      { id: 'z3', name: '发' }
    ]
  },
  {
    key: 'red',
    label: '赤',
    tiles: [
      { id: 'rw5', name: '赤五万' },
      { id: 'rb5', name: '赤五筒' },
      { id: 'rs5', name: '赤五索' }
    ]
  }
]

// 素材区数据：Record<tileId, count>
// 基于 usedTiles 计算剩余数量，而非维护独立状态
const sourceTiles = ref<Record<string, number>>({})

// 特殊牌的初始数量配置
const SPECIAL_TILE_COUNTS: Record<string, number> = {
  // 赤牌：只有1张
  rw5: 1,
  rb5: 1,
  rs5: 1,
  // 普通5：只有3张
  w5: 3,
  b5: 3,
  s5: 3
}

// 初始化素材区数量
const initSourceTiles = () => {
  const tiles: Record<string, number> = {}
  for (const category of categories) {
    for (const tile of category.tiles) {
      // 特殊牌使用配置的数量，其他牌使用默认值 maxCount
      tiles[tile.id] = SPECIAL_TILE_COUNTS[tile.id] ?? props.maxCount
    }
  }
  return tiles
}

// 根据 usedTiles 计算实际剩余数量
const updateSourceTilesFromUsedTiles = () => {
  // 初始化所有牌的数量
  sourceTiles.value = initSourceTiles()

  // 统计 usedTiles 中每种牌的出现次数
  const usedCounts: Record<string, number> = {}
  for (const tile of props.usedTiles) {
    usedCounts[tile] = (usedCounts[tile] || 0) + 1
  }

  // 计算剩余数量 = 最大数量 - 已使用数量
  for (const tileId of Object.keys(sourceTiles.value)) {
    const usedCount = usedCounts[tileId] || 0
    // 使用 SPECIAL_TILE_COUNTS 中的最大数量，而非 props.maxCount
    const maxCount = SPECIAL_TILE_COUNTS[tileId] ?? props.maxCount
    sourceTiles.value[tileId] = Math.max(0, maxCount - usedCount)
  }
}

// 监听 usedTiles 变化，更新素材区数量
watch(
  () => props.usedTiles,
  () => {
    updateSourceTilesFromUsedTiles()
  },
  { deep: true, immediate: true }
)

// Active tab
const activeTab = ref('all')

// Local search text
const localSearchText = ref(props.searchText)

// Update local search when prop changes
watch(
  () => props.searchText,
  (newVal) => {
    localSearchText.value = newVal
  }
)

// All tabs including "all"
const tabs = computed(() => [{ key: 'all', label: '全部' }, ...categories])

// Filter categories based on active tab and search text
const filteredCategories = computed(() => {
  let result = categories

  // Filter by tab
  if (activeTab.value !== 'all') {
    result = result.filter((c) => c.key === activeTab.value)
  }

  // Filter by search text
  if (localSearchText.value.trim()) {
    const searchLower = localSearchText.value.toLowerCase().trim()
    result = result
      .map((cat) => ({
        ...cat,
        tiles: cat.tiles.filter(
          (tile) =>
            tile.name.toLowerCase().includes(searchLower) ||
            tile.id.toLowerCase().includes(searchLower)
        )
      }))
      .filter((cat) => cat.tiles.length > 0)
  }

  return result
})

// 去重后的素材列表
const uniqueSourceTiles = computed(() => {
  const tiles: string[] = []
  for (const category of filteredCategories.value) {
    for (const tile of category.tiles) {
      tiles.push(tile.id)
    }
  }

  // 根据配置过滤
  if (!showWhenEmpty.value) {
    return tiles.filter((id) => sourceTiles.value[id] > 0)
  }
  return tiles
})

// Get selected count for a specific tile
const getSelectedCount = (tileId: string): number => {
  return props.selectedTiles.filter((t) => t === tileId).length
}

// Check if a tile is disabled (already at max count)
const isTileDisabled = (tileId: string): boolean => {
  if (props.disabled) return true
  return getSelectedCount(tileId) >= props.maxCount
}

// Get remaining count for a tile - 直接使用 sourceTiles
const getRemainingCount = (tileId: string): number => {
  return sourceTiles.value[tileId] ?? 0
}

// 检查是否还有剩余
const hasRemaining = (tileId: string): boolean => {
  return getRemainingCount(tileId) > 0
}

// Handle tile click - 添加牌到目标区域
const handleTileClick = (tileId: string) => {
  if (isTileDisabled(tileId)) return
  // 通过 emit 通知父组件，父组件会更新 usedTiles，从而更新 sourceTiles
  emit('select', tileId)
}

// 素材区接收从其他区域拖回的牌
const handleSourceDrop = (event: Event) => {
  const ev = event as DragEvent
  ev.preventDefault()
  const tileId = ev.dataTransfer?.getData('text/plain')
  const source = ev.dataTransfer?.getData('source')

  if (tileId && source && source !== 'source') {
    // 通过 emit 通知父组件增加素材区数量
    emit('remove', tileId, source as any)
  }
}

// 素材区拖拽开始
const handleSourceDragStart = (event: DragEvent, tileId: string) => {
  if (!hasRemaining(tileId) || isTileDisabled(tileId)) {
    event.preventDefault()
    return
  }
  // 通知父组件减少素材区数量（通过 select 事件，父组件会将牌添加到其他区域）
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tileId)
    event.dataTransfer.setData('source', 'source')
    // 允许 copy/move，避免目标区在 dragover 阶段无法读取 source 时设置 move 导致 drop 被拒绝
    event.dataTransfer.effectAllowed = 'copyMove'
  }
}
</script>

<template>
  <div
    class="tile-selector"
    :class="{ 'is-disabled': disabled }"
    @dragover.prevent="
      (e: DragEvent) => {
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      }
    "
    @drop="handleSourceDrop"
  >
    <!-- Category Tabs -->
    <div class="category-tabs">
      <el-tabs v-model="activeTab" :disabled="disabled">
        <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key" />
      </el-tabs>
    </div>

    <!-- Tile Grid - 使用原生 drag/drop -->
    <div class="tile-grid-container">
      <div class="tile-grid">
        <div
          v-for="tileId in uniqueSourceTiles"
          :key="tileId"
          class="tile-item"
          :class="{
            'is-disabled': isTileDisabled(tileId) || !hasRemaining(tileId)
          }"
          :draggable="!disabled && hasRemaining(tileId)"
          @click="handleTileClick(tileId)"
          @dragstart="(e) => handleSourceDragStart(e, tileId)"
        >
          <MahjongTile :tile-id="tileId" :width="50" :show-name="true" />
          <div class="tile-count" :class="{ 'is-full': getRemainingCount(tileId) === 0 }">
            {{ getRemainingCount(tileId) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredCategories.length === 0" class="empty-state">
      <el-empty description="没有找到匹配的牌" />
    </div>
  </div>
</template>

<style scoped>
.tile-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.tile-selector.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.search-box {
  width: 100%;
}

.category-tabs {
  border-bottom: 1px solid #ebeef5;
}

.category-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.category-tabs :deep(.el-tabs__item) {
  padding: 0 16px;
}

.tile-grid-container {
  max-height: 700px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tile-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .tile-grid {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .tile-grid {
    gap: 4px;
  }
}

.tile-item {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tile-item:hover:not(.is-disabled) {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.tile-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tile-count {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: #67c23a;
  border-radius: 10px;
  padding: 0 6px;
}

.tile-count.is-full {
  background: #f56c6c;
}

.empty-state {
  padding: 40px 0;
}
</style>
