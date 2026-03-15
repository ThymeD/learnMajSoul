export interface Yaku {
  id: string
  name: string
  han: number
  category: '无限制' | '门前清' | '副露后'
  desc: string
  tiles: string[]
  splitAt?: number[]
  mastery?: number
}

export const yakuData: Yaku[] = [
  // 一番役
  {
    id: 'reach',
    name: '立直',
    han: 1,
    category: '门前清',
    desc: '门前清状态听牌即可立直，立直状态下和牌',
    tiles: ['w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's5', 's6', 's7', 'd1', 'd1', 'd1', 'd2', 'd2'],
    splitAt: [12],
    mastery: 0
  },
  {
    id: 'tanyao',
    name: '断幺九',
    han: 1,
    category: '无限制',
    desc: '和牌时不存在幺九牌',
    tiles: ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8']
  },
  {
    id: 'tsumo',
    name: '门前清自摸和',
    han: 1,
    category: '门前清',
    desc: '门前清时，自摸',
    tiles: ['w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
  },
  {
    id: 'yakuhai-jikaze',
    name: '役牌：自风牌',
    han: 1,
    category: '无限制',
    desc: '自风牌刻子',
    tiles: ['d1', 'd1', 'd1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 's2', 's3', 's4', 's5', 's6']
  },
  {
    id: 'yakuhai-bakaze',
    name: '役牌：场风牌',
    han: 1,
    category: '无限制',
    desc: '场风牌刻子',
    tiles: ['d2', 'd2', 'd2', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 's2', 's3', 's4', 's5', 's6']
  },
  {
    id: 'yakuhai-sangen',
    name: '役牌：三元牌',
    han: 1,
    category: '无限制',
    desc: '三元牌刻子',
    tiles: ['z1', 'z1', 'z1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 's2', 's3', 's4', 's5', 's6']
  },
  {
    id: 'pinfu',
    name: '平和',
    han: 1,
    category: '门前清',
    desc: '除自摸外没有额外的符数，两面听牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 's1', 's2', 's3', 's4', 's5']
  },
  {
    id: 'ipeikou',
    name: '一杯口',
    han: 1,
    category: '门前清',
    desc: '一组相同的顺子',
    tiles: ['w1', 'w1', 'w2', 'w2', 'w3', 'w3', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']
  },
  {
    id: 'chankan',
    name: '枪杠',
    han: 1,
    category: '无限制',
    desc: '荣和他人开杠后的牌',
    tiles: []
  },
  {
    id: 'rinshan',
    name: '岭上开花',
    han: 1,
    category: '无限制',
    desc: '杠后摸牌时自摸',
    tiles: []
  },
  {
    id: 'haitei',
    name: '海底摸月',
    han: 1,
    category: '无限制',
    desc: '自摸最后一枝牌',
    tiles: []
  },
  {
    id: 'houtei',
    name: '河底捞鱼',
    han: 1,
    category: '无限制',
    desc: '和最后一枝打出的牌',
    tiles: []
  },
  {
    id: 'ippatsu',
    name: '一发',
    han: 1,
    category: '门前清',
    desc: '立直后，一巡内完成和牌',
    tiles: []
  },
  {
    id: 'dora',
    name: '宝牌',
    han: 1,
    category: '无限制',
    desc: '宝牌指示牌',
    tiles: []
  },
  {
    id: 'red-dora',
    name: '赤宝牌',
    han: 1,
    category: '无限制',
    desc: '赤宝牌指示牌',
    tiles: []
  },
  {
    id: 'kita',
    name: '北宝牌',
    han: 1,
    category: '无限制',
    desc: '拔北宝牌',
    tiles: []
  }
]
