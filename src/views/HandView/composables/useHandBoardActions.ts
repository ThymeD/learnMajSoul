import { computed, onUnmounted, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { normalizeRedFive, sortTilesPreserveRed } from '../../../utils/mahjong'
import { useHandStore } from '../../../stores/hand'

type HandStore = ReturnType<typeof useHandStore>
type TileSource = 'hand' | 'river' | 'fulu' | 'draw' | 'fulu-temp'

interface UseHandBoardActionsParams {
  store: HandStore
  localTiles: Ref<string[]>
  localDrawTile: Ref<string | null>
  fuluDropTiles: Ref<string[]>
  isRiverDragOver: Ref<boolean>
  handleRemoveFulu: (index: number) => void
}

export function useHandBoardActions({
  store,
  localTiles,
  localDrawTile,
  fuluDropTiles,
  isRiverDragOver,
  handleRemoveFulu
}: UseHandBoardActionsParams) {
  function isSameDrawTile(draw: string | null, tileId: string): boolean {
    if (!draw) return false
    return normalizeRedFive(draw) === normalizeRedFive(tileId)
  }

  const tingCountMap = computed(() => {
    if (!store.analysis?.tingPai) return {}
    const map: Record<string, number> = {}
    store.analysis.tingPai.forEach((tile) => {
      map[tile] = (map[tile] || 0) + 1
    })
    return map
  })

  const hasTing = computed(() => {
    return store.analysis?.isTing || (store.analysis?.tingPai?.length ?? 0) > 0
  })

  const usedTiles = computed(() => {
    const used: string[] = [...localTiles.value]
    if (localDrawTile.value) used.push(localDrawTile.value)
    used.push(...store.river)
    for (const fulu of store.fulu) {
      used.push(...fulu.tiles)
    }
    used.push(...fuluDropTiles.value)
    used.push(...store.consumedFromSource)
    return used
  })

  const handleTileAdd = (tile: string) => {
    if (localTiles.value.length >= 13) {
      ElMessage.warning('手牌已满')
      return
    }
    store.addTile(tile)
  }

  const handleTileRemoveFromArea = (tile: string, source: TileSource) => {
    if (source === 'hand') {
      const idx = localTiles.value.indexOf(tile)
      if (idx !== -1) {
        localTiles.value.splice(idx, 1)
        store.tiles = [...localTiles.value]
        ElMessage.success('已从手牌移除')
      }
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

  const handleTileRemove = (tile: string, _index: number) => {
    handleTileRemoveFromArea(tile, 'hand')
  }

  const handleHandDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const tileId = event.dataTransfer?.getData('text/plain')
    const source = event.dataTransfer?.getData('source')

    if (!tileId || source === 'hand') return

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

  const handleHandTileDragStart = (event: DragEvent, tile: string, _index: number) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', tile)
      event.dataTransfer.setData('source', 'hand')
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleSetDrawTile = (tile: string) => {
    if (localDrawTile.value) {
      store.addTile(localDrawTile.value)
    }
    store.setDrawTile(tile)
  }

  const handleDrawTileDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const tileId = event.dataTransfer?.getData('text/plain')
    const source = event.dataTransfer?.getData('source')
    if (!tileId) return

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

  const handleDrawTileDragStart = (event: DragEvent) => {
    if (event.dataTransfer && localDrawTile.value) {
      event.dataTransfer.setData('text/plain', localDrawTile.value)
      event.dataTransfer.setData('source', 'draw')
      event.dataTransfer.effectAllowed = 'move'
    }
  }

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

  const handleRiverTileDblClick = (tile: string) => {
    const idx = store.river.indexOf(tile)
    if (idx !== -1) {
      store.river = store.river.filter((_, i) => i !== idx)
      ElMessage.success('已从牌河移除，牌回到素材区')
    }
  }

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
    if (!tileId || source === 'river') return

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

  const handleClear = () => {
    store.clear()
    localTiles.value = []
    localDrawTile.value = null
    fuluDropTiles.value = []
  }

  onUnmounted(() => {
    if (drawTileClickTimer) clearTimeout(drawTileClickTimer)
  })

  return {
    tingCountMap,
    hasTing,
    usedTiles,
    handleTileAdd,
    handleTileRemoveFromArea,
    handleTileRemove,
    handleHandDrop,
    handleHandTileDragStart,
    handleDrawTileDrop,
    handleDrawTileDragStart,
    handleDrawTileClick,
    handleDrawTileDblClick,
    handleRiverTileDblClick,
    setRiverDragOverDropEffect,
    handleRiverDrop,
    handleRiverTileDragStart,
    handleClear
  }
}
