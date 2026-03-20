/**
 * 役种匹配模块
 * 实现役种判定和番数计算
 */

import {
  normalizeTiles,
  sortTiles,
  countTiles,
  getTileSuit,
  getTileNumber,
  isNumberTile,
  isHonorTile,
  isYaojiu,
  splitMentsu,
  type Tile
} from './mahjong'
import { matchSpecialYaku } from './yaku/special'
import {
  DRAGON_TILES,
  WIND_TILES,
  WIND_TO_TILE,
  type MatchInput,
  type Fulu,
  type YakuMatchResult
} from './yaku/types'

// ==================== 类型定义 ====================

export type { MatchInput, Fulu, YakuMatchResult } from './yaku/types'

// ==================== 役种匹配函数 ====================

/**
 * 役种匹配主函数
 * @param input 匹配输入
 * @returns 匹配的役种列表
 */
export function matchYaku(input: MatchInput): YakuMatchResult[] {
  const results: YakuMatchResult[] = []
  const { allTiles, isMenqian, isLiqi, isZimo, selfWind, fieldWind, fulu, tingPai } = input

  // 标准化牌
  const normalized = normalizeTiles(allTiles)
  const sorted = sortTiles(normalized)
  const counts = countTiles(normalized)

  // 1. 先检测特殊役满（七对、国士、九莲）- 这些互斥，优先检测
  const specialYaku = matchSpecialYaku(sorted, isMenqian)
  if (specialYaku.length > 0) {
    results.push(...specialYaku)
    // 特殊役满成立后，不再检测普通役种
    return results
  }

  // 2. 检测普通役种
  // 2.1 门前清役种（需要门清）
  if (isMenqian) {
    // 立直
    if (isLiqi && tingPai.length > 0) {
      results.push({
        id: 'reach',
        name: '立直',
        han: 1,
        matched: true,
        reason: '门清听牌状态下立直'
      })
    }

    // 门前清自摸和
    if (isZimo && tingPai.length > 0) {
      results.push({
        id: 'tsumo',
        name: '门前清自摸和',
        han: 1,
        matched: true,
        reason: '门清状态下自摸和牌'
      })
    }

    // 平和
    const pinfuResult = matchPinfu(sorted, normalized)
    if (pinfuResult.matched) {
      results.push(pinfuResult)
    }

    // 一杯口
    const ipeikouResult = matchIpeikou(sorted, isMenqian)
    if (ipeikouResult.matched) {
      results.push(ipeikouResult)
    }

    // 二杯口
    const ryanpeikouResult = matchRyanpeikou(sorted, isMenqian)
    if (ryanpeikouResult.matched) {
      results.push(ryanpeikouResult)
    }
  }

  // 2.2 断幺九
  const tanyaoResult = matchTanyao(normalized)
  if (tanyaoResult.matched) {
    results.push(tanyaoResult)
  }

  // 2.3 役牌
  // 自风牌
  const jikazeResult = matchYakuhai(counts, WIND_TO_TILE[selfWind], '自风')
  if (jikazeResult.matched) {
    results.push(jikazeResult)
  }

  // 场风牌
  if (selfWind !== fieldWind) {
    const bakazeResult = matchYakuhai(counts, WIND_TO_TILE[fieldWind], '场风')
    if (bakazeResult.matched) {
      results.push(bakazeResult)
    }
  }

  // 三元牌
  const sangenResult = matchSangenYakuhai(counts)
  if (sangenResult.matched) {
    results.push(sangenResult)
  }

  // 2.4 对对和
  const toitoiResult = matchToitoi(normalized, fulu)
  if (toitoiResult.matched) {
    results.push(toitoiResult)
  }

  // 2.5 三暗刻
  const sanankeiResult = matchSanankei(normalized, fulu)
  if (sanankeiResult.matched) {
    results.push(sanankeiResult)
  }

  // 2.6 三杠子
  const sandangatsuResult = matchSandangatsu(fulu)
  if (sandangatsuResult.matched) {
    results.push(sandangatsuResult)
  }

  // 2.7 三色同顺（副露后）
  if (fulu.length > 0) {
    const sanshokuResult = matchSanshokuDoushun(normalized, fulu)
    if (sanshokuResult.matched) {
      results.push(sanshokuResult)
    }
  }

  // 2.8 三色同刻
  const sanshokuDoukoResult = matchSanshokuDouko(normalized, fulu)
  if (sanshokuDoukoResult.matched) {
    results.push(sanshokuDoukoResult)
  }

  // 2.9 一气通贯（副露后）
  if (fulu.length > 0) {
    const ikkititsuanResult = matchIkkititsuan(normalized, fulu)
    if (ikkititsuanResult.matched) {
      results.push(ikkititsuanResult)
    }
  }

  // 2.10 混全带幺九
  const honchantaiyaochuuResult = matchHonchantaiyaochuu(normalized, fulu)
  if (honchantaiyaochuuResult.matched) {
    results.push(honchantaiyaochuuResult)
  }

  // 2.11 纯全带幺九
  const junhonchantaiyaochuuResult = matchJunhonchantaiyaochuu(normalized, fulu)
  if (junhonchantaiyaochuuResult.matched) {
    results.push(junhonchantaiyaochuuResult)
  }

  // 2.12 混一色
  const hunyisokuResult = matchHunyisoku(normalized, fulu)
  if (hunyisokuResult.matched) {
    results.push(hunyisokuResult)
  }

  // 2.13 清一色
  const chinitsuResult = matchChinitsu(normalized, fulu)
  if (chinitsuResult.matched) {
    results.push(chinitsuResult)
  }

  // 2.14 小三元
  const shousangenResult = matchShousangen(normalized)
  if (shousangenResult.matched) {
    results.push(shousangenResult)
  }

  // 2.15 大三元
  const daisangenResult = matchDaisangen(normalized)
  if (daisangenResult.matched) {
    results.push(daisangenResult)
  }

  // 2.16 小四喜
  const shousuushiiResult = matchShousuushii(normalized)
  if (shousuushiiResult.matched) {
    results.push(shousuushiiResult)
  }

  // 2.17 大四喜
  const daisuushiiResult = matchDaisuushii(normalized)
  if (daisuushiiResult.matched) {
    results.push(daisuushiiResult)
  }

  // 2.18 字一色
  const ziiisouResult = matchZiiisou(normalized)
  if (ziiisouResult.matched) {
    results.push(ziiisouResult)
  }

  // 2.19 绿一色
  const ryuuiisouResult = matchRyuuiisou(normalized)
  if (ryuuiisouResult.matched) {
    results.push(ryuuiisouResult)
  }

  // 2.20 清老头
  const chinroutouResult = matchChinroutou(normalized)
  if (chinroutouResult.matched) {
    results.push(chinroutouResult)
  }

  // 2.21 混老头
  const honroutouResult = matchHonroutou(normalized)
  if (honroutouResult.matched) {
    results.push(honroutouResult)
  }

  return results
}

