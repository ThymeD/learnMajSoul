/**
 * 麻将核心算法模块
 * 实现胡牌判定、听牌分析、面子分割等核心算法
 */

// ==================== 基础类型定义 ====================

/** 牌表示：'w1'~'w9'(万), 'b1'~'b9'(筒), 's1'~'s9'(索), 'd1'~'d4'(东南西北), 'z1'~'z3'(白中发), 'rw5'(赤五万), 'rb5'(赤五筒), 'rs5'(赤五索) */
export type Tile = string

/** 风牌：d1-东, d2-南, d3-西, d4-北 */
export type Wind = 'd1' | 'd2' | 'd3' | 'd4'

/** 三元牌：z1-白, z2-中, z3-发 */
export type Dragon = 'z1' | 'z2' | 'z3'

/** 面子类型：顺子、刻子、杠子 */
export type MentsuType = 'shunzi' | 'kezi' | 'gangzi'

/** 面子结构 */
export interface Mentsu {
  type: MentsuType
  /** 面子包含的牌 */
  tiles: [Tile, Tile, Tile] | [Tile, Tile, Tile, Tile]
}

/** 胡牌结果 */
export interface HuResult {
  /** 是否胡牌 */
  isHu: boolean
  /** 面子分割 */
  mentsu: Mentsu[]
  /** 雀头（对子） */
  jietou: Tile | null
}

/** 面子分割结果 */
export interface SplitResult {
  /** 面子列表 */
  mentsu: Mentsu[]
  /** 雀头 */
  jietou: Tile | null
}

// ==================== 常量定义 ====================

/** 牌的花色前缀 */
const SUIT_PREFIXES = ['w', 'b', 's', 'd', 'z'] as const

/** 数牌花色 */
const NUMBER_SUITS = ['w', 'b', 's'] as const

/** 字牌花色 */
const HONOR_SUITS = ['d', 'z'] as const

/** 幺九牌（用于国士无双） */
const YAOJIU_TILES: Tile[] = [
  'w1',
  'w9', // 万
  'b1',
  'b9', // 筒
  's1',
  's9', // 索
  'd1',
  'd2',
  'd3',
  'd4', // 风牌
  'z1',
  'z2',
  'z3' // 三元牌
]

/** 赤牌映射 */
const RED_FIVE_MAP: Record<string, Tile> = {
  rw5: 'w5',
  rb5: 'b5',
  rs5: 's5'
}

// ==================== 基础辅助函数 ====================

/**
 * 获取牌数字
 * w1->1, w9->9, d1->1, z1->1
 * @param tile 牌
 * @returns 牌数字
 */
export function getTileNumber(tile: Tile): number {
  const match = tile.match(/\d+/)
  if (!match) return -1
  return parseInt(match[0], 10)
}

/**
 * 获取牌花色
 * w-万, b-筒, s-索, d-字, z-三元
 * @param tile 牌
 * @returns 花色字母
 */
export function getTileSuit(tile: Tile): string {
  return tile.charAt(0)
}

/**
 * 检查是否为同一花色的数牌
 * @param tile1 牌1
 * @param tile2 牌2
 * @returns 是否同花色
 */
export function isSameSuit(tile1: Tile, tile2: Tile): boolean {
  return getTileSuit(tile1) === getTileSuit(tile2)
}

/**
 * 检查是否为顺子（数牌123-789）
 * @param tile 牌
 * @returns 是否为数牌
 */
export function isNumberTile(tile: Tile): boolean {
  const suit = getTileSuit(tile)
  return (NUMBER_SUITS as readonly string[]).includes(suit)
}

/**
 * 检查是否为字牌
 * @param tile 牌
 * @returns 是否为字牌
 */
export function isHonorTile(tile: Tile): boolean {
  const suit = getTileSuit(tile)
  return (HONOR_SUITS as readonly string[]).includes(suit)
}

/**
 * 检查是否为幺九牌
 * @param tile 牌
 * @returns 是否为幺九牌
 */
