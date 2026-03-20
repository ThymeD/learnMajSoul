/**
 * 役种匹配测试
 */

import { describe, it, expect } from 'vitest'
import { matchYaku, calculateHan, type MatchInput } from '../utils/yaku-match'

describe('役种匹配', () => {
  describe('断幺九', () => {
    it('应该匹配断幺九（不含幺九牌）', () => {
      const input: MatchInput = {
        allTiles: [
          'w2',
          'w2',
          'w2',
          'w3',
          'w4',
          'w5',
          'b3',
          'b4',
          'b5',
          's6',
          's7',
          's8',
          'w5',
          'w5'
        ],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const tanyao = result.find((y) => y.id === 'tanyao')

      expect(tanyao).toBeDefined()
      expect(tanyao?.matched).toBe(true)
      expect(tanyao?.han).toBe(1)
    })
  })

  describe('七对子', () => {
    it('应该匹配七对子', () => {
      const input: MatchInput = {
        allTiles: [
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
        ],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const chitoitsu = result.find((y) => y.id === 'chitoitsu')

      expect(chitoitsu).toBeDefined()
      expect(chitoitsu?.matched).toBe(true)
      expect(chitoitsu?.han).toBe(2)
    })
  })

  describe('国士无双', () => {
    it('应该匹配国士无双', () => {
      const input: MatchInput = {
        allTiles: [
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
        ],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const kokushi = result.find((y) => y.id === 'kokushimusou')

      expect(kokushi).toBeDefined()
      expect(kokushi?.matched).toBe(true)
      expect(kokushi?.han).toBe(8)
    })

    it('应该匹配国士无双十三面', () => {
      const input: MatchInput = {
        allTiles: ['w1', 'w9', 'b1', 'b9', 's1', 's9', 'd1', 'd2', 'd3', 'd4', 'z1', 'z2', 'z3'],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: ['w1']
      }

      const result = matchYaku(input)
      const kokushi13 = result.find((y) => y.id === 'kokushimusoujuusanmen')

      expect(kokushi13).toBeDefined()
      expect(kokushi13?.matched).toBe(true)
      expect(kokushi13?.han).toBe(8)
    })
  })

  describe('九莲宝灯', () => {
    it('应该匹配九莲宝灯', () => {
      const input: MatchInput = {
        allTiles: [
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
        ],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const chuuren = result.find((y) => y.id === 'chuurenpuutou')

      expect(chuuren).toBeDefined()
      expect(chuuren?.matched).toBe(true)
      expect(chuuren?.han).toBe(8)
    })
  })

  describe('役牌', () => {
    it('应该匹配役牌（自风）', () => {
      const input: MatchInput = {
        allTiles: [
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
        ],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const jikaze = result.find((y) => y.id === 'yakuhai-自风')

      expect(jikaze).toBeDefined()
      expect(jikaze?.matched).toBe(true)
    })

    it('应该匹配役牌（三元牌）', () => {
      const input: MatchInput = {
        allTiles: [
          'w1',
          'w2',
          'w3',
          'b4',
          'b5',
          'b6',
          's7',
          's8',
          's9',
          'z1',
          'z1',
          'z1',
          'z2',
          'z2'
        ],
        isMenqian: true,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const sangen = result.find((y) => y.id === 'yakuhai-sangen')

      expect(sangen).toBeDefined()
      expect(sangen?.matched).toBe(true)
      expect(sangen?.han).toBe(1)
    })
  })

  describe('清一色', () => {
    it('应该匹配清一色', () => {
      const input: MatchInput = {
        allTiles: [
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
          'w1'
        ],
        isMenqian: false,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [{ type: 'pon', tiles: ['w1', 'w1', 'w1'] }],
        tingPai: []
      }

      const result = matchYaku(input)
      const chinitsu = result.find((y) => y.id === 'chinitsu')

      expect(chinitsu).toBeDefined()
      expect(chinitsu?.matched).toBe(true)
      expect(chinitsu?.han).toBe(6)
    })
  })

  describe('混一色', () => {
    it('应该匹配混一色', () => {
      const input: MatchInput = {
        allTiles: [
          'w1',
          'w1',
          'w1',
          'w2',
          'w3',
          'w4',
          'w5',
          'w6',
          'w7',
          'd2',
          'd2',
          'd2',
          'z1',
          'z1'
        ],
        isMenqian: false,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: []
      }

      const result = matchYaku(input)
      const hunyi = result.find((y) => y.id === 'hunyisoku')

      expect(hunyi).toBeDefined()
      expect(hunyi?.matched).toBe(true)
      expect(hunyi?.han).toBe(3)
    })
  })

  describe('回归稳定性', () => {
    it('特殊役成立时不再继续叠加普通役', () => {
      const input: MatchInput = {
        allTiles: [
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
        ],
        isMenqian: true,
        isLiqi: true,
        isZimo: true,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [],
        tingPai: ['w1']
      }

      const result = matchYaku(input)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('chitoitsu')
    })

    it('副露后仍可稳定识别三色同刻', () => {
      const input: MatchInput = {
        allTiles: [
          'w1',
          'w1',
          'w1',
          'b1',
          'b1',
          'b1',
          's1',
          's1',
          's1',
          'w2',
          'w3',
          'w4',
          'd1',
          'd1'
        ],
        isMenqian: false,
        isLiqi: false,
        isZimo: false,
        dealer: false,
        selfWind: 'd1',
        fieldWind: 'd1',
        fulu: [{ type: 'pon', tiles: ['s1', 's1', 's1'] }],
        tingPai: []
      }

      const result = matchYaku(input)
      const sanshokuDouko = result.find((y) => y.id === 'sanshoku-douko')
      expect(sanshokuDouko?.matched).toBe(true)
    })
  })

  describe('番数计算', () => {
    it('应该正确计算总番数（门清）', () => {
      const matchedYaku = [
        { id: 'reach', name: '立直', han: 1, matched: true },
        { id: 'pinfu', name: '平和', han: 1, matched: true },
        { id: 'tanyao', name: '断幺九', han: 1, matched: true }
      ]

      const han = calculateHan(matchedYaku, true)

      // 门清状态下不减番
      expect(han).toBe(3)
    })

    it('应该正确计算总番数（副露后减番）', () => {
      const matchedYaku = [
        { id: 'tanyao', name: '断幺九', han: 1, matched: true },
        { id: 'yakuhai-sangen', name: '役牌', han: 1, matched: true }
      ]

      const han = calculateHan(matchedYaku, false)

      // 副露后1-2番役种减1番
      expect(han).toBe(1)
    })

    it('应该正确处理役满', () => {
      const matchedYaku = [{ id: 'kokushimusou', name: '国士无双', han: 8, matched: true }]

      const han = calculateHan(matchedYaku, true)

      expect(han).toBe(8)
    })

    it('应该正确处理倍役满', () => {
      // 测试两个可以同时成立的役满（大三元+四暗刻）
      const matchedYaku = [
        { id: 'daisangen', name: '大三元', han: 8, matched: true },
        { id: 'suuankou', name: '四暗刻', han: 8, matched: true }
      ]

      const han = calculateHan(matchedYaku, true)

      // 两个役满 = 倍役满
      expect(han).toBe(16)
    })

    it('应该正确处理满贯', () => {
      const matchedYaku = [{ id: 'chinitsu', name: '清一色', han: 6, matched: true }]

      const han = calculateHan(matchedYaku, false)

      // 5番以上按满贯计
      expect(han).toBe(5)
    })
  })
})
