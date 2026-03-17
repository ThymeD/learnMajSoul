<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import TileSelector from '../components/TileSelector.vue'
import MahjongTile from '../components/MahjongTile.vue'
import { useHandStore, type Wind } from '../stores/hand'

// Store
const store = useHandStore()

// 本地状态（用于双向绑定）
const localTiles = ref<string[]>([])
const localDrawTile = ref<string | null>(null)
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
  // 如果牌已经在手牌区，不做任何操作
  if (localTiles.value.includes(tile)) {
    return
  }
  if (localTiles.value.length + (localDrawTile.value ? 1 : 0) >= 14) {
    ElMessage.warning('手牌已满')
    return
  }
  store.addTile(tile)
}

// 从各区域移除牌（拖回素材选择区）
const handleTileRemoveFromArea = (tile: string, source: 'hand' | 'river' | 'fulu') => {
  if (source === 'hand') {
    const idx = localTiles.value.indexOf(tile)
    if (idx !== -1) {
      localTiles.value.splice(idx, 1)
      store.tiles = [...localTiles.value]
      ElMessage.success('已从手牌移除')
    }
  } else if (source === 'river') {
    const idx = store.river.indexOf(tile)
    if (idx !== -1) {
      store.removeFromRiver(idx)
      ElMessage.success('已从牌河移除')
    }
  } else if (source === 'fulu') {
    // 查找包含该牌的副露
    for (let i = store.fulu.length - 1; i >= 0; i--) {
      if (store.fulu[i].tiles.includes(tile)) {
        handleRemoveFulu(i)
        ElMessage.success('已从副露移除')
        break
      }
    }
  }
}

// 处理牌移除
const handleTileRemove = (tile: string, index: number) => {
  store.removeTile(tile, index)
}

// 处理设置摸牌（从手牌末尾拖入）
const handleSetDrawTile = (tile: string) => {
  // 如果已经有摸牌，先把摸牌加入手牌
  if (localDrawTile.value) {
    store.addTile(localDrawTile.value)
  }
  store.setDrawTile(tile)
}

// 处理摸牌移除（点击摸牌将其加入手牌）
const handleDrawTileClick = () => {
  if (localDrawTile.value) {
    store.addTile(localDrawTile.value)
  }
}

