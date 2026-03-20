<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import TileSelector from '../../components/TileSelector.vue'
import MahjongTile from '../../components/MahjongTile.vue'
import { useHandStore, type Wind } from '../../stores/hand'
import { normalizeRedFive, sortTilesPreserveRed } from '../../utils/mahjong'

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

/** 摸牌区与拖拽数据比较（赤牌与对应普通5 在 store 中可能已标准化） */
function isSameDrawTile(draw: string | null, tileId: string): boolean {
  if (!draw) return false
  return normalizeRedFive(draw) === normalizeRedFive(tileId)
}

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
// 注意：'draw' 和 'river' 的处理已在各自的处理函数中完成，这里只处理其他情况
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
  } else if (source === 'draw' || source === 'river') {
    // draw 和 river 的处理已在各自的dblclick/click处理函数中完成
    // 这里不需要额外处理，usedTiles 会自动响应变化
  } else if (source === 'fulu-temp') {
    const idx = fuluDropTiles.value.indexOf(tile)
    if (idx !== -1) {
      fuluDropTiles.value.splice(idx, 1)
      ElMessage.success('已从副露暂存区移除')
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
    if (isSameDrawTile(localDrawTile.value, tileId)) {
      store.setDrawTile(null)
      localDrawTile.value = null
    }
    handleTileAdd(tileId)
  } else if (source === 'river') {
    const idx = store.river.indexOf(tileId)
    if (idx !== -1) {
      store.river.splice(idx, 1)
      store.tiles = sortTilesPreserveRed([...store.tiles, tileId])
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
}

// 摸牌单击加入手牌须延迟执行，否则双击时第一次 click 会先把手牌挪走，导致双击移除失效
let drawTileClickTimer: ReturnType<typeof setTimeout> | null = null
const DRAW_TILE_CLICK_DELAY_MS = 300

const handleDrawTileClick = () => {
  if (!localDrawTile.value) return
  if (drawTileClickTimer) {
    clearTimeout(drawTileClickTimer)
    drawTileClickTimer = null
  }
  drawTileClickTimer = setTimeout(() => {
    drawTileClickTimer = null
    const tile = localDrawTile.value
    if (!tile) return
    if (localTiles.value.length >= 13) {
      ElMessage.warning('手牌已满')
      return
    }
    store.addTile(tile)
    store.setDrawTile(null)
  }, DRAW_TILE_CLICK_DELAY_MS)
}

const handleDrawTileDblClick = () => {
  if (drawTileClickTimer) {
    clearTimeout(drawTileClickTimer)
    drawTileClickTimer = null
  }
  if (!localDrawTile.value) return
  store.setDrawTile(null)
  localTiles.value = [...localTiles.value]
  ElMessage.success('已从摸牌区移除，牌回到素材区')
}

onUnmounted(() => {
  if (drawTileClickTimer) clearTimeout(drawTileClickTimer)
})

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

// 已使用的牌列表
const usedTiles = computed(() => {
  const used: string[] = [...localTiles.value]
  if (localDrawTile.value) used.push(localDrawTile.value)
  used.push(...store.river)
  for (const fulu of store.fulu) {
    used.push(...fulu.tiles)
  }
  used.push(...fuluDropTiles.value)
  // 从素材区直接消耗到牌河的牌也需要计入usedTiles，以便素材区正确计算剩余数量
  used.push(...store.consumedFromSource)
  return used
})

// ==================== 副露操作相关 ====================

// 副露开关状态
const chiEnabled = ref(true) // 吃开关
const ponEnabled = ref(true) // 碰开关
const kanEnabled = ref(true) // 杠开关

const liqiDisabled = computed(() => store.fulu.length > 0)

const handleRemoveFulu = (index: number) => {
  store.removeFulu(index)
  localTiles.value = [...store.tiles]
}

const handleToggleFuluType = (index: number) => {
  store.toggleFuluType(index)
}

// 副露数据（用于原生 drag/drop 接收拖入）
const fuluDropTiles = ref<string[]>([])

/** 从牌池（ multiset ）中找一组顺子，顺序：万→筒→索，数字小优先 */
function findChiComboInPool(pool: string[]): string[] | null {
  const suits = ['w', 'b', 's'] as const
  for (const suit of suits) {
    for (let n = 1; n <= 7; n++) {
      const norms = [`${suit}${n}`, `${suit}${n + 1}`, `${suit}${n + 2}`]
      const picked: string[] = []
      const avail = [...pool]
      let ok = true
      for (const norm of norms) {
        const i = avail.findIndex((t) => normalizeRedFive(t) === norm)
        if (i === -1) {
          ok = false
          break
        }
        picked.push(avail[i])
        avail.splice(i, 1)
      }
      if (ok) return picked
    }
  }
  return null
}

/** 吃牌：赤牌与同花色普通5视为同序号，可从暂存区+新牌凑成顺子 */
const checkChiInTemp = (newTile: string): string[] | null => {
  return findChiComboInPool([...fuluDropTiles.value, newTile])
}

/** 按张移除暂存区（同 id 多张时只删传入次数，不用 Set 误删多余张） */
function removeConcreteInstancesFromFuluTemp(toRemove: string[]) {
  const next = [...fuluDropTiles.value]
  for (const t of toRemove) {
    const i = next.indexOf(t)
    if (i !== -1) next.splice(i, 1)
  }
  fuluDropTiles.value = next
}

function groupTilesByNormalizedRank(tiles: string[]): Map<string, string[]> {
  const byRank = new Map<string, string[]>()
  for (const t of tiles) {
    const k = normalizeRedFive(t)
    if (!byRank.has(k)) byRank.set(k, [])
    byRank.get(k)!.push(t)
  }
  return byRank
}

/** 选字典序最小的 rank，保证多组可碰/杠时结果确定 */
function pickBestRankGroup(byRank: Map<string, string[]>, minLen: number): string[] | null {
  let bestKey: string | null = null
  let best: string[] | null = null
  for (const [k, arr] of byRank) {
    if (arr.length >= minLen) {
      if (bestKey === null || k < bestKey) {
        bestKey = k
        best = arr.slice(0, minLen)
      }
    }
  }
  return best
}

/**
 * 副露开关打开时：对暂存区按规则自动成组。
 * 优先级：杠（暂存4同）> 明杠（已有碰+暂存1张）> 碰（暂存3同）> 吃（暂存顺子）
 * 与需求一致：碰/吃冲突优先碰；杠/吃冲突优先杠。
 */
function tryResolveFuluTemp() {
  if (store.isLiqi) return

  const MAX_PASSES = 24
  for (let pass = 0; pass < MAX_PASSES && fuluDropTiles.value.length > 0; pass++) {
    const byRank = groupTilesByNormalizedRank(fuluDropTiles.value)

    // 1 暗杠：暂存区4张同序（杠优先于吃）
    if (kanEnabled.value) {
      const four = pickBestRankGroup(byRank, 4)
      if (four) {
        store.addFulu({
          type: 'kan',
          tiles: [...four],
          isOpen: false
        })
        removeConcreteInstancesFromFuluTemp(four)
        ElMessage.success('暗杠成功')
        continue
      }
    }

    // 2 明杠：已有碰 + 暂存第4张
    if (kanEnabled.value) {
      let upgraded = false
      for (let i = 0; i < store.fulu.length; i++) {
        const f = store.fulu[i]
        if (f.type !== 'pon') continue
        const rk = normalizeRedFive(f.tiles[0])
        const j = fuluDropTiles.value.findIndex((t) => normalizeRedFive(t) === rk)
        if (j !== -1) {
          const fourth = fuluDropTiles.value[j]
          store.removeFulu(i)
          store.addFulu({
            type: 'kan',
            tiles: [...f.tiles, fourth],
            isOpen: true
          })
          fuluDropTiles.value.splice(j, 1)
          ElMessage.success('明杠成功')
          upgraded = true
          break
        }
      }
      if (upgraded) continue
    }

    // 3 碰：暂存3同（碰优先于吃）
    if (ponEnabled.value) {
      const three = pickBestRankGroup(groupTilesByNormalizedRank(fuluDropTiles.value), 3)
      if (three) {
        store.addFulu({
          type: 'pon',
          tiles: [...three]
        })
        removeConcreteInstancesFromFuluTemp(three)
        ElMessage.success('碰牌成功')
        continue
      }
    }

    // 4 吃
    if (chiEnabled.value) {
      const chi = findChiComboInPool(fuluDropTiles.value)
      if (chi) {
        store.addFulu({
          type: 'chi',
          tiles: chi
        })
        removeConcreteInstancesFromFuluTemp(chi)
        ElMessage.success('吃牌成功')
        continue
      }
    }

    break
  }
}

const handleToggleChi = () => {
  const turningOn = !chiEnabled.value
  chiEnabled.value = !chiEnabled.value
  if (turningOn) tryResolveFuluTemp()
}

const handleTogglePon = () => {
  const turningOn = !ponEnabled.value
  ponEnabled.value = !ponEnabled.value
  if (turningOn) tryResolveFuluTemp()
}

const handleToggleKan = () => {
  const turningOn = !kanEnabled.value
  kanEnabled.value = !kanEnabled.value
  if (turningOn) tryResolveFuluTemp()
}

const handleFuluDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  if (!tileId) return

  if (source === 'fulu') return

  // 吃牌检查：根据 chiEnabled 开关状态决定
  if (chiEnabled.value) {
    const chiCombo = checkChiInTemp(tileId)

    if (chiCombo) {
      if (source === 'draw') {
        store.setDrawTile(null)
      } else {
        for (const t of chiCombo) {
          const handIdx = localTiles.value.indexOf(t)
          if (handIdx !== -1) {
            localTiles.value.splice(handIdx, 1)
          }
        }
        store.tiles = [...localTiles.value]
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
  }

  // 碰牌检查：如果已有碰，检查是否能加杠（赤5与普5视为同刻）
  const existingPonIndex = store.fulu.findIndex(
    (f) => f.type === 'pon' && normalizeRedFive(f.tiles[0]) === normalizeRedFive(tileId)
  )

  if (existingPonIndex !== -1) {
    // 已经有碰存在
    if (kanEnabled.value) {
      const prevPon = store.fulu[existingPonIndex]
      if (source === 'draw') {
        store.setDrawTile(null)
      }

      store.removeFulu(existingPonIndex)
      store.addFulu({
        type: 'kan',
        tiles: [...prevPon.tiles, tileId],
        isOpen: true
      })
      ElMessage.success('明杠成功')
      return
    }
    // 杠开关关闭时，不在这里处理，让牌继续添加到暂存区
  }

  if (source === 'draw') {
    store.setDrawTile(null)
  } else {
    const handIdx = localTiles.value.indexOf(tileId)
    if (handIdx !== -1) {
      localTiles.value.splice(handIdx, 1)
      store.tiles = [...localTiles.value]
    }
  }

  fuluDropTiles.value.push(tileId)

  const sameTiles = fuluDropTiles.value.filter((t) => normalizeRedFive(t) === normalizeRedFive(tileId))

  // 杠牌检查：根据 kanEnabled 开关状态决定
  if (sameTiles.length === 4) {
    if (kanEnabled.value) {
      store.addFulu({
        type: 'kan',
        tiles: [...sameTiles],
        isOpen: false
      })
      removeConcreteInstancesFromFuluTemp(sameTiles)
      ElMessage.success('暗杠成功')
    } else {
      // 杠禁用时，第4张牌留在暂存区，但不形成杠
      ElMessage.info('杠已禁用，第4张牌已添加到暂存区')
    }
  } else if (sameTiles.length === 3) {
    // 碰牌：根据 ponEnabled 开关状态决定
    if (ponEnabled.value) {
      store.addFulu({
        type: 'pon',
        tiles: [...sameTiles]
      })
      removeConcreteInstancesFromFuluTemp(sameTiles)
      ElMessage.success('碰牌成功')
    }
    // 如果 pon 禁用，牌留在暂存区但不成组
  }
}

// ==================== 牌河相关 ====================

// 牌河双击移除（回到素材区）
const handleRiverTileDblClick = (tile: string) => {
  const idx = store.river.indexOf(tile)
  if (idx !== -1) {
    // 使用 filter 创建新数组而非 splice，确保 Vue 响应式正确触发
    store.river = store.river.filter((_, i) => i !== idx)
    ElMessage.success('已从牌河移除，牌回到素材区')
  }
}

// 牌河 dragover：dragover 阶段多数浏览器不允许读取 dataTransfer.getData()，source 恒为空。
// 若误判为 move，会与素材区 dragstart 里 effectAllowed='copy' 冲突，导致无法放置。
const setRiverDragOverDropEffect = (e: DragEvent) => {
  const dt = e.dataTransfer
  if (!dt) return
  dt.dropEffect = dt.effectAllowed === 'copy' ? 'copy' : 'move'
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
    if (isSameDrawTile(localDrawTile.value, tileId)) {
      store.setDrawTile(null)
      store.river.push(tileId)
    }
  } else if (source === 'fulu-temp') {
    const tempIdx = fuluDropTiles.value.indexOf(tileId)
    if (tempIdx !== -1) {
      fuluDropTiles.value.splice(tempIdx, 1)
      store.river.push(tileId)
    }
  } else if (source === 'source') {
    // 从素材区拖拽到牌河，牌直接加入牌河
    // 同时记录到 consumedFromSource，让素材区能够正确减少数量
    store.river.push(tileId)
    store.addConsumedFromSource(tileId)
    ElMessage.success('已添加到牌河')
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
                :chi-enabled="chiEnabled"
                :pon-enabled="ponEnabled"
                :kan-enabled="kanEnabled"
                @toggle-chi="handleToggleChi"
                @toggle-pon="handleTogglePon"
                @toggle-kan="handleToggleKan"
              />
            </div>
          </template>

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
                setRiverDragOverDropEffect(e)
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