export function isYaojiu(tile: Tile): boolean {
  // 数牌1或9
  if (isNumberTile(tile)) {
    const num = getTileNumber(tile)
    return num === 1 || num === 9
  }
  // 字牌全部
  return isHonorTile(tile)
}

/**
 * 将赤牌转换为普通牌
 * @param tile 牌（可能含赤牌）
 * @returns 普通牌
 */
export function normalizeRedFive(tile: Tile): Tile {
  return RED_FIVE_MAP[tile] || tile
}

/**
 * 转换所有赤牌为普通牌
 * @param tiles 牌列表
 * @returns 转换后的牌列表
 */
export function normalizeTiles(tiles: Tile[]): Tile[] {
  return tiles.map(normalizeRedFive)
}

/**
 * 牌排序（花色内按数字排序）
 * 排序规则：先按花色(w,b,s,d,z)，同花色内按数字排序
 * @param tiles 牌列表
 * @returns 排序后的牌列表
 */
export function sortTiles(tiles: Tile[]): Tile[] {
  const normalized = normalizeTiles(tiles)
  return [...normalized].sort((a, b) => {
    const suitA = getTileSuit(a)
    const suitB = getTileSuit(b)
    if (suitA !== suitB) {
      return (
        SUIT_PREFIXES.indexOf(suitA as (typeof SUIT_PREFIXES)[number]) -
        SUIT_PREFIXES.indexOf(suitB as (typeof SUIT_PREFIXES)[number])
      )
    }
    return getTileNumber(a) - getTileNumber(b)
  })
}

/**
 * 排序手牌/摸牌展示用：按「标准化花色数字」排序，但保留赤牌 id（rw5 不会变成 w5）
 */
export function sortTilesPreserveRed(tiles: Tile[]): Tile[] {
  const rank = (t: Tile) => normalizeRedFive(t)
  return [...tiles].sort((a, b) => {
    const na = rank(a)
    const nb = rank(b)
    const suitA = getTileSuit(na)
    const suitB = getTileSuit(nb)
    if (suitA !== suitB) {
      return (
        SUIT_PREFIXES.indexOf(suitA as (typeof SUIT_PREFIXES)[number]) -
        SUIT_PREFIXES.indexOf(suitB as (typeof SUIT_PREFIXES)[number])
      )
    }
    const d = getTileNumber(na) - getTileNumber(nb)
    if (d !== 0) return d
    return a.localeCompare(b)
  })
}

/**
 * 统计每种牌的数量
 * @param tiles 牌列表
 * @returns 每种牌的数量映射
 */
export function countTiles(tiles: Tile[]): Record<Tile, number> {
  const normalized = normalizeTiles(tiles)
  const counts: Record<Tile, number> = {} as Record<Tile, number>
  for (const tile of normalized) {
    counts[tile] = (counts[tile] || 0) + 1
  }
  return counts
}

/**
 * 检查同种牌是否超4张
 * @param tiles 牌列表
 * @returns 是否合法（每种牌不超过4张）
 */
export function isValidTileCount(tiles: Tile[]): boolean {
  const counts = countTiles(tiles)
  return Object.values(counts).every((count) => count <= 4)
}

/**
 * 检查是否可以作为雀头（对子）
 * @param tile 牌
 * @returns 是否有对子
 */
export function canBeJietou(_tile: Tile): boolean {
  // 所有牌都可以作为雀头
  return true
}

/**
 * 获取牌的所有可能组合（用于面子检测）
 * @param tiles 牌列表
 * @returns 所有可能的面子组合
 */
