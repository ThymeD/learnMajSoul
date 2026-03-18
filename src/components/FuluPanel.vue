<script setup lang="ts">
import { computed } from 'vue'
import MahjongTile from './MahjongTile.vue'
import type { Fulu } from '../stores/hand'

interface Props {
  fuluList: Fulu[]
  tempTiles: string[]
  disabled?: boolean
}

interface Emits {
  (e: 'remove', index: number): void
  (e: 'toggle-type', index: number): void
  (e: 'temp-remove', index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  fuluList: () => [],
  tempTiles: () => [],
  disabled: false
})

const emit = defineEmits<Emits>()

// 暂存区牌是否可以成组
const canFormGroup = computed(() => {
  if (props.tempTiles.length < 3) return false

  // 检查是否有3张或4张相同的牌
  const counts: Record<string, number> = {}
  for (const tile of props.tempTiles) {
    counts[tile] = (counts[tile] || 0) + 1
  }

  for (const count of Object.values(counts)) {
    if (count >= 3) return true
  }

  return false
})

// 处理删除副露组
const handleRemove = (index: number) => {
  emit('remove', index)
}

// 处理明杠/暗杠切换
const handleToggleType = (index: number) => {
  emit('toggle-type', index)
}

// 处理从暂存区移除牌
const handleTempRemove = (index: number) => {
  emit('temp-remove', index)
}
</script>

<template>
  <div class="fulu-panel" :class="{ 'is-disabled': disabled }">
    <!-- 副露组列表 -->
    <div class="fulu-groups">
      <div v-for="(item, idx) in fuluList" :key="idx" class="fulu-group">
        <div class="fulu-tiles">
          <template v-if="item.type === 'kan' && item.isOpen === false">
            <!-- 暗杠：牌背在中间 -->
            <div class="fulu-tile-wrapper">
              <MahjongTile :tile-id="item.tiles[0]" :width="40" :show-name="false" />
            </div>
            <div class="fulu-tile-wrapper kan-back">
              <MahjongTile
                :tile-id="item.tiles[0]"
                :width="40"
                :show-name="false"
                :is-back="true"
              />
            </div>
            <div class="fulu-tile-wrapper kan-back">
              <MahjongTile
                :tile-id="item.tiles[0]"
                :width="40"
                :show-name="false"
                :is-back="true"
              />
            </div>
            <div class="fulu-tile-wrapper">
              <MahjongTile :tile-id="item.tiles[3]" :width="40" :show-name="false" />
            </div>
          </template>
          <template v-else-if="item.type === 'kan' && item.isOpen === true">
            <!-- 明杠：正常显示 -->
            <div v-for="(tile, tileIdx) in item.tiles" :key="tileIdx" class="fulu-tile-wrapper">
              <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
            </div>
          </template>
          <template v-else>
            <!-- 吃/碰：正常显示 -->
            <div v-for="(tile, tileIdx) in item.tiles" :key="tileIdx" class="fulu-tile-wrapper">
              <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
            </div>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div class="fulu-actions">
          <!-- 明杠/暗杠切换按钮 -->
          <el-button
            v-if="item.type === 'kan'"
            size="small"
            type="warning"
            link
            @click="handleToggleType(idx)"
          >
            {{ item.isOpen === false ? '明杠' : '暗杠' }}
          </el-button>
          <!-- 删除按钮 -->
          <el-button v-if="!disabled" size="small" type="danger" link @click="handleRemove(idx)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 暂存区 -->
    <div v-if="tempTiles.length > 0" class="fulu-temp">
      <span class="temp-label">暂存：</span>
      <div class="temp-tiles">
        <div
          v-for="(tile, idx) in tempTiles"
          :key="idx"
          class="temp-tile"
          @click="handleTempRemove(idx)"
        >
          <MahjongTile :tile-id="tile" :width="36" :show-name="false" />
        </div>
      </div>
      <span class="temp-hint">
        {{ canFormGroup ? '可成组' : '拖入相同牌达到3张成碰，4张成杠' }}
      </span>
    </div>

    <!-- 空状态 -->
    <div v-if="fuluList.length === 0 && tempTiles.length === 0" class="fulu-empty">
      暂无副露，拖入3张相同牌成碰，4张成杠
    </div>
  </div>
</template>

<style scoped>
.fulu-panel {
  min-height: 60px;
  padding: 12px;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.2s;
}

.fulu-panel.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.fulu-panel:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.fulu-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.fulu-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.fulu-tiles {
  display: flex;
  gap: 2px;
}

.fulu-tile-wrapper {
  display: flex;
  align-items: center;
}

.fulu-tile-wrapper.kan-back {
  margin: 0 -5px;
  z-index: 1;
}

.fulu-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fulu-temp {
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
  cursor: pointer;
}

.temp-tile:hover {
  opacity: 1;
}

.temp-hint {
  font-size: 12px;
  color: #909399;
}

.fulu-empty {
  color: #909399;
  font-size: 14px;
  padding: 20px;
  text-align: center;
}
</style>
