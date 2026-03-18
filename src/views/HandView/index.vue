<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import TileSelector from '../../components/TileSelector.vue'
import MahjongTile from '../../components/MahjongTile.vue'
import { useHandStore, type Wind } from '../../stores/hand'

import HandTiles from './components/HandTiles.vue'
import DrawTile from './components/DrawTile.vue'
import FuluGroup from './components/FuluGroup.vue'
import FuluTemp from './components/FuluTemp.vue'
import FuluButtons from './components/FuluButtons.vue'

// Store
const store = useHandStore()

// 本地状态（用于双向绑定）
const localTiles = ref<string[]>([])
const localDrawTile = ref<string | null>(null)
const isRiverDragOver = ref(false)
const tileSearchText = ref('')

// 风牌选项
const windOptions = [
  { value: 'd1', label: '东' },
  { value: 'd2', label: '南' },
  { value: 'd3', label: '西' },
  { value: 'd4', label: '北' }
]

// 同步 store 状态到本地
watch(
  () => store.tiles,
  (newTiles) => {
    localTiles.value = [...newTiles]
  },
  { immediate: true, deep: true }
)

watch(
  () => store.drawTile,
  (newDraw) => {
    localDrawTile.value = newDraw
  },
  { immediate: true }
)

// 听牌位置映射
const tingCountMap = computed(() => {
  if (!store.analysis?.tingPai) return {}
  const map: Record<string, number> = {}
  store.analysis.tingPai.forEach((tile) => {
    map[tile] = (map[tile] || 0) + 1
  })
  return map
})

// 是否有听牌
const hasTing = computed(() => {
  return store.analysis?.isTing || (store.analysis?.tingPai?.length ?? 0) > 0
})

// 处理牌添加（从素材选择区拖入或点击）
const handleTileAdd = (tile: string) => {
  if (localTiles.value.length >= 13) {
    ElMessage.warning('手牌已满')
    return
  }
  store.addTile(tile)
}

// 从各区域移除牌（拖回素材选择区）
const handleTileRemoveFromArea = (
  tile: string,
  source: 'hand' | 'river' | 'fulu' | 'draw' | 'fulu-temp'
) => {
  if (source === 'hand') {
    const idx = localTiles.value.indexOf(tile)
    if (idx !== -1) {
      localTiles.value.splice(idx, 1)
      store.tiles = [...localTiles.value]
      ElMessage.success('已从手牌移除')
    }
  } else if (source === 'draw') {
    if (localDrawTile.value === tile) {
      store.setDrawTile(null)
      localDrawTile.value = null
      ElMessage.success('已从摸牌区移除')
    }
  } else if (source === 'fulu-temp') {
    const idx = fuluDropTiles.value.indexOf(tile)
    if (idx !== -1) {
      fuluDropTiles.value.splice(idx, 1)
      ElMessage.success('已从副露暂存区移除')
    }
  } else if (source === 'river') {
    const idx = store.river.indexOf(tile)
    if (idx !== -1) {
      store.river.splice(idx, 1)
      ElMessage.success('已从牌河移除')
    }
  } else if (source === 'fulu') {
    for (let i = store.fulu.length - 1; i >= 0; i--) {
      if (store.fulu[i].tiles.includes(tile)) {
        handleRemoveFulu(i)
        ElMessage.success('已从副露移除')
        break
      }
    }
  }
}

// 处理牌移除 - 双击移除时触发素材区数量更新
const handleTileRemove = (tile: string, _index: number) => {
  handleTileRemoveFromArea(tile, 'hand')
}

// 手牌区拖入处理
const handleHandDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'hand') return

  if (source === 'source') {
    handleTileAdd(tileId)
  } else if (source === 'draw') {
    if (localDrawTile.value === tileId) {
      store.setDrawTile(null)
      localDrawTile.value = null
    }
    handleTileAdd(tileId)
  } else if (source === 'river') {
    const idx = store.river.indexOf(tileId)
    if (idx !== -1) {
      store.river.splice(idx, 1)
      store.tiles.push(tileId)
      store.tiles = [...store.tiles]
      localTiles.value = [...store.tiles]
    }
  } else if (source === 'fulu-temp') {
    const tempIdx = fuluDropTiles.value.indexOf(tileId)
    if (tempIdx !== -1) {
      fuluDropTiles.value.splice(tempIdx, 1)
    }
    handleTileAdd(tileId)
  }
}

