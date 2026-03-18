/**
 * 随机生成可胡牌牌型算法
 * 策略：先生成随机面子分割，再填充剩余牌
 */

import { sortTiles, normalizeTiles, checkHu, type Tile } from './mahjong'

// ==================== 类型定义 ====================

export interface RandomHandResult {
  /** 手牌 */
  tiles: Tile[]
  /** 摸牌 */
  drawTile: Tile | null
  /** 副露 */
  fulu: Fulu[]
}

export interface Fulu {
  type: 'chi' | 'pon' | 'kan'
  tiles: Tile[]
  from?: number
  isOpen?: boolean
}

// ==================== 常量定义 ====================

/** 所有数牌花色 */
const NUMBER_SUITS = ['w', 'b', 's'] as const

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

// ==================== 辅助函数 ====================

/**
 * 随机选择数组中的一个元素
 */
function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 随机获取数组的一个索引
 */
function randomIndex(arr: unknown[]): number {
  return Math.floor(Math.random() * arr.length)
}

/**
 * 从数组中随机移除一个元素
 */
function spliceRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  const idx = randomIndex(arr)
  return arr.splice(idx, 1)[0]
}

/**
 * 创建完整牌池（每种4张）
 */
function createFullPool(): Tile[] {
  const pool: Tile[] = []
  for (let i = 0; i < 4; i++) {
    pool.push(...ALL_POSSIBLE_TILES)
  }
  return pool
}

// ==================== 核心算法 ====================

/**
 * 生成随机雀头（对子）
 */
function generateJietou(pool: Tile[]): Tile[] | null {
  // 统计牌池中每种牌的数量
  const counts: Record<Tile, number> = {}
  for (const tile of pool) {
    counts[tile] = (counts[tile] || 0) + 1
  }

  // 找到所有有2张以上的牌
  const candidates = Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([tile]) => tile as Tile)

  if (candidates.length === 0) {
    return null
  }

  // 随机选择一个作为雀头
  const jietouTile = randomChoice(candidates)

  // 从牌池中移除2张
  let removed = 0
  for (let i = pool.length - 1; i >= 0 && removed < 2; i--) {
    if (pool[i] === jietouTile) {
      pool.splice(i, 1)
      removed++
    }
  }

  return [jietouTile, jietouTile]
}

/**
 * 生成随机顺子
 */
function generateShunzi(pool: Tile[]): Tile[] | null {
  const suit = randomChoice(NUMBER_SUITS)
  const start = Math.floor(Math.random() * 7) + 1 // 1-7

  const t1 = `${suit}${start}` as Tile
  const t2 = `${suit}${start + 1}` as Tile
  const t3 = `${suit}${start + 2}` as Tile

  // 检查牌池中是否有足够的牌
  const counts: Record<Tile, number> = {}
  for (const tile of pool) {
    counts[tile] = (counts[tile] || 0) + 1
  }

  if ((counts[t1] || 0) < 1 || (counts[t2] || 0) < 1 || (counts[t3] || 0) < 1) {
    return null
  }

  // 从牌池中移除
  for (const t of [t1, t2, t3]) {
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i] === t) {
        pool.splice(i, 1)
        break
      }
    }
  }

  return [t1, t2, t3]
}

/**
 * 生成随机刻子
 */
function generateKezi(pool: Tile[]): Tile[] | null {
  // 统计牌池中每种牌的数量
  const counts: Record<Tile, number> = {}
  for (const tile of pool) {
    counts[tile] = (counts[tile] || 0) + 1
  }

  // 找到所有有3张以上的牌
  const candidates = Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .map(([tile]) => tile as Tile)

  if (candidates.length === 0) {
    return null
  }

  // 随机选择一个作为刻子
  const keziTile = randomChoice(candidates)

  // 从牌池中移除3张
  let removed = 0
  for (let i = pool.length - 1; i >= 0 && removed < 3; i--) {
    if (pool[i] === keziTile) {
      pool.splice(i, 1)
      removed++
    }
  }

  return [keziTile, keziTile, keziTile]
}

/**
 * 生成随机杠子
 */
function generateGangzi(pool: Tile[]): Tile[] | null {
  // 统计牌池中每种牌的数量
  const counts: Record<Tile, number> = {}
  for (const tile of pool) {
    counts[tile] = (counts[tile] || 0) + 1
  }

  // 找到所有有4张以上的牌
  const candidates = Object.entries(counts)
    .filter(([, count]) => count >= 4)
    .map(([tile]) => tile as Tile)

  if (candidates.length === 0) {
    return null
  }

  // 随机选择一个作为杠子
  const gangTile = randomChoice(candidates)

  // 从牌池中移除4张
  let removed = 0
  for (let i = pool.length - 1; i >= 0 && removed < 4; i--) {
    if (pool[i] === gangTile) {
      pool.splice(i, 1)
      removed++
    }
  }

  return [gangTile, gangTile, gangTile, gangTile]
}

