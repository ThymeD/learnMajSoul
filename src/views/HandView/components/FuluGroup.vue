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

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="fulu-group">
    <div class="fulu-tiles">
      <template v-if="item.type === 'kan' && !item.isOpen">
        <!-- 暗杠：牌背在两边两张 -->
        <div class="fulu-tile-wrapper kan-back">
          <MahjongTile :tile-id="item.tiles[0]" :width="40" :show-name="false" :is-back="true" />
        </div>
        <div class="fulu-tile-wrapper">
          <MahjongTile :tile-id="item.tiles[0]" :width="40" :show-name="false" />
        </div>
        <div class="fulu-tile-wrapper">
          <MahjongTile :tile-id="item.tiles[0]" :width="40" :show-name="false" />
        </div>
        <div class="fulu-tile-wrapper kan-back">
          <MahjongTile :tile-id="item.tiles[0]" :width="40" :show-name="false" :is-back="true" />
        </div>
      </template>
      <template v-else>
        <!-- 碰/明杠：正常显示 -->
        <div v-for="(tile, tileIdx) in item.tiles" :key="tileIdx" class="fulu-tile-wrapper">
          <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
        </div>
      </template>
    </div>
    <el-button
      v-if="item.type === 'kan'"
      size="small"
      type="warning"
      link
      @click="emit('toggle-type')"
    >
      {{ item.isOpen === false ? '明杠' : '暗杠' }}
    </el-button>
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
}

.fulu-tile-wrapper {
  display: flex;
  align-items: center;
}

.fulu-tile-wrapper.kan-back {
  /* 去掉负边距，让间距与碰的牌一致 */
}
</style>
