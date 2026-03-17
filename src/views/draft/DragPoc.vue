<script setup lang="ts">
import { ref, computed } from 'vue'
import MahjongTile from '../../components/MahjongTile.vue'

// 配置：是否在数量为0时仍显示占位
const showWhenEmpty = ref(true)

// 素材区数据：每种牌4张
const sourceTiles = ref<Record<string, number>>({
  w1: 4,
  w2: 4
})

// 去重后的素材（用于显示）
const uniqueSourceTiles = computed(() => {
  // 如果配置为不显示空牌，则过滤掉数量为0的
  if (!showWhenEmpty.value) {
    return Object.keys(sourceTiles.value).filter((key) => sourceTiles.value[key] > 0)
  }
  return Object.keys(sourceTiles.value)
})

// 获取某张牌的剩余数量
const getRemainingCount = (tileId: string): number => {
  return sourceTiles.value[tileId] || 0
}

// 检查是否还有剩余
const hasRemaining = (tileId: string): boolean => {
  return getRemainingCount(tileId) > 0
}

// 素材区拖拽开始
const handleSourceDragStart = (event: DragEvent, tileId: string) => {
  if (!hasRemaining(tileId)) {
    event.preventDefault()
    return
  }
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tileId)
    event.dataTransfer.setData('source', 'source')
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// 素材区接收拖回
const handleSourceDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (tileId && source !== 'source') {
    // 数量+1
    if (sourceTiles.value[tileId] !== undefined) {
      sourceTiles.value[tileId]++
    }
  }
}

// 区域A
const areaA = ref<string[]>([])

// 区域B
const areaB = ref<string[]>([])

// 区域C
const areaC = ref<string[]>([])

// 区域拖拽开始
const handleAreaDragStart = (event: DragEvent, tileId: string, area: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tileId)
    event.dataTransfer.setData('source', area)
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 区域A 接收拖入
const handleAreaADrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'source') {
    // 从素材区来，数量-1
    if (sourceTiles.value[tileId] > 0) {
      sourceTiles.value[tileId]--
      areaA.value.push(tileId)
    }
  } else if (source === 'areaB') {
    // 从区域B来
    const idx = areaB.value.indexOf(tileId)
    if (idx !== -1) {
      areaB.value.splice(idx, 1)
      areaA.value.push(tileId)
    }
  } else if (source === 'areaC') {
    const idx = areaC.value.indexOf(tileId)
    if (idx !== -1) {
      areaC.value.splice(idx, 1)
      areaA.value.push(tileId)
    }
  }
}

// 区域B 接收拖入
const handleAreaBDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'source') {
    if (sourceTiles.value[tileId] > 0) {
      sourceTiles.value[tileId]--
      areaB.value.push(tileId)
    }
  } else if (source === 'areaA') {
    const idx = areaA.value.indexOf(tileId)
    if (idx !== -1) {
      areaA.value.splice(idx, 1)
      areaB.value.push(tileId)
    }
  } else if (source === 'areaC') {
    const idx = areaC.value.indexOf(tileId)
    if (idx !== -1) {
      areaC.value.splice(idx, 1)
      areaB.value.push(tileId)
    }
  }
}

// 区域C 接收拖入
const handleAreaCDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'source') {
    if (sourceTiles.value[tileId] > 0) {
      sourceTiles.value[tileId]--
      areaC.value.push(tileId)
    }
  } else if (source === 'areaA') {
    const idx = areaA.value.indexOf(tileId)
    if (idx !== -1) {
      areaA.value.splice(idx, 1)
      areaC.value.push(tileId)
    }
  } else if (source === 'areaB') {
    const idx = areaB.value.indexOf(tileId)
    if (idx !== -1) {
      areaB.value.splice(idx, 1)
      areaC.value.push(tileId)
    }
  }
}
</script>

<template>
  <div class="drag-poc">
    <h2>拖拽 POC 验证</h2>
    <p>使用原生 HTML5 drag/drop</p>

    <!-- 配置 -->
    <div class="config-row">
      <el-checkbox v-model="showWhenEmpty">素材区空牌占位显示</el-checkbox>
    </div>

    <div class="drag-container">
      <!-- 素材区 -->
      <div class="zone source-zone" @dragover.prevent @drop="handleSourceDrop">
        <h3>素材区</h3>
        <div class="tile-list">
          <div
            v-for="tile in uniqueSourceTiles"
            :key="tile"
            class="tile-item"
            :class="{ 'is-disabled': !hasRemaining(tile) }"
            :draggable="hasRemaining(tile)"
            @dragstart="(e) => handleSourceDragStart(e, tile)"
          >
            <MahjongTile :tile-id="tile" :width="50" :show-name="true" />
            <div class="tile-count" :class="{ 'is-full': getRemainingCount(tile) === 0 }">
              {{ getRemainingCount(tile) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 区域A -->
      <div class="zone area-a" @dragover.prevent @drop="handleAreaADrop">
        <h3>区域A</h3>
        <div class="tile-list">
          <div
            v-for="(tile, idx) in areaA"
            :key="idx"
            class="tile-item"
            draggable="true"
            @dragstart="(e) => handleAreaDragStart(e, tile, 'areaA')"
          >
            <MahjongTile :tile-id="tile" :width="50" :show-name="false" />
          </div>
        </div>
      </div>
    </div>

    <div class="drag-container">
      <!-- 区域B -->
      <div class="zone area-b" @dragover.prevent @drop="handleAreaBDrop">
        <h3>区域B</h3>
        <div class="tile-list">
          <div
            v-for="(tile, idx) in areaB"
            :key="idx"
            class="tile-item"
            draggable="true"
            @dragstart="(e) => handleAreaDragStart(e, tile, 'areaB')"
          >
            <MahjongTile :tile-id="tile" :width="50" :show-name="false" />
          </div>
        </div>
      </div>

      <!-- 区域C -->
      <div class="zone area-c" @dragover.prevent @drop="handleAreaCDrop">
        <h3>区域C</h3>
        <div class="tile-list">
          <div
            v-for="(tile, idx) in areaC"
            :key="idx"
            class="tile-item"
            draggable="true"
            @dragstart="(e) => handleAreaDragStart(e, tile, 'areaC')"
          >
            <MahjongTile :tile-id="tile" :width="50" :show-name="false" />
          </div>
        </div>
      </div>
    </div>

    <div class="debug-info">
      <h4>当前状态：</h4>
      <p>素材区: {{ sourceTiles }}</p>
      <p>区域A: {{ areaA }}</p>
      <p>区域B: {{ areaB }}</p>
      <p>区域C: {{ areaC }}</p>
    </div>
  </div>
</template>

<style scoped>
.drag-poc {
  padding: 20px;
}

.drag-poc h2 {
  text-align: center;
  margin-bottom: 10px;
}

.drag-poc > p {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.config-row {
  text-align: center;
  margin-bottom: 20px;
}

.drag-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: center;
}

.zone {
  width: 200px;
  min-height: 150px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 10px;
  background: #f9f9f9;
}

.zone h3 {
  margin: 0 0 10px 0;
  text-align: center;
  font-size: 16px;
  color: #333;
}

.tile-list {
  min-height: 100px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  min-height: 80px;
}

.tile-item {
  position: relative;
  width: 60px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
}

.tile-item:hover {
  transform: scale(1.05);
}

.tile-item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tile-count {
  position: absolute;
  top: -5px;
  right: -5px;
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

.debug-info {
  margin-top: 40px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.debug-info h4 {
  margin: 0 0 10px 0;
}

.debug-info p {
  margin: 5px 0;
  font-family: monospace;
}
</style>
