/**
 * 手牌状态管理 Pinia Store
 * 管理玩家的手牌、副露、牌河等状态
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  sortTiles,
  countTiles,
  isValidTileCount,
  normalizeTiles,
  normalizeRedFive,
  analyzeHand,
  type Tile
} from '../utils/mahjong'
import { matchYaku, calculateHan, type YakuMatchResult } from '../utils/yaku-match'
import {
  randomHand as generateRandomHuHand,
  randomHandWithFulu as generateRandomHuHandWithFulu
} from '../utils/random-hand'

// ==================== 类型定义 ====================

/** 风牌：d1-东, d2-南, d3-西, d4-北 */
export type Wind = 'd1' | 'd2' | 'd3' | 'd4'

/** 三元牌：z1-白, z2-中, z3-发 */
export type Dragon = 'z1' | 'z2' | 'z3'

/** 副露类型 */
export type FuluType = 'chi' | 'pon' | 'kan'

/** 副露结构 */
export interface Fulu {
  type: FuluType
  tiles: string[] // 吃的牌/碰的牌/杠的牌
  /** 来自哪一家（0=上家,1=对家,2=下家）- 吃牌需要 */
  from?: number
  /** 是否明杠（暗杠=false，从手牌杠） */
  isOpen?: boolean
}

/** 副露暂存区 */
export interface FuluTemp {
  tiles: string[] // 暂存的牌
  createdAt: number // 创建时间戳
}

/** 分析结果 */
export interface AnalysisResult {
  isTing: boolean
  isHu: boolean
  tingPai: string[]
  zhenTing: boolean
  han: number
  yaku: string[]
  error?: string // 校验错误信息
}

// ==================== 常量定义 ====================

/** localStorage 键名 */
const STORAGE_KEY = 'majsoul_hand_state'

/** 所有可能的牌 */
const ALL_POSSIBLE_TILES: Tile[] = [
  // 数牌：万、筒、索 1-9
  'w1',
  'w2',
  'w3',
  'w4',
  'w5',
  'w6',
  'w7',
  'w8',
  'w9',
  'b1',
  'b2',
  'b3',
  'b4',
  'b5',
  'b6',
  'b7',
  'b8',
  'b9',
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's7',
  's8',
  's9',
  // 字牌：东南西北
  'd1',
  'd2',
  'd3',
  'd4',
  // 三元牌：白中发
  'z1',
  'z2',
  'z3'
]

// ==================== Store 定义 ====================

