export interface Yaku {
  id: string
  name: string
  han: number
  category: '无限制' | '门前清' | '副露后'
  difficulty: string
  desc: string
  tiles: string[]
}

export const yakuData: Yaku[] = [
  // 一番役 - 无限制
  {
    id: 'tanyao',
    name: '断幺九',
    han: 1,
    category: '无限制',
    difficulty: '推荐',
    desc: '和牌时不存在幺九牌',
    tiles: ['s3', 's4', 's5', 's7', 's7', 'b7', 'b8', 'w3', 'w4', 'w5', 'w7', 'w7', 'w7']
  },
  {
    id: 'yakuhai',
    name: '役牌',
    han: 1,
    category: '无限制',
    difficulty: '普通',
    desc: '三元牌刻子或杠子',
    tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z3', 'z3', 'z3', 'w1', 'w1', 'w1', 'w1']
  },
  {
    id: 'houtei',
    name: '河底摸鱼',
    han: 1,
    category: '无限制',
    difficulty: '偶然',
    desc: '和最后一枝打出的牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w1', 'w1', 'w1', 'w1']
  },
  {
    id: 'haitei',
    name: '海底捞月',
    han: 1,
    category: '无限制',
    difficulty: '偶然',
    desc: '自摸最后一枝牌',
    tiles: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's1', 's1', 's1', 's1']
  },
  // 一番役 - 门前清
  {
    id: 'reach',
    name: '立直',
    han: 1,
    category: '门前清',
    difficulty: '推荐',
    desc: '门前清时，支付1000点宣告听牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 's1', 's1', 's1', 's1']
  },
  {
    id: 'ippatsu',
    name: '一发',
    han: 1,
    category: '门前清',
    difficulty: '偶然',
    desc: '立直后，一巡内完成和牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'b1', 'b1', 'b1', 'b1']
  },
  {
    id: 'tsumo',
    name: '门前清自摸和',
    han: 1,
    category: '门前清',
    difficulty: '容易',
    desc: '门前清时，自摸',
    tiles: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 's2', 's2', 's2', 's2']
  },
  {
    id: 'pinfu',
    name: '平和',
    han: 1,
    category: '门前清',
    difficulty: '推荐',
    desc: '除自摸外没有额外的符数，两面听牌',
    tiles: ['w1', 'w2', 'w3', 'w5', 'w6', 'w7', 's2', 's3', 's4', 's7', 's7', 'b7', 'b8']
  },
  {
    id: 'ipeikou',
    name: '一杯口',
    han: 1,
    category: '门前清',
    difficulty: '容易',
    desc: '一组相同的顺子',
    tiles: ['b1', 'b1', 'b2', 'b2', 'b3', 'b3', 'w1', 'w1', 'w1', 'w2', 'w2', 'w2', 'w3']
  },
  // 二番役 - 无限制
  {
    id: 'toitoi',
    name: '对对和',
    han: 2,
    category: '无限制',
    difficulty: '容易',
    desc: '全是刻子、杠子',
    tiles: ['z1', 'z1', 'z1', 's2', 's2', 's2', 'b1', 'b1', 'b1', 'w2', 'w2', 'w2', 'w9']
  },
  {
    id: 'sananko',
    name: '三暗刻',
    han: 2,
    category: '无限制',
    difficulty: '稍难',
    desc: '暗刻+暗杠=3',
    tiles: ['w2', 'w2', 'w2', 'z1', 'z1', 'z1', 'w1', 'w1', 'w1', 'b1', 'b1', 'b1', 'b9']
  },
  {
    id: 'sankantsu',
    name: '三杠子',
    han: 2,
    category: '无限制',
    difficulty: '超难',
    desc: '三组杠子',
    tiles: ['w2', 'w2', 'w2', 'z1', 'z1', 'z1', 'w1', 'w1', 'w1', 'b5', 'b5', 'b5', 'b8']
  },
  {
    id: 'sanshoku',
    name: '三色同刻',
    han: 2,
    category: '无限制',
    difficulty: '难',
    desc: '3组同一数字的刻子',
    tiles: ['w2', 'w2', 'w2', 's2', 's2', 's2', 'b2', 'b2', 'b2', 'w1', 'w1', 'w1', 'w1']
  },
  {
    id: 'honroutou',
    name: '混老头',
    han: 2,
    category: '无限制',
    difficulty: '稍难',
    desc: '幺九牌组成的七对子或对对和',
    tiles: ['w1', 'w1', 'w1', 'w9', 'w9', 'w9', 's1', 's1', 's9', 's9', 's9', 'z3', 'z3']
  },
  {
    id: 'shosangen',
    name: '小三元',
    han: 2,
    category: '无限制',
    difficulty: '稍难',
    desc: '三元牌刻子=2，三元牌雀头=1',
    tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z3', 'z3', 'z3', 'w1', 'w1', 'w1', 'w1']
  },
  // 二番役 - 副露后
  {
    id: 'sanshoku-doushun',
    name: '三色同顺',
    han: 2,
    category: '副露后',
    difficulty: '普通',
    desc: '3种花色同一顺子',
    tiles: ['w2', 'w3', 'w4', 'b3', 'b2', 'b4', 's4', 's2', 's3', 'w1', 'w1', 'w1', 'w1']
  },
  {
    id: 'ikkiukan',
    name: '一气通贯',
    han: 2,
    category: '副露后',
    difficulty: '普通',
    desc: '同花色的123，456，789三组顺子',
    tiles: ['w4', 'w5', 'w6', 'w3', 'w1', 'w2', 'w8', 'w7', 'w9', 'w1', 'w1', 'w1', 'w1']
  },
  {
    id: 'honchantai',
    name: '混全带幺九',
    han: 2,
    category: '副露后',
    difficulty: '普通',
    desc: '所有面子、雀头都带幺九牌',
    tiles: ['s1', 's2', 's3', 'z1', 'z1', 'z1', 's7', 's8', 's9', 'b1', 'b2', 'b3', 'b9']
  },
  // 二番役 - 门前清
  {
    id: 'chitoitsu',
    name: '七对子',
    han: 2,
    category: '门前清',
    difficulty: '普通',
    desc: '对子=7',
    tiles: ['w1', 'w1', 'w4', 'w4', 'b1', 'b1', 'b4', 'b4', 's1', 's1', 's2', 'z1', 'z1']
  },
  {
    id: 'ryuiso',
    name: '两立直',
    han: 2,
    category: '门前清',
    difficulty: '偶然',
    desc: '第一巡即宣告立直',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 's1', 's1', 's1', 's1']
  },
  // 三番役 - 副露后
  {
    id: 'honitsu',
    name: '混一色',
    han: 3,
    category: '副露后',
    difficulty: '容易',
    desc: '同花色的牌+字牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w8', 'w8', 'z3', 'z3', 'z3', 'w5', 'w6']
  },
  {
    id: 'junchantai',
    name: '纯全带幺九',
    han: 3,
    category: '副露后',
    difficulty: '稍难',
    desc: '所有面子、雀头都带幺九牌',
    tiles: ['s1', 's2', 's3', 'w1', 'w2', 'w3', 's7', 's8', 's9', 'b1', 'b2', 'b3', 'b9']
  },
  // 三番役 - 门前清
  {
    id: 'ryanpeikou',
    name: '二杯口',
    han: 3,
    category: '门前清',
    difficulty: '难',
    desc: '2组一盃口',
    tiles: ['b1', 'b1', 'b2', 'b2', 'b3', 'b3', 'b7', 'b7', 'b8', 'b8', 'b9', 'b9', 'w1']
  },
  // 六番役
  {
    id: 'chinitsu',
    name: '清一色',
    han: 6,
    category: '副露后',
    difficulty: '稍难',
    desc: '全是花色相同的牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w8', 'w8', 'w9', 'w9', 'w5', 'w6', 'w7']
  },
  // 役满役
  {
    id: 'daisangen',
    name: '大三元',
    han: -1,
    category: '无限制',
    difficulty: '难',
    desc: '三元牌三组刻子',
    tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z3', 'z3', 'z3', 'w1', 'w1', 'w1', 'w1']
  },
  {
    id: 'shosuushii',
    name: '小四喜',
    han: -1,
    category: '无限制',
    difficulty: '超难',
    desc: '东南西北中3种是刻子，另一种是对子',
    tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z3', 'z3', 'z3', 'd4', 'd4', 'w1', 'w1']
  },
  {
    id: 'daisuushii',
    name: '大四喜',
    han: -1,
    category: '无限制',
    difficulty: '超难',
    desc: '东南西北四组刻子',
    tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z3', 'z3', 'z3', 'd4', 'd4', 'd4', 'w1']
  },
  {
    id: 'tsuuiisou',
    name: '字一色',
    han: -1,
    category: '无限制',
    difficulty: '超难',
    desc: '字牌组成的七对子或对对和',
    tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z1', 'z1', 'z1', 'z2', 'z2', 'z3', 'z3']
  },
  {
    id: 'ryuuiisou',
    name: '绿一色',
    han: -1,
    category: '无限制',
    difficulty: '超难',
    desc: '由2s3s4s6s8s6z组成的和牌',
    tiles: ['s2', 's3', 's4', 'z2', 'z2', 's3', 's2', 's4', 's6', 's6', 's6', 's8', 's8']
  },
  {
    id: 'chinrooto',
    name: '清老头',
    han: -1,
    category: '无限制',
    difficulty: '超难',
    desc: '由19m19s19p组成的对对和',
    tiles: ['w1', 'w1', 'w1', 'w9', 'w9', 'w9', 's1', 's1', 's9', 's9', 's9', 'b1', 'b1']
  },
  // 役满役 - 门前清
  {
    id: 'kokushimusou',
    name: '国士无双',
    han: -1,
    category: '门前清',
    difficulty: '难',
    desc: '13种幺九牌各一枚再加其中任何一枚和牌',
    tiles: ['w1', 'w9', 'b1', 'b9', 's1', 's9', 'z2', 'z2', 'z3', 'd4', 'z1', 'z2', 'z3']
  },
  {
    id: 'kokushimusou13',
    name: '国士无双13面',
    han: -1,
    category: '门前清',
    difficulty: '最难',
    desc: '幺九种类=13，9面听',
    tiles: ['w1', 'w9', 'b1', 'b9', 's1', 's9', 'z1', 'z2', 'z3', 'd4', 'z1', 'z2', 'z3']
  },
  {
    id: 'suanko',
    name: '四暗刻',
    han: -1,
    category: '门前清',
    difficulty: '难',
    desc: '门清对对和，双碰听牌',
    tiles: ['b1', 'b1', 'b1', 'b2', 'b2', 'b2', 'b3', 'b3', 'b3', 'b6', 'b6', 'b8', 'b8']
  },
  {
    id: 'suanko-taneki',
    name: '四暗刻单骑',
    han: -1,
    category: '门前清',
    difficulty: '超难',
    desc: '门清对对和，单骑听牌',
    tiles: ['b1', 'b1', 'b1', 'b2', 'b2', 'b2', 'b3', 'b3', 'b3', 'b6', 'b6', 'b6', 'b8']
  },
  {
    id: 'chuuren',
    name: '九莲宝灯',
    han: -1,
    category: '门前清',
    difficulty: '最难',
    desc: '带有1112345678999的清一色',
    tiles: ['w1', 'w1', 'w1', 'w2', 'w3', 'w4', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w9']
  },
  {
    id: 'junchuuren',
    name: '纯正九莲宝灯',
    han: -1,
    category: '门前清',
    difficulty: '最难',
    desc: '由111234567899组成，9面听清一色',
    tiles: ['w1', 'w1', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w9', 'w9']
  },
  {
    id: 'tenhou',
    name: '天和',
    han: -1,
    category: '门前清',
    difficulty: '偶然',
    desc: '亲家配牌时和牌',
    tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 's1', 's1', 's1', 's1']
  },
  {
    id: 'chihou',
    name: '地和',
    han: -1,
    category: '门前清',
    difficulty: '偶然',
    desc: '子家首次摸牌时自摸',
    tiles: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 's1', 's1', 's1', 's1']
  },
  {
    id: 'sukantsu',
    name: '四杠子',
    han: -1,
    category: '无限制',
    difficulty: '最难',
    desc: '四组杠子',
    tiles: ['w1', 'w1', 'w1', 'z1', 'z1', 'z1', 'w5', 'w5', 'w5', 'w2', 'w2', 'w2', 'b8']
  }
]