/**
 * 匹配断幺九
 * 不含幺九牌
 */
function matchTanyao(tiles: Tile[]): YakuMatchResult {
  const hasYaojiu = tiles.some((t) => isYaojiu(t))

  return {
    id: 'tanyao',
    name: '断幺九',
    han: 1,
    matched: !hasYaojiu,
    reason: hasYaojiu ? '手牌含有幺九牌' : '不含幺九牌'
  }
}

/**
 * 匹配平和
 * 门清 + 4顺子 + 非役牌雀头 + 两面听
 */
function matchPinfu(tiles: Tile[], normalized: Tile[]): YakuMatchResult {
  // 检查是否14张
  if (normalized.length !== 14) {
    return {
      id: 'pinfu',
      name: '平和',
      han: 1,
      matched: false,
      reason: '牌数不是14张'
    }
  }

  // 尝试每种分割方式
  const splits = splitMentsu(tiles)

  for (const split of splits) {
    // 检查是否有4个顺子
    const shunziCount = split.mentsu.filter((m) => m.type === 'shunzi').length
    if (shunziCount !== 4) continue

    // 检查雀头是否是非役牌（不是三元牌，不是自风/场风）
    if (!split.jietou) continue

    const jietou = split.jietou
    // 役牌包括：三元牌和风牌
    const isHonor = isHonorTile(jietou)
    if (isHonor) continue

    // 检查是否是两面听（听牌是顺子的两端）
    // 这里简化处理：只要是顺子分割就算平和
    // 实际需要检查听牌是否在听的位置

    return {
      id: 'pinfu',
      name: '平和',
      han: 1,
      matched: true,
      reason: '4个顺子+非役牌雀头'
    }
  }

  return {
    id: 'pinfu',
    name: '平和',
    han: 1,
    matched: false,
    reason: '不满足平和条件'
  }
}