export function getPossibleMentsu(tiles: Tile[]): Mentsu[] {
  const normalized = normalizeTiles(tiles)
  const result: Mentsu[] = []
  const counts = countTiles(normalized)

  // 1. 检测杠子（4张相同）
  for (const [tile, count] of Object.entries(counts)) {
    if (count >= 4) {
      const t = tile as Tile
      result.push({
        type: 'gangzi',
        tiles: [t, t, t, t]
      })
    }
  }

  // 2. 检测刻子（3张相同）
  for (const [tile, count] of Object.entries(counts)) {
    if (count >= 3) {
      const t = tile as Tile
      result.push({
        type: 'kezi',
        tiles: [t, t, t]
      })
    }
  }

  // 3. 检测顺子（数牌123-789）
  for (const tile of normalized) {
    if (!isNumberTile(tile)) continue

    const suit = getTileSuit(tile)
    const num = getTileNumber(tile)

    // 只能组成123-789的顺子
    if (num >= 1 && num <= 7) {
      const t1 = `${suit}${num}` as Tile
      const t2 = `${suit}${num + 1}` as Tile
      const t3 = `${suit}${num + 2}` as Tile

      // 检查这三种牌是否存在
      if (counts[t1] && counts[t2] && counts[t3]) {
        result.push({
          type: 'shunzi',
          tiles: [t1, t2, t3]
        })
      }
    }
  }

  return result
}

// ==================== 核心算法：胡牌判定 ====================

/**
 * 尝试从手牌中移除一个面子
 * @param tiles 牌列表（已排序）
 * @param mentsu 面子
 * @returns 移除面子后的牌列表
 */
function removeMentsu(tiles: Tile[], mentsu: Mentsu): Tile[] {
  let result = [...tiles]
  const mentsuTiles = [...mentsu.tiles]

  for (const tile of mentsuTiles) {
    const idx = result.indexOf(tile)
    if (idx !== -1) {
      result.splice(idx, 1)
    }
  }

  return result
}

/**
 * 递归检测是否能完成胡牌分割
 * @param tiles 牌列表（已排序，去除赤牌）
 * @returns 是否可以胡牌
 */
function canHuRecursive(tiles: Tile[]): boolean {
  // 基础情况：牌全部取完
  if (tiles.length === 0) {
    return true
  }

  // 如果剩余牌数不是 3 的倍数，说明分割失败
  // 正确情况：0, 3, 6, 9, 12（移除面子后）
  if (tiles.length % 3 !== 0) {
    return false
  }

  // 获取所有可能的面子
  const mentsuList = getPossibleMentsu(tiles)

  // 尝试移除每个面子
  for (const mentsu of mentsuList) {
    const remaining = removeMentsu(tiles, mentsu)
    if (canHuRecursive(remaining)) {
      return true
    }
  }

  return false
}

/**
 * 检测是否有雀头（对子）
 * @param tiles 牌列表
 * @returns 雀头列表
 */
export function findJietou(tiles: Tile[]): Tile[] {
  const counts = countTiles(tiles)
  const jietouList: Tile[] = []

  for (const [tile, count] of Object.entries(counts)) {
    if (count >= 2) {
      jietouList.push(tile as Tile)
    }
  }

  return jietouList
}

/**
 * 标准胡牌判定（4面子+1雀头=14张）
 * 支持：正常14张，杠后15张（4+4+4+3）
 * @param tiles 牌列表
 * @returns 胡牌结果
 */
export function checkHu(tiles: Tile[]): HuResult {
  // 预处理：排序和标准化
  const normalized = normalizeTiles(tiles)
  const sorted = sortTiles(normalized)

  // 检查牌数合法性
  if (!isValidTileCount(tiles)) {
    return { isHu: false, mentsu: [], jietou: null }
  }

  const tileCount = sorted.length

  // 牌数必须是14或15（考虑杠的情况）
  // 标准胡牌：4*3+2=14张
  // 杠后胡牌：3*3+4+2=15张 或 2*3+8+2=14张（两个杠）
  if (tileCount !== 14 && tileCount !== 15) {
    return { isHu: false, mentsu: [], jietou: null }
  }

  // 查找所有可能的雀头
  const jietouList = findJietou(sorted)

  // 尝试每个雀头
  for (const jietou of jietouList) {
    // 移除雀头
    let remaining = [...sorted]
    const jietouIdx = remaining.indexOf(jietou)
    remaining.splice(jietouIdx, 1)
    const jietouIdx2 = remaining.indexOf(jietou)
    remaining.splice(jietouIdx2, 1)

    // 检测剩余牌是否都是面子
    if (canHuRecursive(remaining)) {
      // 成功胡牌，构建完整的面子列表
      const mentsu = splitMentsuRecursive(sorted, jietou)
      if (mentsu) {
        return {
          isHu: true,
          mentsu,
          jietou
        }
      }
    }
  }

  return { isHu: false, mentsu: [], jietou: null }
}

