<script setup lang="ts">
import MahjongTile from './MahjongTile.vue'

interface Props {
  tiles: string[]
}

interface Emits {
  (e: 'remove', index: number): void
  (e: 'recover', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 双击移除
const handleDoubleClick = (index: number) => {
  emit('remove', index)
}

// 点击回收到手牌
const handleClick = (index: number) => {
  emit('recover', index)
}
</script>

<template>
  <div class="river-panel">
    <div v-if="tiles.length === 0" class="river-placeholder">拖入牌到这里</div>
    <div v-else class="river-tiles">
      <div
        v-for="(tile, index) in tiles"
        :key="`${tile}-${index}`"
        class="river-tile"
        @dblclick="handleDoubleClick(index)"
        @click="handleClick(index)"
      >
        <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
        <div class="tile-remove" @click.stop="handleDoubleClick(index)">×</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.river-panel {
  min-height: 60px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 2px dashed transparent;
  transition: all 0.2s ease;
}

.river-panel:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.river-placeholder {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}

.river-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.river-tile {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.river-tile:hover {
  transform: translateY(-4px);
}

.river-tile:hover .tile-remove {
  opacity: 1;
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
</style>