// 手牌区拖拽开始
const handleHandTileDragStart = (event: DragEvent, tile: string, _index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tile)
    event.dataTransfer.setData('source', 'hand')
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 摸牌区拖入处理
const handleDrawTileDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (tileId) {
    if (source === 'hand') {
      const idx = localTiles.value.indexOf(tileId)
      if (idx !== -1) {
        localTiles.value.splice(idx, 1)
        store.tiles = [...localTiles.value]
      }
    } else if (source === 'fulu-temp') {
      const idx = fuluDropTiles.value.indexOf(tileId)
      if (idx !== -1) {
        fuluDropTiles.value.splice(idx, 1)
      }
    }
    handleSetDrawTile(tileId)
  }
}

// 摸牌区拖拽开始
const handleDrawTileDragStart = (event: DragEvent) => {
  if (event.dataTransfer && localDrawTile.value) {
    event.dataTransfer.setData('text/plain', localDrawTile.value)
    event.dataTransfer.setData('source', 'draw')
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 处理设置摸牌
const handleSetDrawTile = (tile: string) => {
  if (localDrawTile.value) {
    store.addTile(localDrawTile.value)
  }
  store.setDrawTile(tile)
  localDrawTile.value = tile
}

// 处理摸牌点击（点击摸牌将其加入手牌）
const handleDrawTileClick = () => {
  if (localDrawTile.value) {
    store.addTile(localDrawTile.value)
    store.setDrawTile(null)
    localDrawTile.value = null
  }
}

// 处理摸牌双击移除
const handleDrawTileDblClick = () => {
  if (localDrawTile.value) {
    const tile = localDrawTile.value
    store.setDrawTile(null)
    localDrawTile.value = null
    handleTileRemoveFromArea(tile, 'draw')
    ElMessage.success('已从摸牌区移除')
  }
}

// 清空
const handleClear = () => {
  store.clear()
  localTiles.value = []
  localDrawTile.value = null
  fuluDropTiles.value = []
}

// 随机生成
const handleRandom = () => {
  store.randomHand(true, true)
}

// 分析
const handleAnalyze = () => {
  store.analyze()
}

// 切换立直
const handleLiqiChange = (val: boolean) => {
  store.setLiqi(val)
}

// 切换庄家
const handleDealerChange = (val: boolean) => {
  store.setDealer(val)
}

// 切换自风
const handleSelfWindChange = (val: Wind) => {
  store.setSelfWind(val)
}

// 切换场风
const handleFieldWindChange = (val: Wind) => {
  store.setFieldWind(val)
}

// 选中的牌列表
const selectedTiles = computed(() => {
  return [...localTiles.value, localDrawTile.value].filter(Boolean) as string[]
})

// 已使用的牌列表
const usedTiles = computed(() => {
  const used: string[] = [...localTiles.value]
  if (localDrawTile.value) used.push(localDrawTile.value)
  used.push(...store.river)
  for (const fulu of store.fulu) {
    used.push(...fulu.tiles)
  }
  used.push(...fuluDropTiles.value)
  return used
})

// ==================== 副露操作相关 ====================

type FuluMode = 'none' | 'chi' | 'pon' | 'kan'

const fuluMode = ref<FuluMode>('none')

const chiCombinations = computed(() => {
  if (!localDrawTile.value) return store.getChiCombinations()
  return store.getChiCombinations(localDrawTile.value)
})

const ponCombinations = computed(() => store.getPonCombinations())

const kanCombinations = computed(() => store.getKanCombinations())

const canFulu = computed(() => !store.isLiqi)

const liqiDisabled = computed(() => store.fulu.length > 0)

const handleEnterChiMode = () => {
  if (!canFulu.value) return
  fuluMode.value = 'chi'
}

const handleEnterPonMode = () => {
  if (!canFulu.value) return
  fuluMode.value = 'pon'
}

const handleEnterKanMode = () => {
  if (!canFulu.value) return
  fuluMode.value = 'kan'
}

const handleCancelFuluMode = () => {
  fuluMode.value = 'none'
}

const handleChi = (tiles: string[]) => {
  const counts: Record<string, number> = {}
  for (const t of tiles) {
    counts[t] = (counts[t] || 0) + 1
  }

  for (const [tile, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      const idx = localTiles.value.indexOf(tile)
      if (idx !== -1) {
        localTiles.value.splice(idx, 1)
      }
    }
  }

  store.addFulu({
    type: 'chi',
    tiles: tiles
  })

  store.tiles = [...localTiles.value]
  fuluMode.value = 'none'
  ElMessage.success('吃牌成功')
}

const handlePon = (tile: string) => {
  let removed = 0
  for (let i = localTiles.value.length - 1; i >= 0; i--) {
    if (localTiles.value[i] === tile && removed < 3) {
      localTiles.value.splice(i, 1)
      removed++
    }
  }

  store.addFulu({
    type: 'pon',
    tiles: [tile, tile, tile]
  })

  store.tiles = [...localTiles.value]
  fuluMode.value = 'none'
  ElMessage.success('碰牌成功')
}

const handleKan = (tile: string) => {
  let removed = 0
  for (let i = localTiles.value.length - 1; i >= 0; i--) {
    if (localTiles.value[i] === tile && removed < 4) {
      localTiles.value.splice(i, 1)
      removed++
    }
  }

  store.addFulu({
    type: 'kan',
    tiles: [tile, tile, tile, tile]
  })

  store.tiles = [...localTiles.value]
  fuluMode.value = 'none'
  ElMessage.success('杠牌成功')
}

const handleRemoveFulu = (index: number) => {
  store.removeFulu(index)
  localTiles.value = [...store.tiles]
}

const handleToggleFuluType = (index: number) => {
  store.toggleFuluType(index)
}

// 副露数据（用于原生 drag/drop 接收拖入）
const fuluDropTiles = ref<string[]>([])

const checkChiInTemp = (newTile: string): string[] | null => {
  const tempTiles = [...fuluDropTiles.value, newTile]

  const getTileNumber = (tile: string): number | null => {
    const match = tile.match(/^([wbsr])(\d+)$/)
    if (!match) return null
    return parseInt(match[2], 10)
  }

  const getTileSuit = (tile: string): string | null => {
    const match = tile.match(/^([wbsr])\d+$/)
    if (!match) return null
    return match[1]
  }

  const suit = getTileSuit(newTile)
  const num = getTileNumber(newTile)

  if (!suit || !num || suit === 'r') return null

  const candidates = [
    [newTile, `${suit}${num + 1}`, `${suit}${num + 2}`],
    [`${suit}${num - 1}`, newTile, `${suit}${num + 1}`],
    [`${suit}${num - 2}`, `${suit}${num - 1}`, newTile]
  ]

  for (const combo of candidates) {
    const hasAll = combo.every((t) => {
      const tileNum = getTileNumber(t)
      return tileNum && tileNum >= 1 && tileNum <= 9 && tempTiles.includes(t)
    })

    if (hasAll) {
      return combo
    }
  }

  return null
}

const handleFuluDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'fulu') return

  const chiCombo = checkChiInTemp(tileId)

  if (chiCombo) {
    if (source === 'draw') {
      store.setDrawTile(null)
      localDrawTile.value = null
    } else {
      const handIdx = localTiles.value.indexOf(tileId)
      if (handIdx !== -1) {
        localTiles.value.splice(handIdx, 1)
        store.tiles = [...localTiles.value]
      }
    }

    store.addFulu({
      type: 'chi',
      tiles: chiCombo
    })

    for (const t of chiCombo) {
      const idx = fuluDropTiles.value.indexOf(t)
      if (idx !== -1) {
        fuluDropTiles.value.splice(idx, 1)
      }
    }

    ElMessage.success('吃牌成功')
    return
  }

  const existingPonIndex = store.fulu.findIndex((f) => f.type === 'pon' && f.tiles[0] === tileId)

  if (existingPonIndex !== -1) {
    if (source === 'draw') {
      store.setDrawTile(null)
      localDrawTile.value = null
    }

    store.removeFulu(existingPonIndex)
    store.addFulu({
      type: 'kan',
      tiles: [tileId, tileId, tileId, tileId],
      isOpen: true
    })
    ElMessage.success('明杠成功')
    return
  }

  if (source === 'draw') {
    store.setDrawTile(null)
    localDrawTile.value = null
  } else {
    const handIdx = localTiles.value.indexOf(tileId)
    if (handIdx !== -1) {
      localTiles.value.splice(handIdx, 1)
      store.tiles = [...localTiles.value]
    }
  }

  fuluDropTiles.value.push(tileId)

  const sameTiles = fuluDropTiles.value.filter((t) => t === tileId)

  if (sameTiles.length === 4) {
    store.addFulu({
      type: 'kan',
      tiles: [tileId, tileId, tileId, tileId],
      isOpen: false
    })
    fuluDropTiles.value = fuluDropTiles.value.filter((t) => t !== tileId)
    ElMessage.success('暗杠成功')
  } else if (sameTiles.length === 3) {
    store.addFulu({
      type: 'pon',
      tiles: [tileId, tileId, tileId]
    })
    fuluDropTiles.value = fuluDropTiles.value.filter((t) => t !== tileId)
    ElMessage.success('碰牌成功')
  }
}

