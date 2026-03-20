import type { Tile } from './mahjong'

export interface FuluLike {
  type: 'chi' | 'pon' | 'kan'
  tiles: Tile[]
}

export interface AnalysisCountValidation {
  valid: boolean
  min: number
  max: number
  total: number
  message?: string
}

/**
 * 扁平化副露牌（用于总张数/役种统计）
 */
export function flattenFuluTiles(fulu: FuluLike[]): Tile[] {
  return fulu.flatMap((f) => f.tiles)
}

/**
 * 统计副露中的杠数量（每个杠会让总牌数 +1）
 */
export function getKanCount(fulu: FuluLike[]): number {
  return fulu.filter((f) => f.type === 'kan').length
}

/**
 * 合并手牌/摸牌与副露，得到当前牌局总牌集
 */
export function buildRoundTiles(handAndDrawTiles: Tile[], fulu: FuluLike[]): Tile[] {
  return [...handAndDrawTiles, ...flattenFuluTiles(fulu)]
}

/**
 * 校验分析入口的总张数：
 * - 常规：13 或 14
 * - 每个杠额外 +1
 */
export function validateAnalysisTileCount(totalTiles: Tile[], fulu: FuluLike[]): AnalysisCountValidation {
  const kanCount = getKanCount(fulu)
  const min = 13 + kanCount
  const max = 14 + kanCount
  const total = totalTiles.length

  if (total < min) {
    return {
      valid: false,
      min,
      max,
      total,
      message: `牌数不足，手牌+摸牌+副露 需要${max}张手牌，当前只有${total}张`
    }
  }

  if (total > max) {
    return {
      valid: false,
      min,
      max,
      total,
      message: `牌数过多，最多${max}张，当前有${total}张`
    }
  }

  return {
    valid: true,
    min,
    max,
    total
  }
}