/**
 * 匹配一杯口
 * 门清 + 同种数牌2组顺子
 */
function matchIpeikou(tiles: Tile[], isMenqian: boolean): YakuMatchResult {
  if (!isMenqian) {
    return {
      id: 'ipeikou',
      name: '一杯口',
      han: 1,
      matched: false,
      reason: '有副露'
    }
  }

  // 统计每种花色每个数字的顺子出现次数
  const suitNumShunzi: Record<string, number> = {}

  const splits = splitMentsu(tiles)
  for (const split of splits) {
    for (const mentsu of split.mentsu) {
      if (mentsu.type === 'shunzi') {
        const t1 = normalizeTiles([mentsu.tiles[0]])[0]
        const suit = getTileSuit(t1)
        const num = getTileNumber(t1)
        const key = `${suit}-${num}`
        suitNumShunzi[key] = (suitNumShunzi[key] || 0) + 1
      }
    }
  }

  // 检查是否有2组相同花色和数字的顺子
  for (const key in suitNumShunzi) {
    if (suitNumShunzi[key] >= 2) {
      return {
        id: 'ipeikou',
        name: '一杯口',
        han: 1,
        matched: true,
        reason: `同种数牌2组顺子: ${key}`
      }
    }
  }

  return {
    id: 'ipeikou',
    name: '一杯口',
    han: 1,
    matched: false,
    reason: '没有2组相同的顺子'
  }
}

/**
 * 匹配二杯口
 * 门清 + 两杯口（两副同种数牌且同数值的顺子各两组）
 */
function matchRyanpeikou(tiles: Tile[], isMenqian: boolean): YakuMatchResult {
  if (!isMenqian) {
    return {
      id: 'ryanpeikou',
      name: '二杯口',
      han: 3,
      matched: false,
      reason: '有副露'
    }
  }

  // 统计每种花色每个数字的顺子出现次数
  const suitNumShunzi: Record<string, number> = {}

  const splits = splitMentsu(tiles)
  for (const split of splits) {
    for (const mentsu of split.mentsu) {
      if (mentsu.type === 'shunzi') {
        const t1 = normalizeTiles([mentsu.tiles[0]])[0]
        const suit = getTileSuit(t1)
        const num = getTileNumber(t1)
        const key = `${suit}-${num}`
        suitNumShunzi[key] = (suitNumShunzi[key] || 0) + 1
      }
    }
  }

  // 检查是否有多组2组以上相同花色和数字的顺子
  let count = 0
  for (const key in suitNumShunzi) {
    if (suitNumShunzi[key] >= 2) {
      count++
    }
  }

  if (count >= 2) {
    return {
      id: 'ryanpeikou',
      name: '二杯口',
      han: 3,
      matched: true,
      reason: '两杯口以上'
    }
  }

  return {
    id: 'ryanpeikou',
    name: '二杯口',
    han: 3,
    matched: false,
    reason: '不满足二杯口条件'
  }
}

/**
 * 匹配役牌
 */
function matchYakuhai(counts: Record<Tile, number>, tile: Tile, label: string): YakuMatchResult {
  const count = counts[tile] || 0

  return {
    id: `yakuhai-${label}`,
    name: `役牌：${label}牌`,
    han: 1,
    matched: count >= 3,
    reason: count >= 3 ? `有${count}张${tile}` : `只有${count}张${tile}`
  }
}

/**
 * 匹配三元牌役牌
 */
