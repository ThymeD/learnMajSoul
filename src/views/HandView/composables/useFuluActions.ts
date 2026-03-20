import { computed, ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { normalizeRedFive } from '../../../utils/mahjong'
import { useHandStore } from '../../../stores/hand'

type HandStore = ReturnType<typeof useHandStore>

interface UseFuluActionsParams {
  store: HandStore
  localTiles: Ref<string[]>
}

/** HandView 副露相关操作与状态 */
export function useFuluActions({ store, localTiles }: UseFuluActionsParams) {
  const chiEnabled = ref(true)
  const ponEnabled = ref(true)
  const kanEnabled = ref(true)
  const fuluDropTiles = ref<string[]>([])

  const liqiDisabled = computed(() => store.fulu.length > 0)

  const handleRemoveFulu = (index: number) => {
    store.removeFulu(index)
    localTiles.value = [...store.tiles]
  }

  const handleToggleFuluType = (index: number) => {
    store.toggleFuluType(index)
  }

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

  const checkChiInTemp = (newTile: string): string[] | null => {
    return findChiComboInPool([...fuluDropTiles.value, newTile])
  }

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

  function tryResolveFuluTemp() {
    if (store.isLiqi) return

    const MAX_PASSES = 24
    for (let pass = 0; pass < MAX_PASSES && fuluDropTiles.value.length > 0; pass++) {
      const byRank = groupTilesByNormalizedRank(fuluDropTiles.value)

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

    const existingPonIndex = store.fulu.findIndex(
      (f) => f.type === 'pon' && normalizeRedFive(f.tiles[0]) === normalizeRedFive(tileId)
    )

    if (existingPonIndex !== -1) {
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
        ElMessage.info('杠已禁用，第4张牌已添加到暂存区')
      }
    } else if (sameTiles.length === 3) {
      if (ponEnabled.value) {
        store.addFulu({
          type: 'pon',
          tiles: [...sameTiles]
        })
        removeConcreteInstancesFromFuluTemp(sameTiles)
        ElMessage.success('碰牌成功')
      }
    }
  }

  return {
    chiEnabled,
    ponEnabled,
    kanEnabled,
    fuluDropTiles,
    liqiDisabled,
    handleRemoveFulu,
    handleToggleFuluType,
    handleToggleChi,
    handleTogglePon,
    handleToggleKan,
    handleFuluDrop
  }
}