// 清空
const handleClear = () => {
  store.clear()
  localTiles.value = []
  localDrawTile.value = null
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

// 素材搜索
const handleTileSearch = () => {
  // 搜索逻辑在 TileSelector 组件内部处理
}

// 选中的牌列表（用于控制 TileSelector 的显示）
const selectedTiles = computed(() => {
  return [...localTiles.value, localDrawTile.value].filter(Boolean) as string[]
})

// ==================== 副露操作相关 ====================

/** 副露操作模式 */
type FuluMode = 'none' | 'chi' | 'pon' | 'kan'

/** 当前副露操作模式 */
const fuluMode = ref<FuluMode>('none')

/** 可吃的组合列表 */
const chiCombinations = computed(() => {
  if (!localDrawTile.value) return store.getChiCombinations()
  return store.getChiCombinations(localDrawTile.value)
})

/** 可碰的组合列表 */
const ponCombinations = computed(() => store.getPonCombinations())

/** 可杠的组合列表 */
const kanCombinations = computed(() => store.getKanCombinations())

/** 是否可以副露（立直后不能副露） */
const canFulu = computed(() => !store.isLiqi)

/** 立直复选框是否禁用（有副露时不能立直） */
const liqiDisabled = computed(() => {
  return store.fulu.length > 0
})

// 进入吃牌模式
const handleEnterChiMode = () => {
  if (!canFulu.value) return
  fuluMode.value = 'chi'
}

// 进入碰牌模式
const handleEnterPonMode = () => {
  if (!canFulu.value) return
  fuluMode.value = 'pon'
}

// 进入杠牌模式
const handleEnterKanMode = () => {
  if (!canFulu.value) return
  fuluMode.value = 'kan'
}

// 取消副露模式
const handleCancelFuluMode = () => {
  fuluMode.value = 'none'
}

// 执行吃牌
const handleChi = (tiles: string[]) => {
  // 从手牌中移除这3张
  const counts: Record<string, number> = {}
  for (const t of tiles) {
    counts[t] = (counts[t] || 0) + 1
  }

  // 逐张移除
  for (const [tile, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      const idx = localTiles.value.indexOf(tile)
      if (idx !== -1) {
        localTiles.value.splice(idx, 1)
      }
    }
  }

  // 添加副露
  store.addFulu({
    type: 'chi',
    tiles: tiles
  })

  // 同步到 store
  store.tiles = [...localTiles.value]

  fuluMode.value = 'none'
  ElMessage.success('吃牌成功')
}

// 执行碰牌
const handlePon = (tile: string) => {
  // 移除3张相同牌
  let removed = 0
  for (let i = localTiles.value.length - 1; i >= 0; i--) {
    if (localTiles.value[i] === tile && removed < 3) {
      localTiles.value.splice(i, 1)
      removed++
    }
  }

  // 添加副露
  store.addFulu({
    type: 'pon',
    tiles: [tile, tile, tile]
  })

  // 同步到 store
  store.tiles = [...localTiles.value]

  fuluMode.value = 'none'
  ElMessage.success('碰牌成功')
}

// 执行杠牌
const handleKan = (tile: string) => {
  // 移除4张相同牌
  let removed = 0
  for (let i = localTiles.value.length - 1; i >= 0; i--) {
    if (localTiles.value[i] === tile && removed < 4) {
      localTiles.value.splice(i, 1)
      removed++
    }
  }

  // 添加副露
  store.addFulu({
    type: 'kan',
    tiles: [tile, tile, tile, tile]
  })

  // 同步到 store
  store.tiles = [...localTiles.value]

  fuluMode.value = 'none'
  ElMessage.success('杠牌成功')
}

// 移除副露
const handleRemoveFulu = (index: number) => {
  const fuluItem = store.fulu[index]
  if (!fuluItem) return

  // 将副露中的牌返还到手牌
  for (const tile of fuluItem.tiles) {
    store.addTile(tile)
  }

  // 移除副露
  store.removeFulu(index)

  // 同步本地状态
  localTiles.value = [...store.tiles]
}

// ==================== 牌河相关 ====================

// 从牌河回收牌
const handleRiverRecover = (index: number) => {
  store.removeFromRiver(index)
  localTiles.value = [...store.tiles]
}

// 原生 HTML5 drag and drop 处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleTileDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  // 如果是手牌内部排序，不处理
  if (source === 'hand') {
    return
  }

  if (tileId) {
    // 如果手牌已满，拒绝
    if (localTiles.value.length >= 14) {
      ElMessage.warning('手牌已满')
      return
    }
    // 直接添加到手牌
    store.addTile(tileId)
  }
}

const handleDrawTileDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  if (tileId) {
    handleSetDrawTile(tileId)
  }
}

const handleRiverDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  const source = event.dataTransfer?.getData('source')

  // 如果是牌河内部排序
  if (source === 'river') {
    return // 排序由 handleRiverSortDrop 处理
  }

  if (tileId) {
    // 先尝试从手牌移除并添加到牌河
    const idx = localTiles.value.indexOf(tileId)
    if (idx !== -1) {
      localTiles.value.splice(idx, 1)
      store.tiles = [...localTiles.value]
      store.addToRiver(tileId)
    } else {
      // 如果手牌中没有这张牌（从素材选择区直接拖入），直接添加到牌河
      store.river.push(tileId)
    }
  }
}

// 牌河内拖动排序
let riverDragStartIndex: number | null = null

const handleRiverTileDragStart = (event: DragEvent, index: number) => {
  riverDragStartIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', store.river[index])
    event.dataTransfer.setData('source', 'river')
    event.dataTransfer.setData('index', String(index))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleRiverTileDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleRiverSortDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  event.stopPropagation()
  if (riverDragStartIndex === null || riverDragStartIndex === targetIndex) {
    riverDragStartIndex = null
    return
  }

  // 交换位置
  const temp = store.river[riverDragStartIndex]
  store.river.splice(riverDragStartIndex, 1)
  store.river.splice(targetIndex, 0, temp)

  riverDragStartIndex = null
}

const handleRiverTileDragEnd = () => {
  riverDragStartIndex = null
}

// 副露区拖入处理
const handleFuluDrop = (event: DragEvent) => {
  event.preventDefault()
  const tileId = event.dataTransfer?.getData('text/plain')
  if (!tileId) return

  // 如果有摸牌，需要先处理摸牌
  if (localDrawTile.value) {
    ElMessage.warning('请先处理摸牌')
    return
  }

  // 从手牌移除这张牌（如果是来自手牌的话）
  const handIdx = localTiles.value.indexOf(tileId)
  if (handIdx !== -1) {
    localTiles.value.splice(handIdx, 1)
    store.tiles = [...localTiles.value]
  }

  // 直接添加1张牌到副露区（作为新的副露组）
  // 用户后续可以通过分析按钮校验副露是否符合规则
  store.addFulu({
    type: 'pon', // 默认作为碰的组（3张），用户可以后续调整
    tiles: [tileId]
  })

  ElMessage.success('已添加到副露区')
}