/**
 * 递归分割面子（带雀头）
 * @param tiles 牌列表
 * @param jietou 雀头
 * @returns 面子列表或null
 */
function splitMentsuRecursive(tiles: Tile[], jietou: Tile): Mentsu[] | null {
  // 移除雀头
  let remaining = [...tiles]
  const idx1 = remaining.indexOf(jietou)
  remaining.splice(idx1, 1)
  const idx2 = remaining.indexOf(jietou)
  remaining.splice(idx2, 1)

  return splitMentsuRecursiveHelper(remaining, [])
}

/**
 * 递归辅助函数：分割剩余的牌
 * @param tiles 剩余牌列表
 * @param mentsuList 已分割的面子列表
 * @returns 面子列表或null
 */
function splitMentsuRecursiveHelper(tiles: Tile[], mentsuList: Mentsu[]): Mentsu[] | null {
  if (tiles.length === 0) {
    return mentsuList
  }

  // 获取所有可能的面子
  const mentsuOptions = getPossibleMentsu(tiles)

  for (const mentsu of mentsuOptions) {
    const remaining = removeMentsu(tiles, mentsu)
    const result = splitMentsuRecursiveHelper(remaining, [...mentsuList, mentsu])
    if (result) {
      return result
    }
  }

  return null
}

// ==================== 听牌分析 ====================

/**
 * 听牌分析 - 返回能胡的牌列表
 * @param hand 手牌
 * @param drawTile 摸到的牌（可选）
 * @returns 能胡的牌列表
 */
export function getTingPai(hand: Tile[], drawTile?: Tile | null): Tile[] {
  // 标准化手牌
  const normalized = normalizeTiles(hand)
  const sorted = sortTiles(normalized)

  // 如果有摸到的牌，加入手牌
  let allTiles = sorted
  if (drawTile !== undefined && drawTile !== null) {
    const normalizedDraw = normalizeRedFive(drawTile)
    allTiles = sortTiles([...sorted, normalizedDraw])
  }

  const tingPaiList: Tile[] = []

  // 14张牌：检查是否已经听牌（13张+1张）
  // 15张牌：检查杠后听牌

  // 尝试每种牌作为胡牌牌
  // 牌池：所有可能的牌
  const allPossibleTiles = getAllPossibleTiles()

  for (const tile of allPossibleTiles) {
    const testTiles = sortTiles([...allTiles, tile])
    const result = checkHu(testTiles)
    if (result.isHu) {
      tingPaiList.push(tile)
    }
  }

  return Array.from(new Set(tingPaiList))
}

/**
 * 获取所有可能的牌
 * @returns 所有牌型
 */
function getAllPossibleTiles(): Tile[] {
  const tiles: Tile[] = []

  // 数牌：万、筒、索 1-9
  for (const suit of ['w', 'b', 's']) {
    for (let num = 1; num <= 9; num++) {
      tiles.push(`${suit}${num}` as Tile)
    }
  }

  // 字牌：东南西北
  for (let i = 1; i <= 4; i++) {
    tiles.push(`d${i}` as Tile)
  }

  // 三元牌：白中发
  for (let i = 1; i <= 3; i++) {
    tiles.push(`z${i}` as Tile)
  }

  return tiles
}

// ==================== 面子分割 ====================

/**
 * 面子分割 - 返回所有可能的分割方式
 * @param tiles 牌列表
 * @returns 所有可能的分割方式
 */
