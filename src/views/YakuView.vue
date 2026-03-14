<script setup lang="ts">
import MahjongTile from '../components/MahjongTile.vue'

interface YakuItem {
  id: string
  name: string
  kana: string
  han: number
  tiles: string[]
  desc: string
}

const yakuList: YakuItem[] = [
  {
    id: 'reach',
    name: '立直',
    kana: 'リーチ',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '听牌后宣言并打出振听棒'
  },
  {
    id: 'ippatsu',
    name: '一发',
    kana: '一発',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '立直后一轮内自摸或荣和'
  },
  {
    id: 'tsumo',
    name: '门前清自摸和',
    kana: 'メンゼンツモ',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '门前清状态下自摸和牌'
  },
  {
    id: 'tanyao',
    name: '断幺九',
    kana: 'タンヤオチュー',
    han: 1,
    tiles: ['s2', 's3', 's4', 'b5', 'b6', 'b7', 's8'],
    desc: '不含一九字牌的和牌'
  },
  {
    id: 'yakuhai1',
    name: '役牌(白)',
    kana: '役牌(白)',
    han: 1,
    tiles: ['z1', 'z1', 'z1', 's2', 's3', 's4', 'z1'],
    desc: '碰或明杠白板'
  },
  {
    id: 'yakuhai2',
    name: '役牌(发)',
    kana: '役牌(発)',
    han: 1,
    tiles: ['z3', 'z3', 'z3', 's2', 's3', 's4', 'z3'],
    desc: '碰或明杠发牌'
  },
  {
    id: 'yakuhai3',
    name: '役牌(中)',
    kana: '役牌(中)',
    han: 1,
    tiles: ['z2', 'z2', 'z2', 's2', 's3', 's4', 'z2'],
    desc: '碰或明杠中牌'
  },
  {
    id: 'haitei',
    name: '海底捞月',
    kana: 'ハイテイ',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '海底牌自摸'
  },
  {
    id: 'houtei',
    name: '河底摸鱼',
    kana: 'ホウテイ',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'],
    desc: '河底牌荣和'
  },
  {
    id: 'pinfu',
    name: '平和',
    kana: 'ピンフ',
    han: 1,
    tiles: ['w1', 'w2', 'w3', 's4', 's5', 's6', 'b7'],
    desc: '门前清、手牌全顺子、雀头非役牌'
  }
]
</script>

<template>
  <div class="yaku-page">
    <h2>役种一览</h2>
    <el-tabs type="border-card">
      <el-tab-pane label="一番">
        <div class="yaku-list">
          <div v-for="yaku in yakuList" :key="yaku.id" class="yaku-row">
            <div class="yaku-info">
              <span class="yaku-name">{{ yaku.name }}</span>
              <span class="yaku-kana">{{ yaku.kana }}</span>
              <el-tag type="warning" size="small">{{ yaku.han }}番</el-tag>
            </div>
            <div class="yaku-tiles">
              <MahjongTile 
                v-for="(tile, index) in yaku.tiles" 
                :key="index" 
                :tile-id="tile" 
                :width="40"
              />
            </div>
            <div class="yaku-desc">{{ yaku.desc }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.yaku-page h2 {
  margin-bottom: 24px;
  color: #303133;
}

.yaku-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.yaku-row {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.yaku-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 180px;
  flex-shrink: 0;
}

.yaku-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.yaku-kana {
  font-size: 12px;
  color: #909399;
}

.yaku-tiles {
  display: flex;
  gap: 4px;
  flex: 1;
}

.yaku-desc {
  width: 200px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  text-align: right;
  flex-shrink: 0;
}
</style>
