<script setup lang="ts">
import type { Fulu } from '../../../stores/hand'
import MahjongTile from '../../../components/MahjongTile.vue'

interface Props {
  item: Fulu
  canDelete?: boolean
}

interface Emits {
  (e: 'remove'): void
  (e: 'toggle-type'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleKanDblClick() {
  if (props.item.type === 'kan') {
    emit('toggle-type')
  }
}
</script>

<template>
  <div class="fulu-group">
    <el-tooltip
      :disabled="item.type !== 'kan'"
      placement="top"
      :content="item.type === 'kan' ? (item.isOpen === false ? '切换明杠' : '切换暗杠') : ''"
    >
      <div
        class="fulu-tiles"
        :class="{ 'fulu-tiles--kan': item.type === 'kan' }"
        @dblclick="handleKanDblClick"
      >
      <template v-if="item.type === 'kan' && !item.isOpen">
        <!-- 暗杠：两侧牌背，中间两张按 tiles[1]、tiles[2] 原顺序亮牌（与明杠切换后顺序一致） -->
        <div class="fulu-tile-wrapper kan-back">
          <MahjongTile :tile-id="item.tiles[0]" :width="40" :show-name="false" :is-back="true" />
        </div>
        <div class="fulu-tile-wrapper">
          <MahjongTile :tile-id="item.tiles[1]" :width="40" :show-name="false" />
        </div>
        <div class="fulu-tile-wrapper">
          <MahjongTile :tile-id="item.tiles[2]" :width="40" :show-name="false" />
        </div>
        <div class="fulu-tile-wrapper kan-back">
          <MahjongTile :tile-id="item.tiles[3]" :width="40" :show-name="false" :is-back="true" />
        </div>
      </template>
      <template v-else>
        <!-- 碰/明杠：正常显示 -->
        <div v-for="(tile, tileIdx) in item.tiles" :key="tileIdx" class="fulu-tile-wrapper">
          <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
        </div>
      </template>
      </div>
    </el-tooltip>
    <el-button v-if="canDelete" size="small" type="danger" link @click="emit('remove')">
      删除
    </el-button>
  </div>
</template>

<style scoped>
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
  gap: 4px;
}

.fulu-tiles--kan {
  cursor: pointer;
}

.fulu-tile-wrapper {
  display: flex;
  align-items: center;
}

.fulu-tile-wrapper.kan-back {
  /* 去掉负边距，让间距与碰的牌一致 */
}
</style>