// ==================== 牌河相关 ====================

const handleRiverRecover = (index: number) => {
  const tile = store.river[index]
  if (tile) {
    store.removeFromRiver(index)
    handleTileRemoveFromArea(tile, 'river')
    localTiles.value = [...store.tiles]
  }
}

const handleRiverTileDblClick = (tile: string) => {
  const idx = store.river.indexOf(tile)
  if (idx !== -1) {
    store.river.splice(idx, 1)
    handleTileRemoveFromArea(tile, 'river')
    ElMessage.success('已从牌河移除')
  }
}

const handleRiverDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isRiverDragOver.value = false

  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'river') return

  if (source === 'hand') {
    store.river.push(tileId)
    const idx = localTiles.value.indexOf(tileId)
    if (idx !== -1) {
      localTiles.value.splice(idx, 1)
      store.tiles = [...localTiles.value]
    }
  } else if (source === 'draw') {
    if (localDrawTile.value === tileId) {
      store.setDrawTile(null)
      localDrawTile.value = null
      store.river.push(tileId)
    }
  } else if (source === 'fulu-temp') {
    const tempIdx = fuluDropTiles.value.indexOf(tileId)
    if (tempIdx !== -1) {
      fuluDropTiles.value.splice(tempIdx, 1)
      store.river.push(tileId)
    }
  } else if (source === 'source') {
    store.river.push(tileId)
  }
}