export const useHandStore = defineStore('hand', () => {
  // ==================== State ====================

  /** 手牌13张 */
  const tiles = ref<string[]>([])

  /** 摸牌 */
  const drawTile = ref<string | null>(null)

  /** 副露列表 */
  const fulu = ref<Fulu[]>([])

  /** 牌河 */
  const river = ref<string[]>([])

  /** 立直状态 */
  const isLiqi = ref(false)

  /** 庄家 */
  const dealer = ref(false)

  /** 自风 */
  const selfWind = ref<Wind>('d1')

  /** 场风 */
  const fieldWind = ref<Wind>('d1')

  /** 宝牌指示牌 */
  const dora = ref<string[]>([])

  /** 分析结果 */
  const analysis = ref<AnalysisResult | null>(null)

  /** 副露暂存区 */
  const fuluTemp = ref<FuluTemp[]>([])

  // ==================== Getters ====================

  /**
   * 所有牌（手牌+摸牌）
   */
  const allTiles = computed(() => {
    const result = [...tiles.value]
    if (drawTile.value) {
      result.push(drawTile.value)
    }
    return sortTiles(result)
  })

  /**
   * 手牌张数
   */
  const tileCount = computed(() => tiles.value.length)

  /**
   * 是否可以立直
   * 条件：门清（无副露）、未立直、13张手牌
   */
  const canLiqi = computed(() => {
    return !isLiqi.value && fulu.value.length === 0 && tiles.value.length === 13
  })

  /**
   * 是否门清（无副露）
   */
  const isMenqian = computed(() => fulu.value.length === 0)

  // ==================== Actions ====================

  /**
   * 检查同种牌是否超过4张
   */
  function checkTileCount(tile: string): boolean {
    const normalized = normalizeTiles([tile])[0]
    const counts = countTiles(tiles.value)
    const currentCount = counts[normalized] || 0
    return currentCount < 4
  }

  /**
   * 添加一张牌到手牌
   * @param tile 牌
   * @returns 是否添加成功
   */
  function addTile(tile: string): boolean {
    // 检查是否超过4张相同牌
    if (!checkTileCount(tile)) {
      return false
    }

    // 立直后不能摸牌
    if (isLiqi.value) {
      return false
    }

    // 标准化赤牌
    const normalized = normalizeTiles([tile])[0]

    // 直接添加新牌到手牌，不自动移动摸牌区的牌
    // 摸牌区的牌需要用户主动操作才会移动
    tiles.value.push(normalized)
    tiles.value = sortTiles(tiles.value)

    return true
  }

  /**
   * 移除一张牌
   * @param tile 牌
   * @param index 指定索引（可选，默认移除第一张）
   * @returns 是否移除成功
   */
  function removeTile(tile: string, index?: number): boolean {
    const normalized = normalizeTiles([tile])[0]
    const idx = index ?? tiles.value.indexOf(normalized)

    if (idx === -1) {
      return false
    }

    tiles.value.splice(idx, 1)
    return true
  }

  /**
   * 设置摸牌
   * @param tile 牌或null
   */
  function setDrawTile(tile: string | null): void {
    if (tile) {
      const normalized = normalizeTiles([tile])[0]
      drawTile.value = normalized
    } else {
      drawTile.value = null
    }
  }

  /**
   * 清空所有状态到默认值
   * 包括：手牌、摸牌、副露、牌河、宝牌、分析结果、副露暂存区
   * 役种设置重置为：立直=false、庄家=false、自风=东、场风=东
   */
  function clear(): void {
    tiles.value = []
    drawTile.value = null
    fulu.value = []
    river.value = []
    isLiqi.value = false
    dealer.value = false
    selfWind.value = 'd1'
    fieldWind.value = 'd1'
    dora.value = []
    analysis.value = null
    fuluTemp.value = []
  }

  /**
   * 随机生成可胡牌牌型
   * 使用 random-hand.ts 中的算法生成符合胡牌条件的牌型
   * @param includeFulu 是否包含副露
   * @param includeRiver 是否包含牌河
   */
  function randomHand(includeFulu = false, includeRiver = false): void {
    // 清空现有状态
    clear()

    // 使用新的随机生成算法
    const result = includeFulu ? generateRandomHuHandWithFulu() : generateRandomHuHand()

    // 设置生成的结果
    tiles.value = result.tiles as string[]
    drawTile.value = result.drawTile
    fulu.value = result.fulu as Fulu[]

    // 可选：生成牌河
    if (includeRiver) {
      // 简单生成一些随机牌作为牌河
      const riverCount = Math.floor(Math.random() * 6) // 0-5张
      const pool = createAvailablePool()
      for (let i = 0; i < riverCount && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length)
        river.value.push(pool.splice(idx, 1)[0])
      }
    }
  }

  /**
   * 创建当前可用牌池（从已使用的牌反推）
   */
  function createAvailablePool(): string[] {
    const used: Record<string, number> = {}

    // 统计已使用的牌
    for (const tile of tiles.value) {
      used[tile] = (used[tile] || 0) + 1
    }
    if (drawTile.value) {
      used[drawTile.value] = (used[drawTile.value] || 0) + 1
    }
    for (const f of fulu.value) {
      for (const tile of f.tiles) {
        used[tile] = (used[tile] || 0) + 1
      }
    }
    for (const tile of river.value) {
      used[tile] = (used[tile] || 0) + 1
    }

    // 创建可用池（每种牌最多4张减去已使用的）
    const pool: string[] = []
    for (const tile of ALL_POSSIBLE_TILES) {
      const usedCount = used[tile] || 0
      const available = 4 - usedCount
      for (let i = 0; i < available; i++) {
        pool.push(tile)
      }
    }

    return pool
  }

  /**
   * 添加副露
   * @param fuluItem 副露
   */
  function addFulu(fuluItem: Fulu): void {
    // 立直后不能副露
    if (isLiqi.value) {
      return
    }

    // 标准化副露中的牌
    const normalizedTiles = normalizeTiles(fuluItem.tiles)

    // 检查是否超过4张
    const allTiles = [...tiles.value, ...normalizedTiles]
    if (!isValidTileCount(allTiles)) {
      return
    }

    fulu.value.push({
      ...fuluItem,
      tiles: normalizedTiles
    })
  }

  /**
   * 移除副露
   * @param index 副露索引
   */
  function removeFulu(index: number): void {
    if (index >= 0 && index < fulu.value.length) {
      fulu.value.splice(index, 1)
    }
  }

  /**
   * 切换副露的明杠/暗杠状态
   * @param index 副露索引
   */
  function toggleFuluType(index: number): void {
    if (index >= 0 && index < fulu.value.length) {
      const fuluItem = fulu.value[index]
      if (fuluItem.type === 'kan' && fuluItem.isOpen !== undefined) {
        fuluItem.isOpen = !fuluItem.isOpen
      }
    }
  }

  /**
   * 添加牌到副露暂存区
   * @param tile 牌
   */
  function addToFuluTemp(tile: string): void {
    const normalized = normalizeTiles([tile])[0]
    fuluTemp.value.push({
      tiles: [normalized],
      createdAt: Date.now()
    })
  }

  /**
   * 从副露暂存区移除牌
   * @param index 暂存区索引
   */
  function removeFromFuluTemp(index: number): void {
    if (index >= 0 && index < fuluTemp.value.length) {
      fuluTemp.value.splice(index, 1)
    }
  }

  /**
   * 清空副露暂存区
   */
  function clearFuluTemp(): void {
    fuluTemp.value = []
  }

  /**
   * 提交副露暂存区，尝试成组
   * @returns 成组后创建的副露，如果无法成组则返回null
   */
  function commitFuluTemp(): Fulu | null {
    if (fuluTemp.value.length === 0) {
      return null
    }

    // 合并所有暂存的牌
    const allTiles: string[] = []
    for (const temp of fuluTemp.value) {
      allTiles.push(...temp.tiles)
    }

    // 检查是否能成组
    const counts = countTiles(allTiles)

    // 检查4张相同 -> 杠
    for (const [tile, count] of Object.entries(counts)) {
      if (count >= 4) {
        clearFuluTemp()
        return {
          type: 'kan',
          tiles: [tile, tile, tile, tile],
          isOpen: true // 明杠
        }
      }
    }

    // 检查3张相同 -> 碰
    for (const [tile, count] of Object.entries(counts)) {
      if (count >= 3) {
        clearFuluTemp()
        return {
          type: 'pon',
          tiles: [tile, tile, tile]
        }
      }
    }

    // 检查3张连续 -> 吃
    // 检查是否能形成顺子
    const numberSuits = ['w', 'b', 's'] as const
    for (const suit of numberSuits) {
      for (let num = 1; num <= 7; num++) {
        const t1 = `${suit}${num}`
        const t2 = `${suit}${num + 1}`
        const t3 = `${suit}${num + 2}`

        // 检查这3张牌是否都在 allTiles 中
        if (counts[t1] && counts[t2] && counts[t3]) {
          clearFuluTemp()
          return {
            type: 'chi',
            tiles: [t1, t2, t3],
            from: 0 // 吃上家的牌
          }
        }
      }
    }

    return null
  }

  /**
   * 获取可以吃的组合
   * 吃上家的牌组成顺子
   * @param targetTile 想要吃的牌（摸到的牌或上家打出的牌）
   * @returns 可吃的组合列表
   */
  function getChiCombinations(targetTile?: string): { tiles: string[]; type: string }[] {
    const allTiles = [...tiles.value]
    if (targetTile) {
      allTiles.push(targetTile)
    }

    const normalized = normalizeTiles(allTiles)
    const counts = countTiles(normalized)
    const combinations: { tiles: string[]; type: string }[] = []

    // 数牌花色
    const numberSuits = ['w', 'b', 's'] as const

    // 遍历所有可能的顺子
    for (const suit of numberSuits) {
      for (let num = 1; num <= 7; num++) {
        const t1 = `${suit}${num}` as Tile
        const t2 = `${suit}${num + 1}` as Tile
        const t3 = `${suit}${num + 2}` as Tile

        // 检查这3张牌是否都存在
        const count1 = counts[t1] || 0
        const count2 = counts[t2] || 0
        const count3 = counts[t3] || 0

        if (count1 > 0 && count2 > 0 && count3 > 0) {
          // 检查是否有摸牌在顺子中（如果有摸牌，则必须有2张在手中）
          if (targetTile) {
            // 统计手牌中这3张牌的数量（不含摸牌）
            const handCounts = countTiles(tiles.value)
            const handCount1 = handCounts[t1] || 0
            const handCount2 = handCounts[t2] || 0
            const handCount3 = handCounts[t3] || 0

            // 摸牌必须是这3张中的一张
            const normalizedTarget = normalizeRedFive(targetTile)
            if (
              (normalizedTarget === t1 && handCount1 >= 2 && handCount2 > 0 && handCount3 > 0) ||
              (normalizedTarget === t2 && handCount1 > 0 && handCount2 >= 2 && handCount3 > 0) ||
              (normalizedTarget === t3 && handCount1 > 0 && handCount2 > 0 && handCount3 >= 2)
            ) {
              combinations.push({
                tiles: sortTiles([t1, t2, t3]),
                type: `${num}-${num + 1}-${num + 2}`
              })
            }
          } else {
            // 没有指定目标牌，返回所有可能的顺子组合（需要至少2张在手中）
            const handCounts = countTiles(tiles.value)
            const handCount1 = handCounts[t1] || 0
            const handCount2 = handCounts[t2] || 0
            const handCount3 = handCounts[t3] || 0

            // 需要至少有2张
            if (
              (handCount1 >= 2 && handCount2 > 0 && handCount3 > 0) ||
              (handCount1 > 0 && handCount2 >= 2 && handCount3 > 0) ||
              (handCount1 > 0 && handCount2 > 0 && handCount3 >= 2)
            ) {
              // 返回顺子中已有2张的组合
              if (handCount1 >= 2 || handCount2 >= 2 || handCount3 >= 2) {
                combinations.push({
                  tiles: sortTiles([t1, t2, t3]),
                  type: `${num}-${num + 1}-${num + 2}`
                })
              }
            }
          }
        }
      }
    }

    return combinations
  }

  /**
   * 获取可以碰的组合
   * @returns 可碰的牌列表
   */
  function getPonCombinations(): { tile: string; count: number }[] {
    const counts = countTiles(tiles.value)
    const combinations: { tile: string; count: number }[] = []

    for (const [tile, count] of Object.entries(counts)) {
      if (count >= 3) {
        combinations.push({ tile, count })
      }
    }

    return combinations
  }

  /**
   * 获取可以杠的组合
   * @returns 可杠的牌列表
   */
  function getKanCombinations(): { tile: string; count: number }[] {
    const counts = countTiles(tiles.value)
    const combinations: { tile: string; count: number }[] = []

    for (const [tile, count] of Object.entries(counts)) {
      if (count >= 4) {
        combinations.push({ tile, count })
      }
    }

    return combinations
  }

  /**
   * 添加到牌河
   * @param tile 牌
   * @returns 是否添加成功
   */
  function addToRiver(tile: string): boolean {
    // 如果有摸牌，需要先处理摸牌
    if (drawTile.value) {
      // 摸牌必须先打出
      return false
    }

    const normalized = normalizeTiles([tile])[0]
    const idx = tiles.value.indexOf(normalized)

    if (idx === -1) {
      return false
    }

    // 移除手牌
    tiles.value.splice(idx, 1)

    // 添加到牌河
    river.value.push(normalized)

    return true
  }

  /**
   * 从牌河移除
   * @param index 索引
   */
  function removeFromRiver(index: number): void {
    if (index >= 0 && index < river.value.length) {
      const tile = river.value[index]
      river.value.splice(index, 1)
      tiles.value.push(tile)
      tiles.value = sortTiles(tiles.value)
    }
  }

  /**
   * 设置立直状态
   * @param liqi 是否立直
   */
  function setLiqi(liqi: boolean): void {
    // 副露后不能立直
    if (liqi && fulu.value.length > 0) {
      return
    }
    isLiqi.value = liqi
  }

  /**
   * 设置庄家
   * @param dealer 是否庄家
   */
  function setDealer(dealerFlag: boolean): void {
    dealer.value = dealerFlag
  }

  /**
   * 设置自风
   * @param wind 风
   */
  function setSelfWind(wind: Wind): void {
    selfWind.value = wind
  }

  /**
   * 设置场风
   * @param wind 风
   */
  function setFieldWind(wind: Wind): void {
    fieldWind.value = wind
  }

  /**
   * 设置宝牌
   * @param tiles 宝牌列表
   */
  function setDora(tiles: string[]): void {
    dora.value = normalizeTiles(tiles)
  }

  /**
   * 执行分析
   * 调用 mahjong.ts 中的算法分析手牌，并计算役种和番数
   */
  function analyze(): void {
    // 校验：检查每种牌的数量是否超过4张
    const all = allTiles.value
    const tileCounts: Record<string, number> = {}
    for (const tile of all) {
      tileCounts[tile] = (tileCounts[tile] || 0) + 1
      if (tileCounts[tile] > 4) {
        analysis.value = {
          isTing: false,
          isHu: false,
          tingPai: [],
          zhenTing: false,
          han: 0,
          yaku: [],
          error: `同一种牌不能超过4张：${tile}已有${tileCounts[tile]}张`
        }
        return
      }
    }

    // 需要14张牌才能分析（13张手牌+1张摸牌 或 14张手牌）
    if (all.length !== 13 && all.length !== 14) {
      analysis.value = {
        isTing: false,
        isHu: false,
        tingPai: [],
        zhenTing: false,
        han: 0,
        yaku: []
      }
      return
    }

    // 使用 mahjong.ts 的分析函数
    const result = analyzeHand(all, river.value)

    // 役种匹配
    let matchedYaku: YakuMatchResult[] = []

    // 只有胡牌后才能匹配役种
    if (result.isHu || result.isTing) {
      // 构建匹配输入
      const matchInput = {
        allTiles: all,
        isMenqian: isMenqian.value,
        isLiqi: isLiqi.value,
        isZimo: drawTile.value !== null, // 简化判断：有摸牌算自摸
        dealer: dealer.value,
        selfWind: selfWind.value,
        fieldWind: fieldWind.value,
        fulu: fulu.value as { type: 'chi' | 'pon' | 'kan'; tiles: string[]; from?: number }[],
        tingPai: result.tingPai,
        river: river.value
      }

      // 调用役种匹配
      matchedYaku = matchYaku(matchInput as any)

      // 计算总番数
      const totalHan = calculateHan(matchedYaku, isMenqian.value)

      analysis.value = {
        isTing: result.isTing,
        isHu: result.isHu,
        tingPai: result.tingPai,
        zhenTing: !result.isTing && result.tingPai.length > 0,
        han: totalHan,
        yaku: matchedYaku.filter((y) => y.matched).map((y) => y.name)
      }
    } else {
      analysis.value = {
        isTing: result.isTing,
        isHu: result.isHu,
        tingPai: result.tingPai,
        zhenTing: false,
        han: 0,
        yaku: []
      }
    }
  }

  // ==================== 持久化 ====================

  /**
   * 保存状态到 localStorage
   */
  function saveState(): void {
    const state = {
      tiles: tiles.value,
      drawTile: drawTile.value,
      fulu: fulu.value,
      river: river.value,
      isLiqi: isLiqi.value,
      dealer: dealer.value,
      selfWind: selfWind.value,
      fieldWind: fieldWind.value,
      dora: dora.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  /**
   * 从 localStorage 加载状态
   */
  function loadState(): void {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const state = JSON.parse(saved)
        tiles.value = state.tiles || []
        drawTile.value = state.drawTile || null
        fulu.value = state.fulu || []
        river.value = state.river || []
        isLiqi.value = state.isLiqi || false
        dealer.value = state.dealer || false
        selfWind.value = state.selfWind || 'd1'
        fieldWind.value = state.fieldWind || 'd1'
        dora.value = state.dora || []
      } catch {
        // 解析失败，忽略
      }
    }
  }

  // 监听状态变化，自动保存
  watch(
    [tiles, drawTile, fulu, river, isLiqi, dealer, selfWind, fieldWind, dora],
    () => {
      saveState()
    },
    { deep: true }
  )

  // 初始化时加载状态
  loadState()

  return {
    // State
    tiles,
    drawTile,
    fulu,
    river,
    isLiqi,
    dealer,
    selfWind,
    fieldWind,
    dora,
    analysis,
    fuluTemp,

    // Getters
    allTiles,
    tileCount,
    canLiqi,
    isMenqian,

    // Actions
    addTile,
    removeTile,
    setDrawTile,
    clear,
    randomHand,
    addFulu,
    removeFulu,
    toggleFuluType,
    addToRiver,
    removeFromRiver,
    setLiqi,
    setDealer,
    setSelfWind,
    setFieldWind,
    setDora,
    analyze,
    saveState,
    loadState,
    getChiCombinations,
    getPonCombinations,
    getKanCombinations,
    addToFuluTemp,
    removeFromFuluTemp,
    clearFuluTemp,
    commitFuluTemp
  }
})
