<script setup lang="ts">
import { ref } from 'vue'
import MahjongTile from '../components/MahjongTile.vue'

interface YakuItem {
  id: string
  name: string
  han: number
  tiles: string[]
  desc: string
  condition?: string
}

const yakuList: YakuItem[] = [
  {
    id: 'reach',
    name: '立直',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '听牌后宣言并打出振听棒',
    condition: '门前清限定'
  },
  {
    id: 'ippatsu',
    name: '一发',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '立直后一轮内自摸或荣和',
    condition: '门前清限定'
  },
  {
    id: 'tsumo',
    name: '门前清自摸和',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '门前清状态下自摸和牌',
    condition: '门前清限定'
  },
  {
    id: 'tanyao',
    name: '断幺九',
    han: 1,
    tiles: ['s2', 's3', 's4', 'b5', 'b6', 'b7', 's8'],
    desc: '不含一九字牌的和牌'
  },
  {
    id: 'yakuhai1',
    name: '役牌(白)',
    han: 1,
    tiles: ['z1', 'z1', 'z1', 's2', 's3', 's4', 'z1'],
    desc: '碰或明杠白板'
  },
  {
    id: 'yakuhai2',
    name: '役牌(发)',
    han: 1,
    tiles: ['z3', 'z3', 'z3', 's2', 's3', 's4', 'z3'],
    desc: '碰或明杠发牌'
  },
  {
    id: 'yakuhai3',
    name: '役牌(中)',
    han: 1,
    tiles: ['z2', 'z2', 'z2', 's2', 's3', 's4', 'z2'],
    desc: '碰或明杠中牌'
  },
  {
    id: 'haitei',
    name: '海底捞月',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '海底牌自摸'
  },
  {
    id: 'houtei',
    name: '河底摸鱼',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '河底牌荣和'
  },
  {
    id: 'pinfu',
    name: '平和',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 's4', 's5', 's6', 'b7'],
    desc: '门前清、手牌全顺子、雀头非役牌',
    condition: '门前清限定'
  }
]

const activeId = ref(yakuList[0].id)

const selectYaku = (id: string) => {
  activeId.value = id
}

const scrollToYaku = (id: string) => {
  activeId.value = id
  const el = document.getElementById(`yaku-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
</script>

<template>
  <div class="yaku-page">
    <div class="main-col">
      <div class="sticky-header">
        <h2>役种一览</h2>
        <el-tabs type="border-card" class="yaku-tabs">
          <el-tab-pane label="一番"></el-tab-pane>
        </el-tabs>
      </div>
        <div class="yaku-list">
          <div 
            v-for="yaku in yakuList" 
            :key="yaku.id" 
            :id="`yaku-${yaku.id}`"
            class="yaku-card"
            :class="{ active: activeId === yaku.id }"
            @click="selectYaku(yaku.id)"
          >
            <div class="yaku-top">
              <span class="yaku-name">{{ yaku.name }}</span>
              <el-tag type="warning" size="small">{{ yaku.han }}番</el-tag>
              <span v-if="yaku.condition" class="yaku-condition">{{ yaku.condition }}</span>
            </div>
            <div class="yaku-middle">{{ yaku.desc }}</div>
            <div class="yaku-bottom">
              <MahjongTile 
                v-for="(tile, index) in yaku.tiles" 
                :key="index" 
                :tile-id="tile" 
                :width="80"
              />
            </div>
          </div>
        </div>
    </div>
    <div class="nav-area">
      <el-affix :offset="80">
        <el-card class="nav-card" shadow="never">
          <template #header>
            <span class="nav-title">导航</span>
          </template>
          <div class="nav-list">
            <div 
              v-for="yaku in yakuList" 
              :key="yaku.id"
              class="nav-item"
              :class="{ active: activeId === yaku.id }"
              @click="scrollToYaku(yaku.id)"
            >
              {{ yaku.name }}
            </div>
          </div>
        </el-card>
      </el-affix>
    </div>
  </div>
</template>

<style scoped>
.yaku-page {
  display: flex;
  height: calc(100vh - 64px);
}

.main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-area {
  width: 240px;
  flex-shrink: 0;
}

.yaku-page h2 {
  margin: 0 0 16px;
  color: #303133;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 10;
  padding-bottom: 16px;
  flex-shrink: 0;
}

.yaku-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.yaku-tabs {
  background: #fff;
}

.yaku-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.yaku-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.yaku-card.active {
  background: #fef9e6;
}

.yaku-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  background: #ecf5ff;
  padding: 12px 16px;
  border-radius: 4px;
}

.yaku-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.yaku-condition {
  margin-left: auto;
  font-size: 14px;
  color: #909399;
}

.yaku-middle {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.yaku-bottom {
  display: flex;
  gap: 8px;
}

.nav-card {
  width: 220px;
}

.nav-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.nav-title {
  font-size: 14px;
  font-weight: 500;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 8px 12px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
</style>