// 手牌内拖动排序
let dragStartIndex: number | null = null

const handleTileDragStart = (event: DragEvent, index: number) => {
  dragStartIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', localTiles.value[index])
    event.dataTransfer.setData('source', 'hand')
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleTileDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleTileSortDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  event.stopPropagation()
  if (dragStartIndex === null || dragStartIndex === targetIndex) {
    dragStartIndex = null
    return
  }

  // 交换位置
  const temp = localTiles.value[dragStartIndex]
  localTiles.value.splice(dragStartIndex, 1)
  localTiles.value.splice(targetIndex, 0, temp)

  // 同步到 store
  store.tiles = [...localTiles.value]

  dragStartIndex = null
}

const handleTileDragEnd = () => {
  dragStartIndex = null
}

// 处理从副露区、牌河区开始的拖拽
const handleAreaDragStart = (
  event: DragEvent,
  tile: string,
  source: 'fulu' | 'river',
  index?: number
) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tile)
    event.dataTransfer.setData('source', source)
    if (index !== undefined) {
      event.dataTransfer.setData('index', String(index))
    }
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div class="hand-view">
    <div class="hand-header">
      <h2>手牌分析</h2>
    </div>

    <!-- 主内容区 -->
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
                @input="handleTileSearch"
                @clear="handleTileSearch"
              />
            </div>
          </template>
          <TileSelector
            :selected-tiles="selectedTiles"
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
          <div class="settings-body"></div>
        </el-card>

        <!-- 副露区 -->
        <el-card shadow="hover" class="fulu-card" @dragover="handleDragOver" @drop="handleFuluDrop">
          <template #header>
            <div class="fulu-header">
              <span class="panel-title">副露区</span>
              <div class="fulu-buttons" v-if="fuluMode === 'none'">
                <el-button
                  size="small"
                  :disabled="!canFulu || chiCombinations.length === 0"
                  @click="handleEnterChiMode"
                >
                  吃
                </el-button>
                <el-button
                  size="small"
                  :disabled="!canFulu || ponCombinations.length === 0"
                  @click="handleEnterPonMode"
                >
                  碰
                </el-button>
                <el-button
                  size="small"
                  :disabled="!canFulu || kanCombinations.length === 0"
                  @click="handleEnterKanMode"
                >
                  杠
                </el-button>
              </div>
              <el-button v-else size="small" @click="handleCancelFuluMode">取消</el-button>
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

          <!-- 副露列表展示 -->
          <div class="fulu-list">
            <div v-for="(item, idx) in store.fulu" :key="idx" class="fulu-item">
              <div class="fulu-tiles">
                <div
                  v-for="(tile, tileIdx) in item.tiles"
                  :key="tileIdx"
                  class="fulu-tile-wrapper"
                  draggable="true"
                  @dragstart="(e) => handleAreaDragStart(e, tile, 'fulu', idx)"
                >
                  <MahjongTile :tile-id="tile" :width="40" :show-name="false" />
                </div>
              </div>
              <el-button
                v-if="!store.isLiqi"
                size="small"
                type="danger"
                link
                @click="handleRemoveFulu(idx)"
              >
                删除
              </el-button>
            </div>
            <div v-if="store.fulu.length === 0 && fuluMode === 'none'" class="fulu-empty">
              暂无副露
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

          <div class="hand-display-area" @dragover="handleDragOver" @drop="handleTileDrop">
            <!-- 手牌 -->
            <div class="hand-tiles">
              <div class="tiles-container">
                <div
                  v-for="(element, index) in localTiles"
                  :key="index"
                  class="tile-wrapper"
                  :class="{ 'is-ting': store.analysis?.tingPai?.includes(element) }"
                  draggable="true"
                  @dragstart="handleTileDragStart($event, index)"
                  @dragover="handleTileDragOver"
                  @drop="handleTileSortDrop($event, index)"
                  @dragend="handleTileDragEnd"
                >
                  <!-- 听牌位置显示听牌张数 -->
                  <div v-if="store.analysis?.tingPai?.includes(element)" class="ting-indicator">
                    {{ tingCountMap[element] || '' }}
                  </div>
                  <MahjongTile :tile-id="element" :width="60" :show-name="false" />
                  <div class="tile-remove" @click.stop="handleTileRemove(element, index)">×</div>
                </div>
              </div>

              <!-- 摸牌区 -->
              <div
                class="draw-tile-zone"
                :class="{ 'has-draw': !!localDrawTile }"
                @click="handleDrawTileClick"
                @dragover="handleDragOver"
                @drop="handleDrawTileDrop"
              >
                <div
                  v-if="localDrawTile"
                  class="draw-tile"
                  draggable="true"
                  @dragstart="
                    (e) => {
                      if (e.dataTransfer) {
                        e.dataTransfer.setData('text/plain', localDrawTile!)
                        e.dataTransfer.setData('source', 'hand')
                        e.dataTransfer.effectAllowed = 'move'
                      }
                    }
                  "
                >
                  <MahjongTile :tile-id="localDrawTile" :width="60" :show-name="false" />
                </div>
                <div v-else class="draw-placeholder">拖入摸牌</div>
              </div>
            </div>

            <!-- 听牌信息 -->
            <div v-if="hasTing" class="ting-info">
              <span class="ting-label">听牌：</span>
              <span v-for="(count, tile) in tingCountMap" :key="tile" class="ting-item">
                {{ tile }}{{ count }}张
              </span>
            </div>
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

          <div class="river-container" @dragover="handleDragOver" @drop="handleRiverDrop">
            <div
              v-for="(element, index) in store.river"
              :key="index"
              class="river-tile"
              draggable="true"
              @click="handleRiverRecover(index)"
              @dragstart="handleRiverTileDragStart($event, index)"
              @dragover="handleRiverTileDragOver"
              @drop="handleRiverSortDrop($event, index)"
              @dragend="handleRiverTileDragEnd"
            >
              <MahjongTile :tile-id="element" :width="40" :show-name="false" />
            </div>
          </div>

          <div v-if="store.river.length === 0" class="river-empty">
            从手牌拖拽到这里打牌，或点击"操作按钮"区域的"打牌"按钮
          </div>
        </el-card>

        <!-- 分析结果 -->
        <el-card v-if="store.analysis" shadow="hover" class="result-card">
          <template #header>
            <span class="panel-title">分析结果</span>
          </template>
          <div class="result-content">
            <div class="result-item">
              <span class="result-label">状态：</span>
              <el-tag
                :type="store.analysis.isHu ? 'success' : store.analysis.isTing ? 'warning' : 'info'"
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
  padding-top: 0;
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

