/**
 * 麻将核心算法测试
 */
import { describe, expect, it } from 'vitest'
import {
  getTileNumber,
  getTileSuit,
  sortTiles,
  countTiles,
  isValidTileCount,
  checkHu,
  getTingPai,
  checkKokushimusou,
  checkKokushimusou13,
  checkChitoitsu,
  checkChuurenpu,
  checkZhenTing,
  analyzeHand,
  getPossibleMentsu,
  findJietou
} from '../utils/mahjong'

describe('麻将核心算法', () => {
  describe('getTileNumber', () => {
    it('应该正确获取万牌数字', () => {
      expect(getTileNumber('w1')).toBe(1)
      expect(getTileNumber('w9')).toBe(9)
    })

    it('应该正确获取筒牌数字', () => {
      expect(getTileNumber('b1')).toBe(1)
      expect(getTileNumber('b9')).toBe(9)
    })

    it('应该正确获取索牌数字', () => {
      expect(getTileNumber('s1')).toBe(1)
      expect(getTileNumber('s9')).toBe(9)
    })

    it('应该正确获取字牌数字', () => {
      expect(getTileNumber('d1')).toBe(1)
      expect(getTileNumber('d4')).toBe(4)
      expect(getTileNumber('z1')).toBe(1)
      expect(getTileNumber('z3')).toBe(3)
    })
  })

  describe('getTileSuit', () => {
    it('应该正确获取花色', () => {
      expect(getTileSuit('w1')).toBe('w')
      expect(getTileSuit('b5')).toBe('b')
      expect(getTileSuit('s9')).toBe('s')
      expect(getTileSuit('d1')).toBe('d')
      expect(getTileSuit('z1')).toBe('z')
    })
  })

  describe('sortTiles', () => {
    it('应该正确排序牌', () => {
      const tiles = ['w9', 'w1', 'b5', 'w2', 'd1', 'w1']
      const sorted = sortTiles(tiles)
      expect(sorted).toEqual(['w1', 'w1', 'w2', 'w9', 'b5', 'd1'])
    })

    it('应该正确处理赤牌', () => {
      const tiles = ['rw5', 'w5', 'w6']
      const sorted = sortTiles(tiles)
      expect(sorted).toEqual(['w5', 'w5', 'w6'])
    })
  })

  describe('countTiles', () => {
    it('应该正确统计牌数', () => {
      const tiles = ['w1', 'w1', 'w2', 'b5', 'b5', 'b5', 'b5']
      const counts = countTiles(tiles)
      expect(counts['w1']).toBe(2)
      expect(counts['w2']).toBe(1)
      expect(counts['b5']).toBe(4)
    })
  })

  describe('isValidTileCount', () => {
    it('应该正确验证合法牌数', () => {
      expect(isValidTileCount(['w1', 'w1', 'w1', 'w1'])).toBe(true)
      expect(isValidTileCount(['w1', 'w1', 'w1', 'w1', 'w1'])).toBe(false)
    })
  })

  describe('checkHu - 标准胡牌', () => {
    it('调试: 检查面子和雀头', () => {
      // 123万 444筒 567索 111字 22索
      const tiles = [
        'w1',
        'w2',
        'w3',
        'b4',
        'b4',
        'b4',
        's5',
        's6',
        's7',
        'd1',
        'd1',
        'd1',
        's2',
        's2'
      ]
      const sorted = sortTiles(tiles)
      console.log('Sorted:', sorted)
      console.log('Counts:', countTiles(sorted))
      console.log('Mentsu:', JSON.stringify(getPossibleMentsu(sorted), null, 2))
      console.log('Jietou:', findJietou(sorted))
      const result = checkHu(tiles)
      console.log('Result:', result)
      expect(result.isHu).toBe(true)
    })

    it('应该正确判断标准胡牌', () => {
      // 123万 444筒 567索 111字 22索
      const tiles = [
        'w1',
        'w2',
        'w3',
        'b4',
        'b4',
        'b4',
        's5',
        's6',
        's7',
        'd1',
        'd1',
        'd1',
        's2',
        's2'
      ]
      const result = checkHu(tiles)
      expect(result.isHu).toBe(true)
    })

    it('应该正确判断非胡牌', () => {
      const tiles = ['w1', 'w2', 'w3', 'b4', 'b5', 'b6', 's7', 's8', 's9']
      const result = checkHu(tiles)
      expect(result.isHu).toBe(false)
    })
  })

  describe('checkChitoitsu - 七对子', () => {
    it('应该正确判断七对子', () => {
      const tiles = [
        'w1',
        'w1',
        'w2',
        'w2',
        'w3',
        'w3',
        'b4',
        'b4',
        's5',
        's5',
        'd1',
        'd1',
        'z1',
        'z1'
      ]
      const result = checkChitoitsu(tiles)
      expect(result).toBe(true)
    })

    it('应该正确判断非七对子', () => {
      const tiles = ['w1', 'w1', 'w2', 'w2', 'w3', 'w3', 'b4', 'b5', 'b6']
      const result = checkChitoitsu(tiles)
      expect(result).toBe(false)
    })
  })

  describe('checkKokushimusou - 国士无双', () => {
    it('应该正确判断国士无双', () => {
      const tiles = [
        'w1',
        'w9',
        'b1',
        'b9',
        's1',
        's9',
        'd1',
        'd2',
        'd3',
        'd4',
        'z1',
        'z2',
        'z3',
        'w1'
      ]
      const result = checkKokushimusou(tiles)
      expect(result).toBe(true)
    })

    it('应该正确判断国士无双十三面', () => {
      const tiles = ['w1', 'w9', 'b1', 'b9', 's1', 's9', 'd1', 'd2', 'd3', 'd4', 'z1', 'z2', 'z3']
      const result = checkKokushimusou13(tiles)
      expect(result).toBe(true)
    })
  })

  describe('checkChuurenpu - 九莲宝灯', () => {
    it('应该正确判断九莲宝灯', () => {
      // 1112345678999 + 5万
      const tiles = [
        'w1',
        'w1',
        'w1',
        'w2',
        'w3',
        'w4',
        'w5',
        'w6',
        'w7',
        'w8',
        'w9',
        'w9',
        'w9',
        'w5'
      ]
      const result = checkChuurenpu(tiles)
      expect(result).toBe(true)
    })
  })

  describe('getTingPai - 听牌分析', () => {
    it('应该正确分析听牌', () => {
      // 123456789m111p1s - 听1s (13张手牌)
      const hand = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'b1', 'b1', 'b1', 's1']
      const tingPai = getTingPai(hand)
      expect(tingPai).toContain('s1')
    })
  })

  describe('checkZhenTing - 振听判定', () => {
    it('应该正确判断振听', () => {
      const tingPai = ['b1', 'b2', 'b3']
      const river = ['b1', 'b5', 'b6']
      expect(checkZhenTing(tingPai, river)).toBe(true)
    })

    it('应该正确判断非振听', () => {
      const tingPai = ['b1', 'b2', 'b3']
      const river = ['b5', 'b6', 'b7']
      expect(checkZhenTing(tingPai, river)).toBe(false)
    })
  })

  describe('analyzeHand - 完整手牌分析', () => {
    it('应该正确分析完整手牌', () => {
      const tiles = [
        'w1',
        'w2',
        'w3',
        'b4',
        'b4',
        'b4',
        's5',
        's6',
        's7',
        'd1',
        'd1',
        'd1',
        'd2',
        'd2'
      ]
      const result = analyzeHand(tiles)
      expect(result.isHu).toBe(true)
    })
  })

  describe('需求文档验证', () => {
    it('验证1: 标准胡牌', () => {
      const tiles = [
        'w1',
        'w2',
        'w3',
        'b4',
        'b4',
        'b4',
        's5',
        's6',
        's7',
        'd1',
        'd1',
        'd1',
        'd2',
        'd2'
      ]
      const result = checkHu(tiles)
      expect(result.isHu).toBe(true)
    })

    it('验证2: 七对子', () => {
      const tiles = [
        'w1',
        'w1',
        'w2',
        'w2',
        'w3',
        'w3',
        'b4',
        'b4',
        's5',
        's5',
        'd1',
        'd1',
        'z1',
        'z1'
      ]
      const result = checkChitoitsu(tiles)
      expect(result).toBe(true)
    })

    it('验证3: 国士无双', () => {
      const tiles = [
        'w1',
        'w9',
        'b1',
        'b9',
        's1',
        's9',
        'd1',
        'd2',
        'd3',
        'd4',
        'z1',
        'z2',
        'z3',
        'w1'
      ]
      const result = checkKokushimusou(tiles)
      expect(result).toBe(true)
    })
  })
})
