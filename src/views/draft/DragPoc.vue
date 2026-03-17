<script setup lang="ts">
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

// 素材区：4张 1万
const sourceTiles = ref<string[]>(['w1', 'w1', 'w1', 'w1'])

// 区域A
const areaA = ref<string[]>([])

// 区域B
const areaB = ref<string[]>([])

// 区域C
const areaC = ref<string[]>([])

const getTileName = (tile: string) => {
  const map: Record<string, string> = {
    w1: '1万',
    w2: '2万',
    w3: '3万',
    w4: '4万',
    w5: '5万',
    w6: '6万',
    w7: '7万',
    w8: '8万',
    w9: '9万',
    b1: '1筒',
    b2: '2筒',
    b3: '3筒',
    b4: '4筒',
    b5: '5筒',
    b6: '6筒',
    b7: '7筒',
    b8: '8筒',
    b9: '9筒',
    s1: '1索',
    s2: '2索',
    s3: '3索',
    s4: '4索',
    s5: '5索',
    s6: '6索',
    s7: '7索',
    s8: '8索',
    s9: '9索',
    d1: '东风',
    d2: '南风',
    d3: '西风',
    d4: '北风',
    z1: '白',
    z2: '中',
    z3: '发'
  }
  return map[tile] || tile
}
</script>

<template>
  <div class="drag-poc">
    <h2>拖拽 POC 验证</h2>
    <p>使用 vue-draggable-plus 实现 3 区域拖拽</p>

    <div class="drag-container">
      <!-- 素材区 -->
      <div class="zone source-zone">
        <h3>素材区</h3>
        <VueDraggable v-model="sourceTiles" group="tiles" :animation="200" class="tile-list">
          <div v-for="tile in sourceTiles" :key="tile" class="tile-item">
            {{ getTileName(tile) }}
          </div>
        </VueDraggable>
      </div>

      <!-- 区域A -->
      <div class="zone area-a">
        <h3>区域A</h3>
        <VueDraggable v-model="areaA" group="tiles" :animation="200" class="tile-list">
          <div v-for="tile in areaA" :key="tile" class="tile-item">
            {{ getTileName(tile) }}
          </div>
        </VueDraggable>
      </div>
    </div>

    <div class="drag-container">
      <!-- 区域B -->
      <div class="zone area-b">
        <h3>区域B</h3>
        <VueDraggable v-model="areaB" group="tiles" :animation="200" class="tile-list">
          <div v-for="tile in areaB" :key="tile" class="tile-item">
            {{ getTileName(tile) }}
          </div>
        </VueDraggable>
      </div>

      <!-- 区域C -->
      <div class="zone area-c">
        <h3>区域C</h3>
        <VueDraggable v-model="areaC" group="tiles" :animation="200" class="tile-list">
          <div v-for="tile in areaC" :key="tile" class="tile-item">
            {{ getTileName(tile) }}
          </div>
        </VueDraggable>
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
  margin-bottom: 30px;
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
  width: 60px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: move;
  user-select: none;
}

.tile-item:hover {
  transform: scale(1.05);
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