.header {
  flex-shrink: 0;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h2 {
  margin: 0;
  background: linear-gradient(135deg, #409eff 0%, #3a8cd8 100%);
  color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
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

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.settings-card .settings-content {
  display: none;
}

.settings-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.settings-body {
  display: none;
  padding: 0;
  margin: 0;
}

.settings-card :deep(.el-card__body) {
  padding: 0;
  margin: 0;
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

.hand-display-area {
  min-height: 150px;
}

.hand-tiles {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tiles-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex-wrap: wrap;
}

.tile-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.tile-wrapper:hover {
  background: rgba(64, 158, 255, 0.1);
}

.tile-wrapper.is-ting {
  margin-left: 16px;
}

.tile-wrapper.is-ting:first-child {
  margin-left: 0;
}

.ting-indicator {
  position: absolute;
  left: -12px;
  top: 0;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 10px;
  color: #fff;
  background: #e6a23c;
  border-radius: 8px;
  padding: 0 4px;
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

.tile-wrapper:hover .tile-remove {
  opacity: 1;
}

.draw-tile-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 90px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.draw-tile-zone:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.draw-tile-zone.has-draw {
  border-style: solid;
  border-color: #409eff;
  background: #fff;
}

.draw-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.draw-placeholder {
  color: #909399;
  font-size: 14px;
}

.draw-tile {
  cursor: pointer;
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

.fulu-buttons {
  display: flex;
  gap: 8px;
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

.fulu-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.fulu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
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
  flex-wrap: wrap;
  gap: 8px;
  min-height: 60px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.river-tile {
  cursor: pointer;
  transition: all 0.2s ease;
}

.river-tile:hover {
  transform: translateY(-4px);
}

.river-empty {
  color: #909399;
  font-size: 14px;
  padding: 20px;
  text-align: center;
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
