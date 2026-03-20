import type { Wind } from '../../stores/hand'
import type { Tile } from '../mahjong'

/** 副露 */
export interface Fulu {
  type: 'chi' | 'pon' | 'kan'
  tiles: Tile[]
  from?: number
}

/** 役种匹配输入 */
export interface MatchInput {
  /** 所有牌（手牌+摸牌+副露） */
  allTiles: Tile[]
  /** 是否门清（无副露） */
  isMenqian: boolean
  /** 是否立直 */
  isLiqi: boolean
  /** 是否自摸（摸牌与胡牌相同） */
  isZimo: boolean
  /** 庄家 */
  dealer: boolean
  /** 自风 */
  selfWind: Wind
  /** 场风 */
  fieldWind: Wind
  /** 副露列表 */
  fulu: Fulu[]
  /** 听牌列表 */
  tingPai: Tile[]
  /** 牌河（用于振听判断） */
  river?: Tile[]
}

/** 役种匹配结果 */
export interface YakuMatchResult {
  id: string
  name: string
  han: number
  matched: boolean
  reason?: string
}

/** 风牌列表 */
export const WIND_TILES: Tile[] = ['d1', 'd2', 'd3', 'd4']

/** 三元牌列表 */
export const DRAGON_TILES: Tile[] = ['z1', 'z2', 'z3']

/** 役牌风牌对应关系 */
export const WIND_TO_TILE: Record<Wind, Tile> = {
  d1: 'd1',
  d2: 'd2',
  d3: 'd3',
  d4: 'd4'
}
