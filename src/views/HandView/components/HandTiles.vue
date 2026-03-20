<script setup lang="ts">
import { computed } from 'vue'
import MahjongTile from '../../../components/MahjongTile.vue'
import { normalizeRedFive } from '../../../utils/mahjong'

interface Props {
  tiles: string[]
  tingPai?: string[]
  disabled?: boolean
}

interface Emits {
  (e: 'tile-remove', tile: string, index: number): void
  (e: 'tile-drag-start', event: DragEvent, tile: string, index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  tiles: () => [],
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

const handleTileClick = (tile: string, index: number) => {
  emit('tile-remove', tile, index)
}

const handleDragStart = (event: DragEvent, tile: string, index: number) => {
  emit('tile-drag-start', event, tile, index)
}

const isTingHighlight = (tile: string) => {
  const n = normalizeRedFive(tile)
  return props.tingPai.some((t) => normalizeRedFive(t) === n)
}
</script>

<template>
  <div class="hand-tiles tiles-container" :class="{ 'is-disabled': disabled }">
    <div
      v-for="(element, index) in tiles"
      :key="index"
      class="tile-wrapper"
      :class="{ 'is-ting': isTingHighlight(element) }"
      draggable="true"
      @dragstart="(e) => handleDragStart(e, element, index)"
      @dblclick="handleTileClick(element, index)"
    >
      <div v-if="isTingHighlight(element)" class="ting-indicator">
        {{ tingCountMap[element] || '' }}
      </div>
      <MahjongTile :tile-id="element" :width="60" :show-name="false" />
      <div class="tile-remove" @click.stop="handleTileClick(element, index)">×</div>
    </div>
    <div v-if="tiles.length === 0" class="hand-placeholder">拖入牌到这里</div>
  </div>
</template>

<style scoped>
.hand-tiles {
  min-height: 90px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s;
}

.hand-tiles:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.hand-tiles.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.hand-placeholder {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
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

.tile-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  line-height: 16px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  background: #f56c6c;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tile-wrapper:hover .tile-remove {
  opacity: 1;
}
</style>
