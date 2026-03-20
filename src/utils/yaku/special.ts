import {
  checkKokushimusou,
  checkKokushimusou13,
  checkChuurenpu,
  checkChuurenpu9,
  type Tile
} from '../mahjong'
import type { YakuMatchResult } from './types'

/**
 * 检测特殊役满（七对、国士、九莲）
 * 这些役种互斥，只能成立一个
 */
export function matchSpecialYaku(tiles: Tile[], isMenqian: boolean): YakuMatchResult[] {
  const results: YakuMatchResult[] = []

  if (isMenqian && checkKokushimusou13(tiles)) {
    results.push({
      id: 'kokushimusoujuusanmen',
      name: '国士无双十三面',
      han: 8,
      matched: true,
      reason: '13种幺九牌各1张的听牌状态'
    })
    return results
  }

  if (isMenqian && checkKokushimusou(tiles)) {
    results.push({
      id: 'kokushimusou',
      name: '国士无双',
      han: 8,
      matched: true,
      reason: '13种幺九牌各1张+1张幺九对子'
    })
    return results
  }

  if (isMenqian && checkChuurenpu9(tiles)) {
    results.push({
      id: 'chuurenpuutoujyun',
      name: '纯正九莲宝灯',
      han: 8,
      matched: true,
      reason: '九莲宝灯九面听状态'
    })
    return results
  }

  if (isMenqian && checkChuurenpu(tiles)) {
    results.push({
      id: 'chuurenpuutou',
      name: '九莲宝灯',
      han: 8,
      matched: true,
      reason: '同种数牌1112345678999+1张'
    })
    return results
  }

  return results
}