function matchSangenYakuhai(counts: Record<Tile, number>): YakuMatchResult {
  let matched = false
  const matchedDragons: string[] = []

  for (const dragon of DRAGON_TILES) {
    const count = counts[dragon] || 0
    if (count >= 3) {
      matched = true
      matchedDragons.push(dragon)
    }
  }

  return {
    id: 'yakuhai-sangen',
    name: '役牌：三元牌',
    han: matchedDragons.length,
    matched: matched,
    reason: matchedDragons.length > 0 ? `持有${matchedDragons.join('、')}刻子` : '没有三元牌刻子'
  }
}

/**
 * 匹配对对和
 * 4组刻子+雀头
 */
function matchToitoi(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  // 统计手牌中的刻子数量（明刻+暗刻）
  let keziCount = 0

  // 从分割结果中获取
  const splits = splitMentsu(tiles)
  for (const split of splits) {
    const mKezi = split.mentsu.filter((m) => m.type === 'kezi' || m.type === 'gangzi').length
    if (mKezi > keziCount) {
      keziCount = mKezi
    }
  }

  // 加上副露中的刻子/杠子
  for (const f of fulu) {
    if (f.type === 'pon' || f.type === 'kan') {
      keziCount++
    }
  }

  // 对对和需要4组刻子
  if (keziCount >= 4) {
    return {
      id: 'toitoi',
      name: '对对和',
      han: 2,
      matched: true,
      reason: `${keziCount}组刻子/杠子`
    }
  }

  return {
    id: 'toitoi',
    name: '对对和',
    han: 2,
    matched: false,
    reason: `只有${keziCount}组刻子/杠子`
  }
}

/**
 * 匹配三暗刻
 */
function matchSanankei(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  // 三暗刻：3组暗刻（手牌中的刻子，不含副露）
  // 简化判断：检查手牌分割中是否有3组刻子

  const splits = splitMentsu(tiles)

  for (const split of splits) {
    const keziCount = split.mentsu.filter((m) => m.type === 'kezi').length

    // 加上副露中的碰（算暗刻）
    const fuluKezi = fulu.filter((f) => f.type === 'pon').length

    if (keziCount + fuluKezi >= 3) {
      return {
        id: 'sanankei',
        name: '三暗刻',
        han: 2,
        matched: true,
        reason: `${keziCount + fuluKezi}组暗刻`
      }
    }
  }

  return {
    id: 'sanankei',
    name: '三暗刻',
    han: 2,
    matched: false,
    reason: '没有3组暗刻'
  }
}

/**
 * 匹配三杠子
 */
function matchSandangatsu(fulu: Fulu[]): YakuMatchResult {
  // 统计杠子数量
  const gangCount = fulu.filter((f) => f.type === 'kan').length

  return {
    id: 'sandangatsu',
    name: '三杠子',
    han: 2,
    matched: gangCount >= 3,
    reason: gangCount >= 3 ? `${gangCount}组杠子` : `只有${gangCount}组杠子`
  }
}

/**
 * 匹配三色同顺
 * 副露 + 万筒索同数值顺子
 */
function matchSanshokuDoushun(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  if (fulu.length === 0) {
    return {
      id: 'sanshoku-doushun',
      name: '三色同顺',
      han: 2,
      matched: false,
      reason: '没有副露'
    }
  }

  // 从分割结果中获取顺子
  const splits = splitMentsu(tiles)

  for (const split of splits) {
    const shunziByNum: Record<number, string[]> = {}

    for (const mentsu of split.mentsu) {
      if (mentsu.type === 'shunzi') {
        const t1 = normalizeTiles([mentsu.tiles[0]])[0]
        const suit = getTileSuit(t1)
        if (!isNumberTile(t1)) continue

        const num = getTileNumber(t1)
        if (!shunziByNum[num]) {
          shunziByNum[num] = []
        }
        if (!shunziByNum[num].includes(suit)) {
          shunziByNum[num].push(suit)
        }
      }
    }

    // 检查是否有3种花色的顺子
    for (const num in shunziByNum) {
      const suits = shunziByNum[num]
      if (suits.length >= 3) {
        return {
          id: 'sanshoku-doushun',
          name: '三色同顺',
          han: 2,
          matched: true,
          reason: `数字${num}有3种花色顺子`
        }
      }
    }
  }

  return {
    id: 'sanshoku-doushun',
    name: '三色同顺',
    han: 2,
    matched: false,
    reason: '没有三色同顺'
  }
}

