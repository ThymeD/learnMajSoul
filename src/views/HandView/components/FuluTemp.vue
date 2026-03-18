<script setup lang="ts">
import MahjongTile from '../../../components/MahjongTile.vue'

interface Props {
  tiles: string[]
}

interface Emits {
  (e: 'drag-start', event: DragEvent, tile: string, index: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleDragStart = (event: DragEvent, tile: string, index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tile)
    event.dataTransfer.setData('source', 'fulu-temp')
    event.dataTransfer.setData('index', String(index))
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div class="fulu-drop-temp">
    <span class="temp-label">暂存：</span>
    <div class="temp-tiles">
      <div
        v-for="(tile, idx) in tiles"
        :key="idx"
        class="temp-tile"
        draggable="true"
        @dragstart="(e) => handleDragStart(e, tile, idx)"
      >
        <MahjongTile :tile-id="tile" :width="36" :show-name="false" />
      </div>
    </div>
    <span class="temp-hint">拖入相同牌达到3张成碰，4张成杠</span>
  </div>
</template>

<style scoped>
.fulu-drop-temp {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  background: #fff7e6;
  border-radius: 4px;
  border: 1px dashed #ffa500;
}

.temp-label {
  font-size: 12px;
  color: #ffa500;
}

.temp-tiles {
  display: flex;
  gap: 4px;
}

.temp-tile {
  opacity: 0.7;
}

.temp-hint {
  font-size: 12px;
  color: #909399;
}
</style>
