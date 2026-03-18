<script setup lang="ts">
import MahjongTile from '../../../components/MahjongTile.vue'

interface Props {
  tile: string | null
  disabled?: boolean
}

interface Emits {
  (e: 'click'): void
  (e: 'dblclick'): void
  (e: 'drag-start', event: DragEvent): void
  (e: 'drop', event: DragEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  tile: null,
  disabled: false
})

const emit = defineEmits<Emits>()

const handleDragStart = (event: DragEvent) => {
  if (props.tile) {
    emit('drag-start', event)
  }
}
</script>

<template>
  <div
    class="draw-tile-zone"
    :class="{ 'has-draw': !!tile, 'is-disabled': disabled }"
    @click="emit('click')"
    @dblclick="emit('dblclick')"
    @dragover.prevent
    @drop="emit('drop', $event)"
  >
    <div v-if="tile" class="draw-tile" draggable="true" @dragstart="handleDragStart">
      <MahjongTile :tile-id="tile" :width="60" :show-name="false" />
    </div>
    <div v-else class="draw-placeholder">拖入摸牌</div>
  </div>
</template>

<style scoped>
.draw-tile-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 90px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
  cursor: pointer;
}

.draw-tile-zone:hover:not(.is-disabled) {
  border-color: #409eff;
  background: #ecf5ff;
}

.draw-tile-zone.has-draw {
  border-style: solid;
  border-color: #409eff;
  background: #fff;
}

.draw-tile-zone.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.draw-placeholder {
  color: #909399;
  font-size: 14px;
}

.draw-tile {
  cursor: grab;
}
</style>