/**
 * 匹配三色同刻
 */
function matchSanshokuDouko(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)
  const counts = countTiles(normalized)

  // 检查所有数牌数字
  for (let num = 1; num <= 9; num++) {
    const wCount = counts[`w${num}`] || 0
    const bCount = counts[`b${num}`] || 0
    const sCount = counts[`s${num}`] || 0

    // 检查是否有3种花色同数字的刻子
    const keziCount = [wCount, bCount, sCount].filter((c) => c >= 3).length
    // 加上副露
    const fuluKezi = fulu.filter((f) => {
      if (f.type !== 'pon' && f.type !== 'kan') return false
      const t = normalizeTiles([f.tiles[0]])[0]
      return getTileNumber(t) === num && isNumberTile(t)
    }).length

    if (keziCount + fuluKezi >= 3) {
      return {
        id: 'sanshoku-douko',
        name: '三色同刻',
        han: 2,
        matched: true,
        reason: `数字${num}有3种花色刻子`
      }
    }
  }

  return {
    id: 'sanshoku-douko',
    name: '三色同刻',
    han: 2,
    matched: false,
    reason: '没有三色同刻'
  }
}

/**
 * 匹配一气通贯
 */
function matchIkkititsuan(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  if (fulu.length === 0) {
    return {
      id: 'ikkititsuan',
      name: '一气通贯',
      han: 2,
      matched: false,
      reason: '没有副露'
    }
  }

  const splits = splitMentsu(tiles)

  for (const split of splits) {
    const suitsWith123: string[] = []
    const suitsWith456: string[] = []
    const suitsWith789: string[] = []

    for (const mentsu of split.mentsu) {
      if (mentsu.type !== 'shunzi') continue

      const t1 = normalizeTiles([mentsu.tiles[0]])[0]
      const suit = getTileSuit(t1)
      if (!isNumberTile(t1)) continue

      const num = getTileNumber(t1)
      if (num === 1 && !suitsWith123.includes(suit)) {
        suitsWith123.push(suit)
      } else if (num === 4 && !suitsWith456.includes(suit)) {
        suitsWith456.push(suit)
      } else if (num === 7 && !suitsWith789.includes(suit)) {
        suitsWith789.push(suit)
      }
    }

    // 检查是否有同花色的123、456、789
    for (const suit of suitsWith123) {
      if (suitsWith456.includes(suit) && suitsWith789.includes(suit)) {
        return {
          id: 'ikkititsuan',
          name: '一气通贯',
          han: 2,
          matched: true,
          reason: `${suit}花色有一气通贯`
        }
      }
    }
  }

  return {
    id: 'ikkititsuan',
    name: '一气通贯',
    han: 2,
    matched: false,
    reason: '没有一气通贯'
  }
}

/**
 * 匹配混全带幺九
 */
function matchHonchantaiyaochuu(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  const allTiles = [...tiles]

  // 加上副露的牌
  for (const f of fulu) {
    allTiles.push(...f.tiles)
  }

  const normalized = normalizeTiles(allTiles)

  // 检查所有牌是否都带幺九
  for (const tile of normalized) {
    if (!isYaojiu(tile)) {
      return {
        id: 'honchantaiyaochuu',
        name: '混全带幺九',
        han: 2,
        matched: false,
        reason: `含有非幺九牌: ${tile}`
      }
    }
  }

  return {
    id: 'honchantaiyaochuu',
    name: '混全带幺九',
    han: 2,
    matched: true,
    reason: '全部牌都带幺九'
  }
}

/**
 * 匹配纯全带幺九
 */