const handleRiverTileDragStart = (event: DragEvent, tile: string, _index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tile)
    event.dataTransfer.setData('source', 'river')
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div class="hand-view">
    <div class="hand-header">
      <h2>手牌分析</h2>
    </div>

    <div class="main-content">
      <!-- 左侧：素材选择区 -->
      <div class="left-panel">
        <el-card shadow="hover">
          <template #header>
            <div class="tile-selector-header">
              <span class="panel-title">素材选择区</span>
              <el-input
                v-model="tileSearchText"
                placeholder="搜索牌型"
                :prefix-icon="Search"
                clearable
                style="width: 180px"
              />
            </div>
          </template>
          <TileSelector
            :selected-tiles="selectedTiles"
            :used-tiles="usedTiles"
            :max-count="4"
            :search-text="tileSearchText"
            @select="handleTileAdd"
            @remove="handleTileRemoveFromArea"
          />
        </el-card>
      </div>

      <!-- 右侧：手牌展示区 -->
      <div class="right-panel">
        <!-- 役种设置 -->
        <el-card shadow="hover" class="settings-card">
          <template #header>
            <div class="settings-header-row">
              <span class="panel-title">役种设置</span>
              <div class="setting-item">
                <el-checkbox
                  :model-value="store.isLiqi"
                  :disabled="!store.canLiqi || liqiDisabled"
                  @change="handleLiqiChange"
                >
                  立直
                </el-checkbox>
              </div>
              <div class="setting-item">
                <el-checkbox :model-value="store.dealer" @change="handleDealerChange">
                  庄家
                </el-checkbox>
              </div>
              <div class="setting-item">
                <span class="setting-label">自风：</span>
                <el-select
                  :model-value="store.selfWind"
                  size="small"
                  style="width: 100px"
                  @change="handleSelfWindChange"
                >
                  <el-option
                    v-for="wind in windOptions"
                    :key="wind.value"
                    :label="wind.label"
                    :value="wind.value"
                  />
                </el-select>
              </div>
              <div class="setting-item">
                <span class="setting-label">场风：</span>
                <el-select
                  :model-value="store.fieldWind"
                  size="small"
                  style="width: 100px"
                  @change="handleFieldWindChange"
                >
                  <el-option
                    v-for="wind in windOptions"
                    :key="wind.value"
                    :label="wind.label"
                    :value="wind.value"
                  />
                </el-select>
              </div>
              <div class="setting-actions">
                <span class="panel-title">操作</span>
                <el-button size="small" @click="handleClear">清空</el-button>
                <el-button size="small" type="primary" @click="handleRandom">随机生成</el-button>
                <el-button size="small" type="success" @click="handleAnalyze">分析</el-button>
              </div>
            </div>
          </template>
        </el-card>

        <!-- 副露区 -->
        <el-card shadow="hover" class="fulu-card">
          <template #header>
            <div class="fulu-header">
              <span class="panel-title">副露区</span>
              <FuluButtons
                :mode="fuluMode"
                :can-fulu="canFulu"
                :chi-count="chiCombinations.length"
                :pon-count="ponCombinations.length"
                :kan-count="kanCombinations.length"
                @enter-chi="handleEnterChiMode"
                @enter-pon="handleEnterPonMode"
                @enter-kan="handleEnterKanMode"
                @cancel="handleCancelFuluMode"
              />
            </div>
          </template>

          <!-- 副露模式提示 -->
          <div v-if="fuluMode !== 'none'" class="fulu-mode-tip">
            <span v-if="fuluMode === 'chi'">请选择要吃的顺子组合：</span>
            <span v-if="fuluMode === 'pon'">请选择要碰的牌：</span>
            <span v-if="fuluMode === 'kan'">请选择要杠的牌：</span>
          </div>

          <!-- 副露操作选项 -->
          <div v-if="fuluMode === 'chi'" class="fulu-options">
            <div
              v-for="(combo, idx) in chiCombinations"
              :key="idx"
              class="fulu-option"
              @click="handleChi(combo.tiles)"
            >
              <span class="fulu-type">{{ combo.type }}</span>
              <div class="fulu-tiles">
                <MahjongTile
                  v-for="tile in combo.tiles"
                  :key="tile"
                  :tile-id="tile"
                  :width="40"
                  :show-name="false"
                />
              </div>
            </div>
          </div>

          <div v-if="fuluMode === 'pon'" class="fulu-options">
            <div
              v-for="combo in ponCombinations"
              :key="combo.tile"
              class="fulu-option"
              @click="handlePon(combo.tile)"
            >
              <span class="fulu-type">碰 {{ combo.tile }}</span>
              <div class="fulu-tiles">
                <MahjongTile
                  v-for="i in 3"
                  :key="i"
                  :tile-id="combo.tile"
                  :width="40"
                  :show-name="false"
                />
              </div>
            </div>
          </div>

          <div v-if="fuluMode === 'kan'" class="fulu-options">
            <div
              v-for="combo in kanCombinations"
              :key="combo.tile"
              class="fulu-option"
              @click="handleKan(combo.tile)"
            >
              <span class="fulu-type">杠 {{ combo.tile }}</span>
              <div class="fulu-tiles">
                <MahjongTile
                  v-for="i in 4"
                  :key="i"
                  :tile-id="combo.tile"
                  :width="40"
                  :show-name="false"
                />
              </div>
            </div>
          </div>

          <!-- 副露列表 -->
          <div class="fulu-container" @dragover.prevent @drop="handleFuluDrop">
            <div class="fulu-groups">
              <FuluGroup
                v-for="(item, idx) in store.fulu"
                :key="idx"
                :item="item"
                :can-delete="!store.isLiqi"
                @remove="handleRemoveFulu(idx)"
                @toggle-type="handleToggleFuluType(idx)"
              />
            </div>

            <FuluTemp v-if="fuluDropTiles.length > 0" :tiles="fuluDropTiles" />

            <div v-if="store.fulu.length === 0 && fuluDropTiles.length === 0" class="fulu-empty">
              暂无副露，拖入3张相同牌成碰，4张成杠
            </div>
          </div>
        </el-card>

        <!-- 手牌区 -->
        <el-card shadow="hover" class="hand-card">
          <template #header>
            <span class="panel-title">
              手牌区
              <span class="tile-count">({{ store.tileCount }}/13)</span>
            </span>
          </template>

          <div class="hand-area-container">
            <!-- 手牌区 -->
            <div class="hand-card-section">
              <div class="section-label">手牌</div>
              <HandTiles
                :tiles="localTiles"
                :ting-pai="store.analysis?.tingPai || []"
                @tile-remove="handleTileRemove"
                @tile-drag-start="handleHandTileDragStart"
                @dragover.prevent
                @drop="handleHandDrop"
              />
            </div>

            <!-- 摸牌区 -->
            <div class="draw-card-section">
              <div class="section-label">摸牌</div>
              <DrawTile
                :tile="localDrawTile"
                @click="handleDrawTileClick"
                @dblclick="handleDrawTileDblClick"
                @drag-start="handleDrawTileDragStart"
                @drop="handleDrawTileDrop"
              />
            </div>
          </div>

          <div v-if="hasTing" class="ting-info">
            <span class="ting-label">听牌：</span>
            <span v-for="(count, tile) in tingCountMap" :key="tile" class="ting-item">
              {{ tile }}{{ count }}张
            </span>
          </div>
        </el-card>

        <!-- 牌河区 -->
        <el-card shadow="hover" class="river-card">
          <template #header>
            <span class="panel-title">
              牌河
              <span class="river-count">({{ store.river.length }}张)</span>
            </span>
          </template>

          <div
            class="river-container"
            :class="{ 'drag-over': isRiverDragOver }"
            @dragover.prevent="
              (e) => {
                isRiverDragOver = true
                if (e.dataTransfer) {
                  const source = e.dataTransfer.getData('source')
                  e.dataTransfer.dropEffect = source === 'source' ? 'copy' : 'move'
                }
              }
            "
            @dragleave="isRiverDragOver = false"
            @drop="handleRiverDrop"
          >
            <div
              v-for="(element, index) in store.river"
              :key="index"
              class="river-tile"
              draggable="true"
              @click="handleRiverRecover(index)"
              @dblclick="handleRiverTileDblClick(element)"
              @dragstart="(e) => handleRiverTileDragStart(e, element, index)"
            >
              <MahjongTile :tile-id="element" :width="40" :show-name="false" />
            </div>
            <div v-if="store.river.length === 0" class="river-placeholder">拖入牌到这里</div>
          </div>
        </el-card>

        <!-- 分析结果 -->
        <el-card v-if="store.analysis" shadow="hover" class="result-card">
          <template #header>
            <span class="panel-title">分析结果</span>
          </template>
          <div class="result-content">
            <div v-if="store.analysis.error" class="result-item">
              <el-alert type="error" :title="store.analysis.error" :closable="false" />
            </div>
            <div v-else>
              <div class="result-item">
                <span class="result-label">状态：</span>
                <el-tag
                  :type="
                    store.analysis.isHu ? 'success' : store.analysis.isTing ? 'warning' : 'info'
                  "
                >
                  {{ store.analysis.isHu ? '胡牌' : store.analysis.isTing ? '听牌' : '未听牌' }}
                </el-tag>
              </div>
              <div v-if="store.analysis.tingPai.length > 0" class="result-item">
                <span class="result-label">听牌：</span>
                <span class="result-value">
                  <span v-for="tile in store.analysis.tingPai" :key="tile" class="ting-tile">
                    <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
                  </span>
                </span>
              </div>
              <div class="result-item">
                <span class="result-label">振听：</span>
                <el-tag :type="store.analysis.zhenTing ? 'danger' : 'success'">
                  {{ store.analysis.zhenTing ? '是' : '否' }}
                </el-tag>
              </div>
              <div class="result-item">
                <span class="result-label">役种：</span>
                <span class="result-value">
                  {{
                    store.analysis.yaku.length > 0
                      ? `${store.analysis.yaku.join('、')} (${store.analysis.han}番)`
                      : '无'
                  }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hand-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 68px);
  background: #fafafa;
  padding: 0;
}

