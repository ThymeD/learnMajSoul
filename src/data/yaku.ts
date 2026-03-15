export interface Yaku {
  id: string
  name: string
  han: number
  category: '无限制' | '门前清' | '副露后'
  desc: string
  tiles: string[]
  splitAt?: number[]
  mastery?: number
  isHu?: boolean
  isEffectOnly?: boolean
  isDealerOnly?: boolean
  isNonDealerOnly?: boolean
  note?: string
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
    splitAt: [2, 5, 8, 11, 12, 13],
    mastery: 0,
    isHu: true
  },
  {
    id: 'tanyao',
    name: '断幺九',
    han: 1,
    category: '无限制',
    desc: '手牌中不包含幺九牌（19万，19筒，19条，字牌）',
    tiles: ['w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'b3', 'b3', 'b3', 's4', 's5', 's6', 's8', 's8'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'tsumo',
    name: '门前清自摸和',
    han: 1,
    category: '门前清',
    desc: '门前清状态下自摸和牌',
    tiles: ['w1', 'w1', 'w1', 'w2', 'w3', 'w4', 'b3', 'b3', 'b3', 's7', 's8', 's9', 'd4', 'd4'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'yakuhai-jikaze',
    name: '役牌：自风牌',
    han: 1,
    category: '无限制',
    desc: '包含自风刻子',
    tiles: ['w3', 'w3', 'w3', 'b4', 'b5', 'b6', 's7', 's8', 's9', 'd3', 'd3', 'd3', 's1', 's1'],
    splitAt: [2, 5, 8, 11, 12, 13],
    isHu: true
  },
  {
    id: 'yakuhai-bakaze',
    name: '役牌：场风牌',
    han: 1,
    category: '无限制',
    desc: '包含场风刻子',
    tiles: ['w3', 'w3', 'w3', 'b4', 'b5', 'b6', 's7', 's8', 's9', 'd1', 'd1', 'd1', 's1', 's1'],
    splitAt: [2, 5, 8, 11, 12, 13],
    isHu: true
  },
  {
    id: 'yakuhai-sangen',
    name: '役牌：三元牌',
    han: 1,
    category: '无限制',
    desc: '包含白，发，中的刻子',
    tiles: ['w3', 'w3', 'w3', 'b4', 'b5', 'b6', 's7', 's8', 's9', 'z1', 'z1', 'z1', 's1', 's1'],
    splitAt: [2, 5, 8, 11, 12, 13],
    isHu: true
  },
  {
    id: 'pinfu',
    name: '平和',
    han: 1,
    category: '门前清',
    desc: '4组顺子+非役牌的雀头+最后是顺子的两面听',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'b2', 'b3', 'b4', 's6', 's7', 's9', 's9', 's5'],
    splitAt: [2, 5, 8, 10, 12],
    isHu: true
  },
  {
    id: 'ipeikou',
    name: '一杯口',
    han: 1,
    category: '门前清',
    desc: '2组完全相同的顺子',
    tiles: ['w1', 'w2', 'w3', 'w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's7', 's8', 's9', 's3', 's3'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'chankan',
    name: '枪杠',
    han: 1,
    category: '无限制',
    desc: '别家加杠的时候荣和（国士无双可以抢暗杠）',
    tiles: ['b1', 'b1', 'b1', 'b1'],
    splitAt: [2]
  },
  {
    id: 'rinshan',
    name: '岭上开花',
    han: 1,
    category: '无限制',
    desc: '用摸到的岭上牌和牌',
    tiles: ['w2', 'w3', 'w4', 'b5', 'b5', 'b5', 's3', 's4', 's5', 's6', 's8', 's8', 's8', 's8', 's3'],
    splitAt: [2, 5, 6, 9, 13, 14],
    isHu: true
  },
  {
    id: 'haitei',
    name: '海底摸月',
    han: 1,
    category: '无限制',
    desc: '最后一张牌自摸和牌',
    tiles: ['w2', 'w2', 'w2', 'b4', 'b5', 'b6', 's3', 's3', 's3', 's9', 's9', 's9', 'd1', 'd1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'houtei',
    name: '河底捞鱼',
    han: 1,
    category: '无限制',
    desc: '最后一张牌荣和',
    tiles: ['w2', 'w2', 'w2', 'b4', 'b5', 'b6', 's3', 's3', 's3', 's9', 's9', 's9', 'd1', 'd1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'ippatsu',
    name: '一发',
    han: 1,
    category: '无限制',
    desc: '立直后，无人鸣牌的状态下一巡内和牌',
    tiles: ['w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's5', 's6', 's7', 'd1', 'd1', 'd1', 'd2', 'd2'],
    splitAt: [2, 5, 8, 11, 12, 13],
    isHu: true
  },
  {
    id: 'double-reach',
    name: '两立直',
    han: 2,
    category: '门前清',
    desc: '轮到自己之前无人鸣牌的状态下第一巡就立直',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w4', 'w4', 'b5', 'b6', 'b7', 'z1', 'z1', 'z1', 'z3', 'z3'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'sanshoku-douko',
    name: '三色同刻',
    han: 2,
    category: '无限制',
    desc: '万，筒，索都有相同数字的刻子',
    tiles: ['w3', 'w3', 'w3', 'b3', 'b3', 'b3', 's3', 's3', 's3', 's5', 's6', 's7', 'z2', 'z2'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'sandangatsu',
    name: '三杠子',
    han: 2,
    category: '无限制',
    desc: '一人开杠3次',
    tiles: ['s5', 's6', 's7', 'w3', 'w3', 'w3', 'w3', 'b3', 'b3', 'b3', 'b3', 's3', 's3', 's3', 's3', 'z2', 'z2'],
    splitAt: [2, 6, 10, 14, 15],
    isHu: true
  },
  {
    id: 'toitoi',
    name: '对对和',
    han: 2,
    category: '无限制',
    desc: '拥有4组刻子或者杠',
    tiles: ['w3', 'w3', 'w3', 'b4', 'b4', 'b4', 's3', 's3', 's3', 'z1', 'z1', 'z1', 'z2', 'z2'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'sanankei',
    name: '三暗刻',
    han: 2,
    category: '无限制',
    desc: '拥有3组没有碰的刻子',
    tiles: ['w1', 'w1', 'w1', 'b1', 'b1', 'b1', 's1', 's1', 's1', 's3', 's4', 's5', 'd1', 'd1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'shousangen',
    name: '小三元',
    han: 2,
    category: '无限制',
    desc: '包含白、发、中其中2种的刻子+剩下1种的雀头',
    tiles: ['w2', 'w3', 'w4', 'b5', 'b6', 'b7', 'z1', 'z1', 'z1', 'z3', 'z3', 'z3', 'z2', 'z2'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'honroutou',
    name: '混老头',
    han: 2,
    category: '无限制',
    desc: '胡牌时只包含老头牌（19万，19筒，19索）和字牌',
    tiles: ['w1', 'w1', 'w1', 'w9', 'w9', 'w9', 'b1', 'b1', 'b1', 's1', 's1', 's1', 'z1', 'z1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'chitoitsu',
    name: '七对子',
    han: 2,
    category: '门前清',
    desc: '7组不同的对子',
    tiles: ['w1', 'w1', 'w2', 'w2', 'b3', 'b3', 'b4', 'b4', 'b6', 'b6', 's7', 's7', 'd4', 'd4'],
    splitAt: [1, 3, 5, 7, 9, 11, 12],
    isHu: true
  },
  {
    id: 'honchantaiyaochuu',
    name: '混全带幺九',
    han: 2,
    category: '副露后',
    desc: '包含老头牌加上字牌的4组顺子和刻子+幺九牌的雀头',
    tiles: ['w1', 'w2', 'w3', 'w7', 'w8', 'w9', 'b1', 'b2', 'b3', 'z1', 'z1', 'z1', 'z3', 'z3'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'ikkititsuan',
    name: '一气通贯',
    han: 2,
    category: '副露后',
    desc: '同种数牌组成123，456，789的顺子',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'b1', 'b1', 'b1', 'd1', 'd1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'sanshoku-doushun',
    name: '三色同顺',
    han: 2,
    category: '副露后',
    desc: '万，筒，索都有相同数字的顺子',
    tiles: ['w1', 'w2', 'w3', 'b1', 'b2', 'b3', 's1', 's2', 's3', 's6', 's6', 's6', 'd3', 'd3'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'ryanpeikou',
    name: '二杯口',
    han: 3,
    category: '门前清',
    desc: '包含2组一杯口',
    tiles: ['s1', 's2', 's3', 's1', 's2', 's3', 'b2', 'b3', 'b4', 'b2', 'b3', 'b4', 'd1', 'd1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'junhonchantaiyaochuu',
    name: '纯全带幺九',
    han: 3,
    category: '副露后',
    desc: '只包含老头牌的4组顺子和刻子+老头牌的雀头',
    tiles: ['w1', 'w2', 'w3', 'w7', 'w8', 'w9', 'b1', 'b2', 'b3', 's9', 's9', 's9', 's1', 's1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'hunyisoku',
    name: '混一色',
    han: 3,
    category: '副露后',
    desc: '只包含1种数牌，并且含有字牌的刻子或者雀头',
    tiles: ['w1', 'w1', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'd2', 'd2', 'd2', 'z1', 'z1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'chinitsu',
    name: '清一色',
    han: 6,
    category: '副露后',
    desc: '只包含1种数牌，不能含有字牌',
    tiles: ['w1', 'w2', 'w3', 'w2', 'w3', 'w4', 'w3', 'w4', 'w5', 'w6', 'w6', 'w6', 'w9', 'w9'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'nagashimangan',
    name: '流局满贯',
    han: 5,
    category: '无限制',
    desc: '自己的舍张全是幺九牌并且没有被他家吃碰杠的状态下荒牌流局',
    tiles: ['w9', 'w1', 'd1', 'd1', 'd2', 'd2', 'z2', 'd2', 'd3', 'd3', 'd3', 'b9', 'b9', 'b9', 's9', 'z3', 'd4', 'w9'],
    isHu: true
  },
  {
    id: 'tenhou',
    name: '天和',
    han: 8,
    category: '无限制',
    desc: '庄家配牌时，14张牌为和牌状态',
    tiles: ['w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's5', 's6', 's7', 'd1', 'd1', 'd1', 'd2', 'd2'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true,
    isDealerOnly: true
  },
  {
    id: 'chihou',
    name: '地和',
    han: 8,
    category: '无限制',
    desc: '轮到自己之前无人鸣牌的状态下第一巡自摸和牌',
    tiles: ['w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's5', 's6', 's7', 'd1', 'd1', 'd1', 'd2', 'd2'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true,
    isNonDealerOnly: true
  },
  {
    id: 'daisangen',
    name: '大三元',
    han: 8,
    category: '无限制',
    desc: '包含白、发、中的三组刻子',
    tiles: ['s1', 's2', 's3', 'z1', 'z1', 'z1', 'z3', 'z3', 'z3', 'z2', 'z2', 'z2', 's9', 's9'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'suuankou',
    name: '四暗刻',
    han: 8,
    category: '门前清',
    desc: '包含没有碰的4组刻子',
    tiles: ['w1', 'w1', 'w1', 'w2', 'w2', 'w2', 'b3', 'b3', 'b3', 'b4', 'b4', 'b4', 's5', 's5'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'suuankoutanki',
    name: '四暗刻单骑',
    han: -2,
    category: '门前清',
    desc: '四暗刻最后单骑听牌和牌',
    tiles: ['w1', 'w1', 'w1', 'b2', 'b2', 'b2', 'b5', 'b5', 'b5', 's7', 's7', 's7', 'd1', 'd1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'kokushimusoujuusanmen',
    name: '国士无双十三面',
    han: -2,
    category: '门前清',
    desc: '国士无双最后13面听牌和牌',
    tiles: ['w1', 'w9', 'b1', 'b9', 's1', 's9', 'd1', 'd2', 'd3', 'd4', 'z1', 'z2', 'z3', 'w1'],
    splitAt: [12],
    isHu: true
  },
  {
    id: 'chuurenpuutoujyun',
    name: '纯正九莲宝灯',
    han: -2,
    category: '门前清',
    desc: '九莲宝灯最后9面听牌和牌',
    tiles: ['w1', 'w1', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w9', 'w9', 'w5'],
    splitAt: [12],
    isHu: true
  },
  {
    id: 'daisuushii',
    name: '大四喜',
    han: -2,
    category: '无限制',
    desc: '包含4种风牌的刻子',
    tiles: ['d1', 'd1', 'd1', 'd2', 'd2', 'd2', 'd3', 'd3', 'd3', 'd4', 'd4', 'd4', 'b5', 'b5'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'sufonrenda',
    name: '四风连打',
    han: -3,
    category: '无限制',
    desc: '无人鸣牌的情况下4人都在第一巡打出同一种风牌',
    tiles: ['d4', 'd4', 'd4', 'd4'],
    splitAt: [0, 1, 2, 3]
  },
  {
    id: 'suukansan',
    name: '四杠散了',
    han: -3,
    category: '无限制',
    desc: '2人以上合计开杠4次',
    tiles: ['w1', 'w1', 'w1', 'w1', 'b2', 'b2', 'b2', 'b2', 'b5', 'b5', 'b5', 'b5', 's9', 's9', 's9', 's9'],
    splitAt: [3, 7, 11]
  },
  {
    id: 'kyuushokujun',
    name: '九种九牌',
    han: -3,
    category: '无限制',
    desc: '第一巡轮到自己之前无人鸣牌的状态下拥有9种及以上的幺九牌',
    tiles: ['w1', 'w9', 'b1', 'b8', 'b9', 's3', 's3', 's4', 's7', 's9', 'd1', 'd3', 'z3', 'z2'],
    splitAt: [12]
  },
  {
    id: 'sikazero',
    name: '四家立直',
    han: -3,
    category: '无限制',
    desc: '4人全部宣告立直成功',
    tiles: []
  },
  {
    id: 'tsuuiisou',
    name: '字一色',
    han: 8,
    category: '无限制',
    desc: '只包含字牌',
    tiles: ['d1', 'd1', 'd1', 'd2', 'd2', 'd2', 'd3', 'd3', 'd3', 'z1', 'z1', 'z1', 'z3', 'z3'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'ryuuiisou',
    name: '绿一色',
    han: 8,
    category: '无限制',
    desc: '只包含索子的23468以及发',
    tiles: ['s2', 's2', 's2', 's3', 's3', 's3', 's4', 's4', 's4', 's6', 's6', 's6', 'z3', 'z3'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true,
    note: '无发也可以'
  },
  {
    id: 'chinroutou',
    name: '清老头',
    han: 8,
    category: '无限制',
    desc: '手牌中只有老头牌（19万，19筒，19索）',
    tiles: ['w1', 'w1', 'w1', 'w9', 'w9', 'w9', 'b1', 'b1', 'b1', 'b9', 'b9', 'b9', 's1', 's1'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'kokushimusou',
    name: '国士无双',
    han: 8,
    category: '门前清',
    desc: '全部十三种幺九牌各1张外加其中一种再有1张',
    tiles: ['w1', 'w9', 'b1', 'b9', 'b9', 's1', 's9', 'd1', 'd2', 'd3', 'd4', 'z1', 'z3', 'z2'],
    splitAt: [12],
    isHu: true
  },
  {
    id: 'shousuushii',
    name: '小四喜',
    han: 8,
    category: '无限制',
    desc: '包含三种风牌的刻子+剩下一种风牌的雀头',
    tiles: ['b1', 'b2', 'b3', 'd1', 'd1', 'd1', 'd2', 'd2', 'd2', 'd3', 'd3', 'd3', 'd4', 'd4'],
    splitAt: [2, 5, 8, 11, 12],
    isHu: true
  },
  {
    id: 'suukantsu',
    name: '四杠子',
    han: 8,
    category: '无限制',
    desc: '1人开杠4次',
    tiles: ['w1', 'w1', 'w1', 'w1', 'b2', 'b2', 'b2', 'b2', 's3', 's3', 's3', 's3', 'd1', 'd1', 'd1', 'd1', 'z3', 'z3'],
    splitAt: [3, 7, 11, 15, 16],
    isHu: true
  },
  {
    id: 'chuurenpuutou',
    name: '九莲宝灯',
    han: 8,
    category: '门前清',
    desc: '同种数牌1112345678993+其中任意一种再有1张',
    tiles: ['w1', 'w1', 'w1', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w9', 'w9'],
    splitAt: [12],
    isHu: true
  },
  {
    id: 'dora',
    name: '宝牌',
    han: 1,
    category: '无限制',
    desc: '宝牌指示牌的下一张牌',
    tiles: ['s3', 'bg', 'bg', 'bg', 'bg', 's4'],
    splitAt: [4],
    isEffectOnly: true
  },
  {
    id: 'red-dora',
    name: '赤宝牌',
    han: 1,
    category: '无限制',
    desc: '红5，红5筒，红5索',
    tiles: ['rw5', 'rb5', 'rs5'],
    splitAt: [0, 1],
    isEffectOnly: true
  },
  {
    id: 'kita',
    name: '北宝牌',
    han: 1,
    category: '无限制',
    desc: '在三人麻将中、北风在拔北操作后可以北当做宝牌（手牌中不算）',
    tiles: ['d4'],
    isEffectOnly: true
  }
]

const STORAGE_KEY = 'yaku-mastery'

export const setYakuMastery = (id: string, count: number) => {
  const yaku = yakuData.find(y => y.id === id)
  if (yaku) {
    yaku.mastery = count
    saveMastery()
    return true
  }
  return false
}

export const clearAllMastery = () => {
  yakuData.forEach(y => {
    y.mastery = 0
  })
  localStorage.removeItem(STORAGE_KEY)
}

const saveMastery = () => {
  const masteryMap: Record<string, number> = {}
  yakuData.forEach(y => {
    if (y.mastery) {
      masteryMap[y.id] = y.mastery
    }
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(masteryMap))
}

export const loadMastery = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const masteryMap = JSON.parse(stored)
    yakuData.forEach(y => {
      if (masteryMap[y.id] !== undefined) {
        y.mastery = masteryMap[y.id]
      }
    })
  }
}

export const getTingIndex = (tiles: string[]): number => {
  return tiles.length - 1
}

export const getTingSplitIndex = (tiles: string[]): number => {
  return tiles.length - 2
}

const getTileNumber = (tile: string): number => {
  const num = parseInt(tile.slice(1))
  return isNaN(num) ? 0 : num
}

const isSameTile = (t1: string, t2: string): boolean => {
  return t1[0] === t2[0] && getTileNumber(t1) === getTileNumber(t2)
}

export const autoCalculateSplitAt = (tiles: string[]): number[] => {
  const splitAt: number[] = []
  if (tiles.length <= 1) return splitAt

  const countMap: Record<string, number> = {}
  tiles.forEach(t => {
    countMap[t] = (countMap[t] || 0) + 1
  })

  const uniqueTiles = [...new Set(tiles)]
  const isYaojiuTile = (tile: string): boolean => {
    const num = getTileNumber(tile)
    return num === 1 || num === 9 || tile[0] === 'd' || tile[0] === 'z'
  }
  
  const allYaojiu = uniqueTiles.every(t => isYaojiuTile(t))
  const tilesWithMultiple = Object.values(countMap).filter(c => c > 1).length
  
  if (allYaojiu && tilesWithMultiple === 1 && tiles.length === 14) {
    const tingSplit = getTingSplitIndex(tiles)
    splitAt.push(tingSplit)
    return splitAt
  }

  const isChuuren = (): boolean => {
    if (tiles.length !== 14) return false
    if (!tiles.every(t => t[0] === 'w')) return false
    
    const nums = tiles.map(t => getTileNumber(t)).sort((a, b) => a - b)
    const hasThree = nums.filter(n => n === 1).length === 3
    const hasThree9 = nums.filter(n => n === 9).length === 3
    const has2345678 = [2,3,4,5,6,7,8].every(n => nums.includes(n))
    const hasExtra = nums.length === 14
    
    return hasThree && hasThree9 && has2345678 && hasExtra
  }
  
  if (isChuuren()) {
    const tingSplit = getTingSplitIndex(tiles)
    splitAt.push(tingSplit)
    return splitAt
  }

  const countGangs = (): number => {
    let gangs = 0
    for (const tile in countMap) {
      if (countMap[tile] === 4) {
        gangs++
      }
    }
    return gangs
  }

  if (countGangs() >= 3) {
    const tingSplit = getTingSplitIndex(tiles)
    splitAt.push(tingSplit)
    return splitAt
  }

  const hasPair = (tile: string): boolean => {
    return countMap[tile] >= 2
  }

  let i = 0
  while (i < tiles.length) {
    const current = tiles[i]
    let groupSize = 1
    
    while (i + groupSize < tiles.length && isSameTile(current, tiles[i + groupSize])) {
      groupSize++
    }
    
    if (groupSize >= 2 && i + groupSize < tiles.length) {
      splitAt.push(i + groupSize - 1)
    }
    
    if (i + groupSize < tiles.length) {
      const currentNum = getTileNumber(tiles[i + groupSize - 1])
      const nextNum = getTileNumber(tiles[i + groupSize])
      const isSameSuit = tiles[i + groupSize - 1][0] === tiles[i + groupSize][0]
      
      if (isSameSuit && (nextNum === currentNum + 1 || nextNum > currentNum + 1)) {
        let j = i + groupSize
        while (j < tiles.length && tiles[j][0] === current[0] && getTileNumber(tiles[j]) === getTileNumber(tiles[i + groupSize - 1]) + (j - i - groupSize + 1)) {
          j++
        }

        if (j > i + groupSize) {
          if (j < tiles.length) {
            if (hasPair(tiles[j]) || (j + 1 < tiles.length && hasPair(tiles[j + 1]))) {
              splitAt.push(j - 1)
            } else if (j === tiles.length) {
              splitAt.push(j - 1)
            }
          } else if (j > i + groupSize) {
            splitAt.push(j - 1)
          }
        } else if (j === i + groupSize && i + groupSize < tiles.length && hasPair(tiles[i + groupSize])) {
          splitAt.push(i + groupSize - 1)
        }
      }
    }
    
    if (i + groupSize < tiles.length && hasPair(tiles[i + groupSize])) {
      splitAt.push(i + groupSize - 1)
    }

    if (i + groupSize < tiles.length && hasPair(current) && groupSize === 1) {
      const lastIndex = tiles.lastIndexOf(current)
      if (lastIndex > i && lastIndex < tiles.length - 1) {
        splitAt.push(i)
      }
    }
    
    i += groupSize
  }
  
  const tingSplit = getTingSplitIndex(tiles)
  if (!splitAt.includes(tingSplit)) {
    splitAt.push(tingSplit)
  }
  
  return [...new Set(splitAt)].sort((a, b) => a - b)
}
