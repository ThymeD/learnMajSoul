export type RuleMode = 'yonma' | 'sanma' | 'both'

export interface RuleReviewOption {
  id: string
  label: string
}

export interface RuleReviewItem {
  id: string
  title: string
  mode: RuleMode
  category: '役种判定' | '计番规则' | '局况事件' | '数据一致性' | '实现边界'
  reason: string
  question: string
  options: RuleReviewOption[]
}

const baseDecisionOptions: RuleReviewOption[] = [
  { id: 'accept', label: '采纳建议并修正' },
  { id: 'keep', label: '维持现状' },
  { id: 'defer', label: '暂缓，后续处理' },
  { id: 'need-info', label: '需要更多信息' }
]

export const ruleReviewItems: RuleReviewItem[] = [
  {
    id: 'tile-source-double-count',
    title: '役种判定输入是否重复计入副露',
    mode: 'both',
    category: '役种判定',
    reason:
      'allTiles 已含副露时，yaku matcher 内部又拼一次副露，可能导致对对和/混老头等误判。',
    question: '是否统一为“allTiles 包含副露，matcher 内不再二次拼副露”？',
    options: baseDecisionOptions
  },
  {
    id: 'chitoitsu-merge-yaku',
    title: '七对子是否允许与其他役复合',
    mode: 'both',
    category: '役种判定',
    reason: '当前七对子走 special 分支后直接 return，可能漏掉断幺九/混一色/清一色等复合役。',
    question: '是否按雀魂规则允许七对子与可兼容役种叠加？',
    options: baseDecisionOptions
  },
  {
    id: 'sanankou-open-pon',
    title: '三暗刻是否把碰算作暗刻',
    mode: 'both',
    category: '役种判定',
    reason: '当前逻辑把副露 pon 加入暗刻计数，和标准定义冲突。',
    question: '是否改为仅统计暗刻（副露碰不计入）？',
    options: baseDecisionOptions
  },
  {
    id: 'riichi-tsumo-trigger',
    title: '立直/门前清自摸触发条件',
    mode: 'both',
    category: '役种判定',
    reason: '当前依赖 tingPai.length > 0，胡牌态可能不显示立直/门清自摸。',
    question: '是否改为“胡牌成立且门清/自摸/立直状态满足”即判定？',
    options: baseDecisionOptions
  },
  {
    id: 'pinfu-ryanmen-and-jantou',
    title: '平和细则（两面听与雀头）',
    mode: 'both',
    category: '役种判定',
    reason: '当前为简化实现：顺子分割即近似平和，且字牌雀头一律排除。',
    question: '是否严格按平和规则：非役牌雀头 + 两面听 + 4顺子？',
    options: baseDecisionOptions
  },
  {
    id: 'sanshoku-ikkitsu-open-only',
    title: '三色同顺/一气通贯是否仅副露后判定',
    mode: 'both',
    category: '役种判定',
    reason: '当前仅 fulu.length > 0 才判定；门清场景会漏判。',
    question: '是否改为门清与副露都判定，番值按开闭门分别处理？',
    options: baseDecisionOptions
  },
  {
    id: 'han-reduction-model',
    title: '开门减番模型',
    mode: 'both',
    category: '计番规则',
    reason: '当前是全局总番 -1；标准应为逐役 open/closed 番值。',
    question: '是否改为“每个役定义 closedHan/openHan”表驱动计番？',
    options: baseDecisionOptions
  },
  {
    id: 'yakuhai-id-mapping',
    title: '役牌 ID 规范统一',
    mode: 'both',
    category: '数据一致性',
    reason: 'matcher 返回 yakuhai-自风/场风，配置为 yakuhai-jikaze/bakaze，映射不一致。',
    question: '是否统一 ID 命名并建立 matcher↔配置映射表？',
    options: baseDecisionOptions
  },
  {
    id: 'duplicate-config-id',
    title: '配置存在重复 ID（四风连打/四杠散了）',
    mode: 'both',
    category: '数据一致性',
    reason: '同一 ID 出现多次且番值冲突（8 与 -3）。',
    question: '是否拆分为“役满牌型”和“流局事件”两套 ID？',
    options: baseDecisionOptions
  },
  {
    id: 'event-vs-yaku',
    title: '流局事件是否从胡牌分析中分离',
    mode: 'both',
    category: '局况事件',
    reason: '四风连打/四家立直/九种九牌等属于局况，不是胡牌役种。',
    question: '是否在分析结果中分出“胡牌役种”和“局况事件”两栏？',
    options: baseDecisionOptions
  },
  {
    id: 'sanma-kita',
    title: '三麻北拔（北宝牌）规则',
    mode: 'sanma',
    category: '役种判定',
    reason: '三麻特有规则，当前分析输入没有“拔北次数/北宝牌计分”字段。',
    question: '是否把“拔北次数”纳入分析输入并计入番数？',
    options: baseDecisionOptions
  },
  {
    id: 'sanma-available-yaku',
    title: '三麻役种白名单',
    mode: 'sanma',
    category: '实现边界',
    reason: '三麻与四麻役种集合不同（含场况役、双倍役满开关等）。',
    question: '是否维护独立的三麻 role set，并在界面切换时动态生效？',
    options: baseDecisionOptions
  },
  {
    id: 'sanma-red-dora-count',
    title: '三麻赤宝牌与宝牌上限',
    mode: 'sanma',
    category: '计番规则',
    reason: '三麻赤牌配置与四麻可能不同，需要明确采用雀魂默认配置。',
    question: '是否固定采用雀魂三麻默认赤牌/宝牌规则？',
    options: baseDecisionOptions
  },
  {
    id: 'yonma-double-yakuman',
    title: '四麻双倍役满开关',
    mode: 'yonma',
    category: '计番规则',
    reason: '配置中已出现 double-* 役种，但 matcher 未完整落地。',
    question: '是否启用并实现双倍役满（四暗刻单骑/国士13面/纯正九莲/大四喜）？',
    options: baseDecisionOptions
  },
  {
    id: 'context-input-expansion',
    title: '分析输入上下文字段扩展',
    mode: 'both',
    category: '实现边界',
    reason:
      '抢杠/岭上/海底/河底/一发/两立直/天和地和等依赖时序上下文；当前手牌分析阶段实现复杂度高。',
    question: '是否确认“手牌分析不支持时序役，延后到人机对局高级功能实现”？',
    options: [
      { id: 'accept', label: '确认：手牌分析阶段不支持，后续人机对局再实现' },
      { id: 'keep', label: '仍要在手牌分析阶段支持' },
      { id: 'defer', label: '先不决定，后续评审' },
      { id: 'need-info', label: '需要更多信息' }
    ]
  }
]
