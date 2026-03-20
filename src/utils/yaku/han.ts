import type { YakuMatchResult } from './types'
import { normalizeYakuId } from './id'

const MENQIAN_ONLY_YAKU = new Set([
  'reach',
  'tsumo',
  'pinfu',
  'ipeikou',
  'ryanpeikou',
  'chitoitsu',
  'kokushimusou',
  'kokushimusoujuusanmen',
  'chuurenpuutou',
  'chuurenpuutoujyun'
])

/**
 * 计算总番数
 * @param matchedYaku 匹配的役种列表
 * @param isMenqian 是否门清
 * @returns 总番数
 */
export function calculateHan(matchedYaku: YakuMatchResult[], isMenqian: boolean): number {
  if (matchedYaku.length === 0) {
    return 0
  }

  const normalizedYaku = matchedYaku.map((y) => ({
    ...y,
    id: normalizeYakuId(y.id)
  }))

  const yakumanCount = normalizedYaku.filter((y) => y.han >= 8).length
  if (yakumanCount >= 1) {
    if (yakumanCount >= 2) {
      return yakumanCount * 8
    }
    return normalizedYaku.find((y) => y.han >= 8)?.han || 8
  }

  let totalHan = normalizedYaku.reduce((sum, yaku) => sum + yaku.han, 0)

  if (!isMenqian) {
    const hasReduction = normalizedYaku.some(
      (y) => !MENQIAN_ONLY_YAKU.has(y.id) && y.han >= 1 && y.han <= 2
    )
    if (hasReduction) {
      totalHan = Math.max(0, totalHan - 1)
    }
  }

  return totalHan >= 5 ? 5 : totalHan
}
