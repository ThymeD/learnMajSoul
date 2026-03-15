<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tileId: string
  width?: number
  showName?: boolean
  split?: boolean
}>()

const tileWidth = computed(() => props.width || 100)
const tileHeight = computed(() => Math.round(tileWidth.value * 13 / 8))
const borderRadius = computed(() => Math.round(tileWidth.value / 10))

interface TileInfo {
  name: string
  category: string
}

const tileData: Record<string, TileInfo> = {
  w1: { name: '1万', category: 'wan' }, w2: { name: '2万', category: 'wan' },
  w3: { name: '3万', category: 'wan' }, w4: { name: '4万', category: 'wan' },
  w5: { name: '5万', category: 'wan' }, w6: { name: '6万', category: 'wan' },
  w7: { name: '7万', category: 'wan' }, w8: { name: '8万', category: 'wan' },
  w9: { name: '9万', category: 'wan' },
  b1: { name: '1筒', category: 'tong' }, b2: { name: '2筒', category: 'tong' },
  b3: { name: '3筒', category: 'tong' }, b4: { name: '4筒', category: 'tong' },
  b5: { name: '5筒', category: 'tong' }, b6: { name: '6筒', category: 'tong' },
  b7: { name: '7筒', category: 'tong' }, b8: { name: '8筒', category: 'tong' },
  b9: { name: '9筒', category: 'tong' },
  s1: { name: '1条', category: 'tiao' }, s2: { name: '2条', category: 'tiao' },
  s3: { name: '3条', category: 'tiao' }, s4: { name: '4条', category: 'tiao' },
  s5: { name: '5条', category: 'tiao' }, s6: { name: '6条', category: 'tiao' },
  s7: { name: '7条', category: 'tiao' }, s8: { name: '8条', category: 'tiao' },
  s9: { name: '9条', category: 'tiao' },
  d1: { name: '东风', category: 'zi' }, d2: { name: '南风', category: 'zi' },
  d3: { name: '西风', category: 'zi' }, d4: { name: '北风', category: 'zi' },
  z1: { name: '白', category: 'fa' }, z2: { name: '中', category: 'fa' },
  z3: { name: '发', category: 'fa' },
  rw5: { name: '赤五万', category: 'red' }, rb5: { name: '赤五筒', category: 'red' },
  rs5: { name: '赤五索', category: 'red' }, bg: { name: '牌背', category: 'back' }
}

const tileInfo = computed(() => tileData[props.tileId] || { name: '', category: '' })

const imageUrl = computed(() => {
  return new URL(`../assets/mahjong/${props.tileId}.jpg`, import.meta.url).href
})
</script>

<template>
  <div class="mahjong-tile" :style="{ marginRight: props.split ? '24px' : undefined }">
    <img 
      :src="imageUrl" 
      :alt="tileInfo.name" 
      class="tile-image"
      :style="{
        width: tileWidth + 'px',
        height: tileHeight + 'px',
        borderRadius: borderRadius + 'px'
      }"
    />
    <div v-if="props.showName !== false && tileInfo.name" class="tile-name">{{ tileInfo.name }}</div>
  </div>
</template>

<style scoped>
.mahjong-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tile-image {
  border: 1px solid #ebeef5;
}

.tile-name {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}
</style>
