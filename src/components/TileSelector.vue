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
}

interface Emits {
  (e: 'select', tile: string): void
  (e: 'search', text: string): void
  (e: 'remove', tile: string, source: 'hand' | 'river' | 'fulu'): void
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxCount: 4,
  selectedTiles: () => [],
  filterSuits: () => [],
  searchText: ''
})

const emit = defineEmits<Emits>()

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

// 响应式 tiles 列表，用于 vuedraggable
const tilesList = ref<TileInfo[]>([])

// 初始化 tilesList
const initTilesList = () => {
  tilesList.value = filteredCategories.value.flatMap((c) => c.tiles)
}

// 监听 filteredCategories 变化更新 tilesList
watch(
  filteredCategories,
  () => {
    initTilesList()
  },
  { deep: true, immediate: true }
)

// Get selected count for a specific tile
const getSelectedCount = (tileId: string): number => {
  return props.selectedTiles.filter((t) => t === tileId).length
}

// Check if a tile is disabled (already at max count)
const isTileDisabled = (tileId: string): boolean => {
  if (props.disabled) return true
  return getSelectedCount(tileId) >= props.maxCount
}

// Get remaining count for a tile
const getRemainingCount = (tileId: string): number => {
  return props.maxCount - getSelectedCount(tileId)
}

// For drag and drop
let isDragging = false
let dragStartTime = 0

// Handle drag start - set data for HTML5 drag and drop
const handleDragStart = (event: DragEvent, tileId: string) => {
  isDragging = true
  dragStartTime = Date.now()
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tileId)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// Handle drag end
const handleDragEnd = () => {
  setTimeout(() => {
    isDragging = false
  }, 150)
}

// Handle tile drop from other areas (hand, river, fulu)
const handleTileDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = (event.dataTransfer?.getData('source') as 'hand' | 'river' | 'fulu') || 'hand'
  if (tileId) {
    emit('remove', tileId, source)
  }
}

// Handle tile click - ignore if it was a drag operation
const handleTileClick = (tileId: string) => {
  // 如果是拖拽操作，或者距离拖拽开始时间太短，则忽略
  if (isDragging) return
  const timeSinceDrag = Date.now() - dragStartTime
  if (timeSinceDrag < 200) return

  if (!isTileDisabled(tileId)) {
    emit('select', tileId)
  }
}
</script>

<template>
  <div
    class="tile-selector"
    :class="{ 'is-disabled': disabled }"
    @dragover="(e) => e.preventDefault()"
    @drop="handleTileDrop"
  >
    <!-- Category Tabs -->
    <div class="category-tabs">
      <el-tabs v-model="activeTab" :disabled="disabled">
        <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key" />
      </el-tabs>
    </div>

    <!-- Tile Grid -->
    <div class="tile-grid-container">
      <div class="tile-grid">
        <div
          v-for="element in filteredCategories.flatMap((c) => c.tiles)"
          :key="element.id"
          class="tile-item"
          :class="{
            'is-disabled': isTileDisabled(element.id)
          }"
          draggable="true"
          @click="handleTileClick(element.id)"
          @dragstart="handleDragStart($event, element.id)"
          @dragend="handleDragEnd"
        >
          <MahjongTile :tile-id="element.id" :width="50" :show-name="true" />
          <div class="tile-count" :class="{ 'is-full': getRemainingCount(element.id) === 0 }">
            {{ getRemainingCount(element.id) }}
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  justify-items: center;
}

@media (max-width: 768px) {
  .tile-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .tile-grid {
    grid-template-columns: repeat(3, 1fr);
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