/**
 * 随机生成可胡牌牌型（核心算法）
 * 策略：先随机生成4组面子+1个雀头，然后验证是否能胡牌
 */
export function generateRandomHuHand(
  options: {
    includeFulu?: boolean
    maxAttempts?: number
  } = {}
): RandomHandResult {
  const { includeFulu = false, maxAttempts = 100 } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 创建牌池副本
    const pool = createFullPool()

    // 1. 生成雀头
    const jietou = generateJietou(pool)
    if (!jietou) continue

    // 2. 随机生成4组面子
    const mentsu: Tile[][] = []
    for (let i = 0; i < 4; i++) {
      // 随机选择面子类型
      const mentsuType = Math.random()

      let tiles: Tile[] | null = null

      if (mentsuType < 0.4) {
        // 40% 概率顺子
        tiles = generateShunzi(pool)
      } else if (mentsuType < 0.8) {
        // 40% 概率刻子
        tiles = generateKezi(pool)
      } else {
        // 20% 概率杠子
        tiles = generateGangzi(pool)
      }

      if (!tiles) {
        // 如果生成失败，尝试其他类型
        tiles = generateShunzi(pool)
        if (!tiles) {
          tiles = generateKezi(pool)
        }
      }

      if (tiles) {
        mentsu.push(tiles)
      }
    }

    // 3. 组合成完整手牌
    const allTiles = [...jietou, ...mentsu.flat()]

    // 4. 验证胡牌
    const normalized = normalizeTiles(allTiles)
    const sorted = sortTiles(normalized)
    const huResult = checkHu(sorted)

    if (huResult.isHu) {
      // 随机选择是否生成摸牌
      const drawTile = Math.random() > 0.5 ? spliceRandom(pool) || null : null

      // 如果需要副露，随机拆分部分面子为副露
      const fulu: Fulu[] = []
      if (includeFulu && mentsu.length > 0 && Math.random() > 0.5) {
        // 随机选择1-2组面子作为副露
        const numFulu = Math.floor(Math.random() * 2) + 1
        for (let i = 0; i < numFulu && mentsu.length > 1; i++) {
          const mentsuIndex = Math.floor(Math.random() * mentsu.length)
          const fuluTiles = mentsu.splice(mentsuIndex, 1)[0]

          if (fuluTiles.length === 3) {
            fulu.push({
              type: 'pon',
              tiles: fuluTiles
            })
          } else if (fuluTiles.length === 4) {
            fulu.push({
              type: 'kan',
              tiles: fuluTiles,
              isOpen: true
            })
          }
        }
      }

      return {
        tiles: sorted,
        drawTile,
        fulu
      }
    }
  }

  // 如果多次尝试失败，使用简化算法：基于已知可胡牌牌型变换
  return generateSimpleHuHand()
}

/**
 * 简化算法：基于七对子或普通牌型生成
 */
function generateSimpleHuHand(): RandomHandResult {
  const pool = createFullPool()

  // 随机选择生成七对子或普通牌型
  if (Math.random() > 0.5) {
    // 生成七对子
    const pairs: Tile[] = []

    while (pairs.length < 14) {
      const jietou = generateJietou(pool)
      if (!jietou) break
      pairs.push(...jietou)
    }

    if (pairs.length === 14) {
      const sorted = sortTiles(pairs)
      const huResult = checkHu(sorted)
      if (huResult.isHu) {
        return {
          tiles: sorted,
          drawTile: null,
          fulu: []
        }
      }
    }
  }

  // 生成普通牌型
  const jietou = generateJietou(pool)
  if (!jietou) {
    // 兜底：返回随机牌
    const tiles = pool.splice(0, 14)
    return {
      tiles: sortTiles(tiles.slice(0, 13)),
      drawTile: tiles[13] || null,
      fulu: []
    }
  }

  const mentsu: Tile[][] = []
  for (let i = 0; i < 4; i++) {
    const tiles = generateKezi(pool) || generateShunzi(pool)
    if (tiles) {
      mentsu.push(tiles)
    }
  }

  const allTiles = [...jietou, ...mentsu.flat()]
  const sorted = sortTiles(allTiles)

  const resultTiles = sorted.length >= 14 ? sorted.slice(0, 14) : sorted
  return {
    tiles: resultTiles.slice(0, 13),
    drawTile: resultTiles[13] || null,
    fulu: []
  }
}

// 导出便捷函数
export function randomHand(): RandomHandResult {
  return generateRandomHuHand({ includeFulu: false })
}

export function randomHandWithFulu(): RandomHandResult {
  return generateRandomHuHand({ includeFulu: true })
}