.hand-header {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 0 16px;
  background: #fafafa;
}

.hand-header h2 {
  margin: 0;
  background: linear-gradient(135deg, #409eff 0%, #3a8cd8 100%);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
}

.main-content {
  display: flex;
  gap: 20px;
  padding: 0 32px 16px;
  margin-top: 16px;
}

.left-panel {
  width: 400px;
  flex-shrink: 0;
}

.left-panel :deep(.el-card__header) {
  padding: 12px 20px;
}

.settings-card :deep(.el-card__header) {
  padding: 12px 20px;
}

.tile-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title {
  font-weight: 600;
  color: #303133;
}

.settings-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.setting-actions .panel-title {
  margin-right: 4px;
}

.setting-label {
  color: #606266;
  font-size: 14px;
}

.tile-count {
  font-weight: normal;
  color: #909399;
  font-size: 14px;
}

.hand-card {
  flex: 1;
}

.hand-area-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.hand-card-section {
  flex: 1;
}

.draw-card-section {
  flex-shrink: 0;
}

.section-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.ting-info {
  margin-top: 16px;
  padding: 12px;
  background: #fdf6ec;
  border-radius: 4px;
  font-size: 14px;
}

.ting-label {
  color: #606266;
  font-weight: 500;
}

.ting-item {
  display: inline-block;
  margin-left: 12px;
  color: #e6a23c;
}

.result-card {
  margin-top: auto;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-label {
  color: #606266;
  font-weight: 500;
  min-width: 60px;
}

.result-value {
  color: #303133;
}

.ting-tile {
  display: inline-block;
  margin-right: 4px;
}

/* 副露区域样式 */
.fulu-card {
  margin-bottom: 0;
}

.fulu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fulu-mode-tip {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 4px;
  margin-bottom: 12px;
  color: #409eff;
  font-size: 14px;
}

.fulu-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.fulu-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fulu-option:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.fulu-type {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.fulu-tiles {
  display: flex;
  gap: 2px;
}

.fulu-container {
  min-height: 60px;
  padding: 12px;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.2s;
}

.fulu-container:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.fulu-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.fulu-empty {
  color: #909399;
  font-size: 14px;
  padding: 20px;
  text-align: center;
}

/* 牌河区域样式 */
.river-card {
  margin-bottom: 0;
}

.river-count {
  font-weight: normal;
  color: #909399;
  font-size: 14px;
}

.river-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 60px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  border: 2px dashed transparent;
  transition: all 0.2s ease;
}

.river-container.drag-over {
  background: #e6f7ff;
  border-color: #1890ff;
}

.river-placeholder {
  width: 100%;
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}

.river-tile {
  cursor: pointer;
  transition: all 0.2s ease;
}

.river-tile:hover {
  transform: translateY(-4px);
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }
}
</style>