function matchJunhonchantaiyaochuu(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  const allTiles = [...tiles]

  // 加上副露的牌
  for (const f of fulu) {
    allTiles.push(...f.tiles)
  }

  const normalized = normalizeTiles(allTiles)

  // 检查所有牌是否都带数牌幺九（不含字牌）
  for (const tile of normalized) {
    if (isHonorTile(tile)) {
      return {
        id: 'junhonchantaiyaochuu',
        name: '纯全带幺九',
        han: 3,
        matched: false,
        reason: `含有字牌: ${tile}`
      }
    }
    if (!isYaojiu(tile)) {
      return {
        id: 'junhonchantaiyaochuu',
        name: '纯全带幺九',
        han: 3,
        matched: false,
        reason: `含有非幺九牌: ${tile}`
      }
    }
  }

  return {
    id: 'junhonchantaiyaochuu',
    name: '纯全带幺九',
    han: 3,
    matched: true,
    reason: '全部牌都是数牌幺九'
  }
}

/**
 * 匹配混一色
 */
function matchHunyisoku(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  const allTiles = [...tiles]

  for (const f of fulu) {
    allTiles.push(...f.tiles)
  }

  const normalized = normalizeTiles(allTiles)

  // 检查是否只有一种数牌花色+字牌
  const suits = new Set<string>()

  for (const tile of normalized) {
    const suit = getTileSuit(tile)
    suits.add(suit)
  }

  // 应该只有一种数牌花色 + 字牌
  const numberSuits = [...suits].filter((s) => ['w', 'b', 's'].includes(s))
  const honorSuits = [...suits].filter((s) => ['d', 'z'].includes(s))

  if (numberSuits.length === 1 && honorSuits.length > 0) {
    return {
      id: 'hunyisoku',
      name: '混一色',
      han: 3,
      matched: true,
      reason: `${numberSuits[0]}数牌+字牌`
    }
  }

  return {
    id: 'hunyisoku',
    name: '混一色',
    han: 3,
    matched: false,
    reason: '不满足混一色条件'
  }
}

/**
 * 匹配清一色
 */
function matchChinitsu(tiles: Tile[], fulu: Fulu[]): YakuMatchResult {
  const allTiles = [...tiles]

  for (const f of fulu) {
    allTiles.push(...f.tiles)
  }

  const normalized = normalizeTiles(allTiles)

  // 检查是否只有一种数牌花色（不含字牌）
  const suits = new Set<string>()

  for (const tile of normalized) {
    const suit = getTileSuit(tile)
    suits.add(suit)
  }

  // 应该只有一种数牌花色，不含字牌
  const numberSuits = [...suits].filter((s) => ['w', 'b', 's'].includes(s))
  const honorSuits = [...suits].filter((s) => ['d', 'z'].includes(s))

  if (numberSuits.length === 1 && honorSuits.length === 0) {
    return {
      id: 'chinitsu',
      name: '清一色',
      han: 6,
      matched: true,
      reason: `全是${numberSuits[0]}数牌`
    }
  }

  return {
    id: 'chinitsu',
    name: '清一色',
    han: 6,
    matched: false,
    reason: '不满足清一色条件'
  }
}

/**
 * 匹配小三元
 */
function matchShousangen(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)
  const counts = countTiles(normalized)

  let dragonKezi = 0
  let dragonPair = 0

  for (const dragon of DRAGON_TILES) {
    const count = counts[dragon] || 0
    if (count >= 3) {
      dragonKezi++
    } else if (count >= 2) {
      dragonPair++
    }
  }

  // 小三元：2组刻子+1组雀头
  if (dragonKezi === 2 && dragonPair >= 1) {
    return {
      id: 'shousangen',
      name: '小三元',
      han: 2,
      matched: true,
      reason: '2组三元牌刻子+1组雀头'
    }
  }

  return {
    id: 'shousangen',
    name: '小三元',
    han: 2,
    matched: false,
    reason: '不满足小三元条件'
  }
}

/**
 * 匹配大三元
 */
function matchDaisangen(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)
  const counts = countTiles(normalized)

  let dragonKezi = 0

  for (const dragon of DRAGON_TILES) {
    const count = counts[dragon] || 0
    if (count >= 3) {
      dragonKezi++
    }
  }

  // 大三元：3组三元牌刻子
  if (dragonKezi === 3) {
    return {
      id: 'daisangen',
      name: '大三元',
      han: 8,
      matched: true,
      reason: '3组三元牌刻子'
    }
  }

  return {
    id: 'daisangen',
    name: '大三元',
    han: 8,
    matched: false,
    reason: '不满足大三元条件'
  }
}

