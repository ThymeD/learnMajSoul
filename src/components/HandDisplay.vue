<script setup lang="ts">
import { computed } from 'vue'
import MahjongTile from './MahjongTile.vue'

interface Props {
  tiles: string[]
  drawTile: string | null
  tingPai: string[]
  disabled?: boolean
}

interface Emits {
  (e: 'remove-tile', tile: string, index: number): void
  (e: 'set-draw', tile: string): void
  (e: 'update:tiles', tiles: string[]): void
  (e: 'tile-dblclick', tile: string, index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  tiles: () => [],
  drawTile: null,
  tingPai: () => [],
  disabled: false
})

const emit = defineEmits<Emits>()

// 听牌位置映射：tile -> 听牌张数
const tingCountMap = computed(() => {
  const map: Record<string, number> = {}
  props.tingPai.forEach((tile) => {
    map[tile] = (map[tile] || 0) + 1
  })
  return map
})

// 处理 tiles 变化
const handleTilesUpdate = (val: string[]) => {
  emit('update:tiles', val)
}
</script>

<template>
  <div class="hand-display" :class="{ 'is-disabled': disabled }">
    <!-- 手牌区域 -->
    <div class="hand-tiles">
      <draggable
        :model-value="tiles"
        group="tiles"
        item-key="index"
        class="tiles-container"
        :disabled="disabled"
        @update:model-value="handleTilesUpdate"
      >
        <template #item="{ element, index }">
          <div
            class="tile-wrapper"
            :class="{ 'is-ting': tingPai.includes(element) }"
            @dblclick="emit('tile-dblclick', element, index)"
          >
            <!-- 听牌位置显示听牌张数 -->
            <div v-if="tingPai.includes(element)" class="ting-indicator">
              {{ tingCountMap[element] || '' }}
            </div>
            <MahjongTile :tile-id="element" :width="60" :show-name="false" />
          </div>
        </template>
      </draggable>

      <!-- 摸牌区域 -->
      <div
        class="draw-tile-zone"
        :class="{ 'has-draw': !!drawTile, 'is-disabled': disabled }"
        @dblclick="emit('tile-dblclick', drawTile!, -1)"
      >
        <div v-if="drawTile" class="draw-tile">
          <MahjongTile :tile-id="drawTile" :width="60" :show-name="false" />
        </div>
        <div v-else class="draw-placeholder">摸牌</div>
      </div>
    </div>

    <!-- 听牌信息 -->
    <div v-if="tingPai.length > 0" class="ting-info">
      <span class="ting-label">听牌：</span>
      <span v-for="(count, tile) in tingCountMap" :key="tile" class="ting-item">
        {{ tile }}{{ count }}张
      </span>
    </div>
  </div>
</template>

<style scoped>
.hand-display {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.hand-display.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.hand-tiles {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 80px;
  flex-wrap: wrap;
}

.tiles-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex-wrap: wrap;
}

.tile-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.tile-wrapper:hover {
  background: rgba(64, 158, 255, 0.1);
}

.tile-wrapper.is-ting {
  margin-left: 16px;
}

.tile-wrapper.is-ting:first-child {
  margin-left: 0;
}

.ting-indicator {
  position: absolute;
  left: -12px;
  top: 0;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 10px;
  color: #fff;
  background: #e6a23c;
  border-radius: 8px;
  padding: 0 4px;
}

.draw-tile-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  min-height: 90px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s ease;
}

.draw-tile-zone:hover:not(.is-disabled) {
  border-color: #409eff;
  background: #ecf5ff;
}

.draw-tile-zone.has-draw {
  border-style: solid;
  border-color: #409eff;
}

.draw-placeholder {
  color: #909399;
  font-size: 14px;
}

.draw-tile {
  cursor: pointer;
}

.ting-info {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 14px;
}

.ting-label {
  color: #606266;
  font-weight: 500;
}

.ting-item {
  display: inline-block;
  margin-left: 8px;
  color: #e6a23c;
}
</style>