export function splitMentsu(tiles: Tile[]): SplitResult[] {
  const normalized = normalizeTiles(tiles)
  const sorted = sortTiles(normalized)

  const results: SplitResult[] = []

  // 查找所有雀头
  const jietouList = findJietou(sorted)

  for (const jietou of jietouList) {
    // 移除雀头
    let remaining = [...sorted]
    const idx1 = remaining.indexOf(jietou)
    remaining.splice(idx1, 1)
    const idx2 = remaining.indexOf(jietou)
    remaining.splice(idx2, 1)

    // 尝试分割剩余的牌
    const mentsu = splitMentsuRecursiveHelper(remaining, [])
    if (mentsu) {
      results.push({
        mentsu,
        jietou
      })
    }
  }

  return results
}

// ==================== 特殊牌型判定 ====================

/**
 * 检查是否为国士无双（13种幺九牌各1张+任意1张幺九）
 * @param tiles 牌列表
 * @returns 是否为国士无双
 */
export function checkKokushimusou(tiles: Tile[]): boolean {
  const normalized = normalizeTiles(tiles)
  const sorted = sortTiles(normalized)

  // 必须是14张
  if (sorted.length !== 14) {
    return false
  }

  // 统计幺九牌数量
  const yaojiuCount = normalized.filter((t) => isYaojiu(t)).length
  if (yaojiuCount !== 14) {
    return false
  }

  // 必须包含所有13种幺九牌
  const yaojiuSet = new Set(normalized)
  for (const yaojiu of YAOJIU_TILES) {
    if (!yaojiuSet.has(yaojiu)) {
      return false
    }
  }

  // 检查是否有对子
  const counts = countTiles(normalized)
  const pairCount = Object.values(counts).filter((c) => c === 2).length

  return pairCount === 1
}

/**
 * 检查是否为国士无双十三面（13面听）
 * @param tiles 牌列表
 * @returns 是否为国士无双十三面
 */
export function checkKokushimusou13(tiles: Tile[]): boolean {
  const normalized = normalizeTiles(tiles)
  const sorted = sortTiles(normalized)

  // 必须是13张（听牌状态）
  if (sorted.length !== 13) {
    return false
  }

  // 检查是否包含所有13种幺九牌，且每种只有1张
  const counts = countTiles(normalized)

  for (const yaojiu of YAOJIU_TILES) {
    if (!counts[yaojiu] || counts[yaojiu] !== 1) {
      return false
    }
  }

  return true
}

/**
 * 检查是否为七对子（7组对子）
 * @param tiles 牌列表
 * @returns 是否为七对子
 */
export function checkChitoitsu(tiles: Tile[]): boolean {
  const normalized = normalizeTiles(tiles)

  // 必须是14张
  if (normalized.length !== 14) {
    return false
  }

  // 统计每种牌的数量
  const counts = countTiles(normalized)

  // 必须是7组对子
  const pairCount = Object.values(counts).filter((c) => c === 2).length
  const quadCount = Object.values(counts).filter((c) => c === 4).length

  // 4张牌可以算作2对（杠子算作2对）
  return pairCount + quadCount * 2 === 7
}

/**
 * 检查是否为九莲宝灯（1112345678999+任意同种）
 * @param tiles 牌列表
 * @returns 是否为九莲宝灯
 */
export function checkChuurenpu(tiles: Tile[]): boolean {
  const normalized = normalizeTiles(tiles)

  // 必须是14张
  if (normalized.length !== 14) {
    return false
  }

  // 尝试每种花色
  for (const suit of NUMBER_SUITS) {
    // 统计该花色的牌
    const suitTiles = normalized.filter((t) => getTileSuit(t) === suit)

    if (suitTiles.length !== 14) {
      continue
    }

    // 统计数字
    const counts: Record<number, number> = {}
    for (const tile of suitTiles) {
      const num = getTileNumber(tile)
      counts[num] = (counts[num] || 0) + 1
    }

    // 检查是否满足九莲宝灯牌型
    // 1112345678999 = 3+1+1+1+1+1+1+1+3 = 14
    if (
      counts[1] >= 3 &&
      counts[2] >= 1 &&
      counts[3] >= 1 &&
      counts[4] >= 1 &&
      counts[5] >= 1 &&
      counts[6] >= 1 &&
      counts[7] >= 1 &&
      counts[8] >= 1 &&
      counts[9] >= 3
    ) {
      return true
    }
  }

  return false
}