/**
 * 匹配小四喜
 */
function matchShousuushii(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)
  const counts = countTiles(normalized)

  let windKezi = 0
  let windPair = 0

  for (const wind of WIND_TILES) {
    const count = counts[wind] || 0
    if (count >= 3) {
      windKezi++
    } else if (count >= 2) {
      windPair++
    }
  }

  // 小四喜：3组风牌刻子+1组雀头
  if (windKezi === 3 && windPair >= 1) {
    return {
      id: 'shousuushii',
      name: '小四喜',
      han: 8,
      matched: true,
      reason: '3组风牌刻子+1组雀头'
    }
  }

  return {
    id: 'shousuushii',
    name: '小四喜',
    han: 8,
    matched: false,
    reason: '不满足小四喜条件'
  }
}

/**
 * 匹配大四喜
 */
function matchDaisuushii(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)
  const counts = countTiles(normalized)

  let windKezi = 0

  for (const wind of WIND_TILES) {
    const count = counts[wind] || 0
    if (count >= 3) {
      windKezi++
    }
  }

  // 大四喜：4组风牌刻子
  if (windKezi === 4) {
    return {
      id: 'daisuushii',
      name: '大四喜',
      han: 8,
      matched: true,
      reason: '4组风牌刻子'
    }
  }

  return {
    id: 'daisuushii',
    name: '大四喜',
    han: 8,
    matched: false,
    reason: '不满足大四喜条件'
  }
}

/**
 * 匹配字一色
 */
function matchZiiisou(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)

  // 检查是否全是字牌
  const allHonor = normalized.every((t) => isHonorTile(t))

  if (allHonor) {
    return {
      id: 'ziiisou',
      name: '字一色',
      han: 8,
      matched: true,
      reason: '全是字牌'
    }
  }

  return {
    id: 'ziiisou',
    name: '字一色',
    han: 8,
    matched: false,
    reason: '不满足字一色条件'
  }
}

/**
 * 匹配绿一色
 */
function matchRyuuiisou(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)

  // 绿一色：只包含索子的23468以及发
  const allowedTiles: Tile[] = ['s2', 's3', 's4', 's6', 'z3']

  for (const tile of normalized) {
    if (!allowedTiles.includes(tile)) {
      return {
        id: 'ryuuiisou',
        name: '绿一色',
        han: 8,
        matched: false,
        reason: `含有不允许的牌: ${tile}`
      }
    }
  }

  return {
    id: 'ryuuiisou',
    name: '绿一色',
    han: 8,
    matched: true,
    reason: '只含索子23468和发'
  }
}

/**
 * 匹配清老头
 */
function matchChinroutou(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)

  // 清老头：全部是老千牌（数牌19）
  for (const tile of normalized) {
    if (!isNumberTile(tile)) {
      return {
        id: 'chinroutou',
        name: '清老头',
        han: 8,
        matched: false,
        reason: `含有非数牌: ${tile}`
      }
    }
    const num = getTileNumber(tile)
    if (num !== 1 && num !== 9) {
      return {
        id: 'chinroutou',
        name: '清老头',
        han: 8,
        matched: false,
        reason: `含有非老千牌: ${tile}`
      }
    }
  }

  return {
    id: 'chinroutou',
    name: '清老头',
    han: 8,
    matched: true,
    reason: '全是老千牌'
  }
}

/**
 * 匹配混老头
 */
function matchHonroutou(tiles: Tile[]): YakuMatchResult {
  const normalized = normalizeTiles(tiles)

  // 混老头：全部是幺九牌（数牌19+字牌）
  for (const tile of normalized) {
    if (!isYaojiu(tile)) {
      return {
        id: 'honroutou',
        name: '混老头',
        han: 2,
        matched: false,
        reason: `含有非幺九牌: ${tile}`
      }
    }
  }

  return {
    id: 'honroutou',
    name: '混老头',
    han: 2,
    matched: true,
    reason: '全是幺九牌'
  }
}

export { calculateHan } from './yaku/han'