/**
 * 检查是否为九莲宝灯九面听
 * @param tiles 牌列表
 * @returns 是否为九莲宝灯九面听
 */
export function checkChuurenpu9(tiles: Tile[]): boolean {
  const normalized = normalizeTiles(tiles)

  // 必须是13张（听牌状态）
  if (normalized.length !== 13) {
    return false
  }

  // 尝试每种花色
  for (const suit of NUMBER_SUITS) {
    // 统计该花色的牌
    const suitTiles = normalized.filter((t) => getTileSuit(t) === suit)

    if (suitTiles.length !== 13) {
      continue
    }

    // 统计数字
    const counts: Record<number, number> = {}
    for (const tile of suitTiles) {
      const num = getTileNumber(tile)
      counts[num] = (counts[num] || 0) + 1
    }

    // 检查是否满足九莲宝灯听牌牌型
    // 1112345678999 = 3+1+1+1+1+1+1+1+2 = 13
    if (
      counts[1] >= 3 &&
      counts[2] >= 1 &&
      counts[3] >= 1 &&
      counts[4] >= 1 &&
      counts[5] >= 1 &&
      counts[6] >= 1 &&
      counts[7] >= 1 &&
      counts[8] >= 1 &&
      counts[9] >= 2
    ) {
      return true
    }
  }

  return false
}

// ==================== 振听判定 ====================

/**
 * 振听判定：听牌中有牌在牌河中则振听
 * @param tingPai 听牌列表
 * @param river 牌河（已打出的牌）
 * @returns 是否振听
 */
export function checkZhenTing(tingPai: Tile[], river: Tile[]): boolean {
  if (tingPai.length === 0) {
    return false
  }

  // 标准化牌河
  const normalizedRiver = normalizeTiles(river)
  const riverSet = new Set(normalizedRiver)

  // 检查每张听牌是否在牌河中
  for (const tile of tingPai) {
    const normalized = normalizeRedFive(tile)
    if (riverSet.has(normalized)) {
      return true
    }
  }

  return false
}

// ==================== 辅助函数：手牌分析 ====================

/**
 * 分析手牌类型
 * @param tiles 牌列表
 * @returns 手牌分析结果
 */
export interface HandAnalysis {
  isHu: boolean
  isTing: boolean
  tingPai: Tile[]
  isKokushimusou: boolean
  isKokushimusou13: boolean
  isChitoitsu: boolean
  isChuurenpu: boolean
  isChuurenpu9: boolean
  splitResult: SplitResult | null
}

/**
 * 完整手牌分析
 * @param tiles 牌列表
 * @param river 牌河（用于振听判断）
 * @returns 手牌分析结果
 */
export function analyzeHand(tiles: Tile[], river: Tile[] = []): HandAnalysis {
  const normalized = normalizeTiles(tiles)
  const sorted = sortTiles(normalized)

  // 检测各种特殊牌型
  const isKokushimusou = checkKokushimusou(sorted)
  const isKokushimusou13 = checkKokushimusou13(sorted)
  const isChitoitsu = checkChitoitsu(sorted)
  const isChuurenpu = checkChuurenpu(sorted)
  const isChuurenpu9 = checkChuurenpu9(sorted)

  // 标准胡牌检测
  const huResult = checkHu(sorted)
  const isHu = huResult.isHu || isKokushimusou || isChitoitsu || isChuurenpu

  // 听牌检测
  let tingPai: Tile[] = []
  let isTing = false

  if (!isHu) {
    tingPai = getTingPai(sorted)
    isTing = tingPai.length > 0

    // 检查振听
    if (isTing) {
      isTing = !checkZhenTing(tingPai, river)
    }
  }

  return {
    isHu,
    isTing,
    tingPai,
    isKokushimusou,
    isKokushimusou13,
    isChitoitsu,
    isChuurenpu,
    isChuurenpu9,
    splitResult: isHu ? { mentsu: huResult.mentsu, jietou: huResult.jietou } : null
  }
}
