# 技术架构文档

## 项目：雀魂麻将游戏攻略 - 手牌分析功能

---

## 1. 技术选型

| 类别      | 选择                   | 说明                             |
| --------- | ---------------------- | -------------------------------- |
| 前端框架  | Vue3 + Composition API | 更好的 TypeScript 支持和逻辑复用 |
| 构建工具  | Vite                   | 快速热更新和打包                 |
| UI 组件库 | Element Plus           | 按需求优先使用，部分定制         |
| 状态管理  | Pinia                  | 轻量级、TypeScript 友好          |
| 语言      | TypeScript (strict)    | 严格类型检查，提升代码质量       |
| 样式      | Scoped CSS             | 组件样式隔离                     |

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         HandView.vue                             │
│                     (手牌分析主页面)                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  TileSelector   │  │  HandPanel      │  │  ResultPanel   │ │
│  │  (素材选择区)    │  │  (手牌/副露/牌河)│  │  (分析结果)    │ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘ │
│           │                    │                   │           │
│           └────────────────────┼───────────────────┘           │
│                                │                               │
│                    ┌───────────▼───────────┐                   │
│                    │     useHandStore      │                   │
│                    │      (Pinia Store)    │                   │
│                    └───────────┬───────────┘                   │
│                                │                               │
│           ┌────────────────────┼────────────────────┐          │
│           │                    │                    │          │
│    ┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────┐   │
│    │  mahjong.ts │    │  yaku-match.ts │   │  hand.ts    │   │
│    │ (胡牌判定)   │    │  (役种匹配)    │   │ (状态管理)  │   │
│    └─────────────┘    └───────────────┘   └─────────────┘   │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │                   yaku-config.json                      │  │
│    │                    (役种数据配置)                       │  │
│    └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分及职责

| 模块         | 文件路径                          | 职责                               |
| ------------ | --------------------------------- | ---------------------------------- |
| 页面组件     | src/views/HandView.vue            | 主页面布局，组件协调               |
| 素材选择组件 | src/components/TileSelector.vue   | 34种麻将牌展示、数量管理、拖拽源   |
| 麻将牌组件   | src/components/MahjongTile.vue    | 麻将牌图片渲染，支持牌背模式       |
| 手牌展示组件 | src/components/HandDisplay.vue    | 手牌区、摸牌区、牌河渲染（新增）   |
| 副露组件     | src/components/FuluPanel.vue      | 副露区、暂存区、吃碰杠操作（新增） |
| 役种设置组件 | src/components/YakuSettings.vue   | 立直、庄家、自风、场风设置（新增） |
| 分析结果组件 | src/components/AnalysisResult.vue | 分析结果展示（新增）               |
| 状态管理     | src/stores/hand.ts                | 统一状态管理，持久化               |
| 胡牌算法     | src/utils/mahjong.ts              | 胡牌判定、听牌分析、面子分割       |
| 役种匹配     | src/utils/yaku-match.ts           | 役种判定、番数计算                 |
| 随机生成     | src/utils/random-hand.ts          | 随机生成可胡牌牌型（新增）         |

---

## 3. 核心数据结构

### 3.1 麻将牌类型定义

```typescript
// src/utils/mahjong.ts

/** 牌ID格式：
 * - 万：w1~w9 (w=wan)
 * - 筒：b1~b9 (b=bamboo)
 * - 索：s1~s9 (s=string)
 * - 东南西北：d1~d4 (d=direction)
 * - 白中发：z1~z3 (z=zong)
 * - 赤五万/筒/索：rw5/rb5/rs5
 */
export type Tile = string

/** 风牌：d1-东, d2-南, d3-西, d4-北 */
export type Wind = 'd1' | 'd2' | 'd3' | 'd4'

/** 三元牌：z1-白, z2-中, z3-发 */
export type Dragon = 'z1' | 'z2' | 'z3'

/** 面子类型：顺子、刻子、杠子 */
export type MentsuType = 'shunzi' | 'kezi' | 'gangzi'

/** 面子结构 */
export interface Mentsu {
  type: MentsuType
  tiles: [Tile, Tile, Tile] | [Tile, Tile, Tile, Tile]
}

/** 胡牌结果 */
export interface HuResult {
  isHu: boolean
  mentsu: Mentsu[]
  jietou: Tile | null
}

/** 手牌分析结果 */
export interface HandAnalysis {
  isHu: boolean
  isTing: boolean
  tingPai: Tile[]
  isKokushimusou: boolean
  isKokushimusou13: boolean
  isChitoitsu: boolean
  isChuurenpu: boolean
  isChuurenpu9: boolean
  splitResult: SplitResult | null
}
```

### 3.2 副露类型定义

```typescript
// src/stores/hand.ts

/** 副露类型 */
export type FuluType = 'chi' | 'pon' | 'kan'

/** 副露结构 */
export interface Fulu {
  type: FuluType
  tiles: Tile[] // 吃的牌/碰的牌/杠的牌
  from?: number // 来自哪一家（0=上家,1=对家,2=下家）- 吃牌需要
  isOpen?: boolean // 是否明杠（暗杠=false）
}

/** 副露暂存区 */
export interface FuluTemp {
  tiles: Tile[] // 暂存的牌
  createdAt: number // 创建时间戳
}
```

### 3.3 分析结果类型定义

```typescript
// src/stores/hand.ts

/** 分析结果 */
export interface AnalysisResult {
  isTing: boolean // 是否听牌
  isHu: boolean // 是否胡牌
  tingPai: Tile[] // 听牌列表
  zhenTing: boolean // 是否振听
  han: number // 总番数
  yaku: YakuMatchResult[] // 匹配的役种列表（详细结果）
  error?: string // 校验错误信息
}

/** 役种匹配结果（详细版）*/
export interface YakuMatchResult {
  id: string
  name: string
  han: number
  matched: boolean
  reason?: string
}
```

### 3.4 状态管理设计（Pinia Store）

```typescript
// src/stores/hand.ts

export const useHandStore = defineStore('hand', () => {
  // ========== State ==========
  const tiles = ref<Tile[]>([])           // 手牌13张
  const drawTile = ref<Tile | null>(null) // 摸牌
  const fulu = ref<Fulu[]>([])            // 副露列表
  const river = ref<Tile[]>([])           // 牌河
  const isLiqi = ref(false)               // 立直状态
  const dealer = ref(false)                // 庄家
  const selfWind = ref<Wind>('d1')        // 自风
  const fieldWind = ref<Wind>('d1')       // 场风
  const analysis = ref<AnalysisResult | null>(null) // 分析结果
  const fuluTemp = ref<FuluTemp[]>([])     // 副露暂存区

  // ========== Getters ==========
  const allTiles = computed(() => {
    const result = [...tiles.value]
    if (drawTile.value) result.push(drawTile.value)
    return sortTiles(result)
  })

  const tileCount = computed(() => tiles.value.length)

  const canLiqi = computed(() =>
    !isLiqi.value && fulu.value.length === 0 && tiles.value.length === 13
  )

  const isMenqian = computed(() => fulu.value.length === 0)

  // ========== Actions ==========
  function addTile(tile: Tile): boolean { ... }
  function removeTile(tile: Tile, index?: number): boolean { ... }
  function setDrawTile(tile: Tile | null): void { ... }
  function addToRiver(tile: Tile): boolean { ... }
  function removeFromRiver(index: number): void { ... }
  function addFulu(fuluItem: Fulu): void { ... }
  function removeFulu(index: number): void { ... }
  function toggleFuluType(index: number): void { ... } // 明杠/暗杠切换
  function setLiqi(liqi: boolean): void { ... }
  function setDealer(dealer: boolean): void { ... }
  function setSelfWind(wind: Wind): void { ... }
  function setFieldWind(wind: Wind): void { ... }
  function clear(): void { ... }
  function randomHand(): void { ... } // 修改为生成可胡牌牌型
  function analyze(): void { ... }

  // ========== 副露暂存区操作 ==========
  function addToFuluTemp(tile: Tile): void { ... }
  function removeFromFuluTemp(index: number): void { ... }
  function clearFuluTemp(): void { ... }
  function commitFuluTemp(): Fulu | null { ... } // 提交暂存区成组

  // ========== 持久化 ==========
  function saveState(): void { ... }
  function loadState(): void { ... }

  return { ... }
})
```

---

## 4. 关键算法

### 4.1 胡牌判定算法思路

**现有实现** (`mahjong.ts`):

```typescript
// 核心思路：递归尝试面子分割
function canHuRecursive(tiles: Tile[]): boolean {
  // 基础情况：牌全部取完
  if (tiles.length === 0) return true

  // 剩余牌数必须是3的倍数
  if (tiles.length % 3 !== 0) return false

  // 获取所有可能的面子（刻子、杠子、顺子）
  const mentsuList = getPossibleMentsu(tiles)

  // 尝试移除每个面子，递归检测
  for (const mentsu of mentsuList) {
    const remaining = removeMentsu(tiles, mentsu)
    if (canHuRecursive(remaining)) return true
  }

  return false
}
```

**算法优化建议**:

- 雀头选择优化：先找对子再分割面子，减少回溯
- 特殊牌型优先检测：国士无双、七对子、九莲宝灯优先于普通胡牌检测

### 4.2 听牌分析算法思路

```typescript
// 思路：遍历所有可能的牌，检测是否能胡
function getTingPai(hand: Tile[], drawTile?: Tile | null): Tile[] {
  const allTiles = drawTile ? [...hand, drawTile] : hand
  const tingPaiList: Tile[] = []

  // 遍历所有可能的牌
  for (const tile of getAllPossibleTiles()) {
    const testTiles = sortTiles([...allTiles, tile])
    if (checkHu(testTiles).isHu) {
      tingPaiList.push(tile)
    }
  }

  return Array.from(new Set(tingPaiList))
}
```

**振听判定**:

```typescript
function checkZhenTing(tingPai: Tile[], river: Tile[]): boolean {
  const riverSet = new Set(normalizeTiles(river))
  return tingPai.some((tile) => riverSet.has(normalizeRedFive(tile)))
}
```

### 4.3 役种匹配算法思路

```typescript
// src/utils/yaku-match.ts

function matchYaku(input: MatchInput): YakuMatchResult[] {
  // 1. 特殊役满优先检测（七对、国士、九莲）
  const specialYaku = matchSpecialYaku(sorted, isMenqian)
  if (specialYaku.length > 0) {
    return specialYaku // 特殊役满互斥，只返回一个
  }

  // 2. 门前清役种（需要门清状态）
  if (isMenqian) {
    // 立直、门前清自摸和、平和、一杯口、二杯口
  }

  // 3. 非门清役种
  // 断幺九、役牌（自风、场风、三元牌）、对对和、三暗刻等

  // 4. 颜色役种
  // 混一色、清一色、字一色、绿一色等

  // 5. 特殊役种
  // 小三元、大三元、小四喜、大四喜等
}
```

### 4.4 随机生成胡牌牌型算法思路（重点优化）

**需求**: 生成符合胡牌条件的14张牌（可带副露）

```typescript
// src/utils/random-hand.ts

/**
 * 随机生成可胡牌牌型
 * 策略：先生成随机面子分割，再填充剩余牌
 */
export function generateRandomHuHand(options: {
  includeFulu?: boolean // 是否包含副露
  targetYaku?: string[] // 目标役种（可选）
}): { tiles: Tile[]; drawTile: Tile | null; fulu: Fulu[] } {
  // 方案A：基于面子分割生成
  // 1. 随机选择雀头（对子）
  // 2. 随机选择4组面子（刻子/顺子）
  // 3. 验证是否能胡牌
  // 4. 如需副露，拆分部分面子为副露
  // 方案B：基于已知胡牌牌型随机变换
  // 1. 从预设的胡牌模板中随机选择一个
  // 2. 随机替换部分牌
  // 3. 验证是否符合胡牌条件
  // 推荐方案A，更灵活
}
```

**算法详细设计**:

```typescript
function generateHuHand(): HandResult {
  // 1. 生成基础牌池（每种4张）
  const pool = createFullPool()

  // 2. 随机选择雀头
  const jietou = pool.splice(randomIndex(pool.filter(isValidJietou)), 2)

  // 3. 随机生成4组面子
  const mentsu: Mentsu[] = []
  for (let i = 0; i < 4; i++) {
    const type = randomChoice(['shunzi', 'kezi', 'gangzi'])
    if (type === 'shunzi') {
      // 生成顺子：同花色连续3张
      const suit = randomChoice(['w', 'b', 's'])
      const start = Math.floor(Math.random() * 7) + 1
      mentsu.push([`${suit}${start}`, `${suit}${start + 1}`, `${suit}${start + 2}`])
    } else if (type === 'kezi') {
      // 生成刻子：3张相同牌
      const tile = pool.filter((t) => countInPool(pool, t) >= 3)[randomIndex()]
      mentsu.push([tile, tile, tile])
    } else {
      // 生成杠子：4张相同牌
      const tile = pool.filter((t) => countInPool(pool, t) >= 4)[randomIndex()]
      mentsu.push([tile, tile, tile, tile])
    }
  }

  // 4. 组合成完整手牌
  const allTiles = [...jietou, ...mentsu.flat()]

  // 5. 验证胡牌
  if (!checkHu(allTiles).isHu) {
    // 失败，重新生成
    return generateHuHand()
  }

  return { tiles: allTiles, drawTile: null, fulu: [] }
}
```

---

## 5. 组件设计

### 5.1 组件结构树

```
HandView.vue (主页面)
├── TileSelector.vue (素材选择区)
├── HandDisplay.vue (手牌展示区) [新增/重构]
│   ├── HandTiles.vue (手牌区)
│   └── DrawTile.vue (摸牌区)
├── FuluPanel.vue (副露区) [新增/重构]
│   ├── FuluGroups.vue (副露组列表)
│   ├── FuluTemp.vue (暂存区)
│   └── FuluButtons.vue (吃碰杠按钮)
├── RiverPanel.vue (牌河) [新增]
├── YakuSettings.vue (役种设置) [新增]
├── AnalysisResult.vue (分析结果) [新增/重构]
└── MahjongTile.vue (麻将牌组件) [已存在]
```

### 5.2 各组件职责说明

| 组件               | 路径                              | 职责                                           |
| ------------------ | --------------------------------- | ---------------------------------------------- |
| HandView.vue       | src/views/HandView.vue            | 主页面容器，协调各子组件                       |
| TileSelector.vue   | src/components/TileSelector.vue   | 素材区：34种牌展示，数量管理，搜索过滤，拖拽源 |
| HandDisplay.vue    | src/components/HandDisplay.vue    | 手牌+摸牌区域，拖拽目标                        |
| FuluPanel.vue      | src/components/FuluPanel.vue      | 副露区：吃碰杠操作，暂存区，明暗杠切换         |
| RiverPanel.vue     | src/components/RiverPanel.vue     | 牌河：已打出的牌展示                           |
| YakuSettings.vue   | src/components/YakuSettings.vue   | 立直、庄家、自风、场风设置                     |
| AnalysisResult.vue | src/components/AnalysisResult.vue | 分析结果：状态、役种列表、番数                 |
| MahjongTile.vue    | src/components/MahjongTile.vue    | 麻将牌渲染：图片显示、牌背模式                 |

### 5.3 组件接口设计

```typescript
// TileSelector.vue
interface Props {
  disabled?: boolean
  maxCount?: number // 最大数量（默认4）
  searchText?: string
  usedTiles?: string[] // 已使用的牌（用于计算剩余数量）
}
interface Emits {
  (e: 'select', tile: string): void
  (e: 'remove', tile: string, source: TileSource): void
}

// HandDisplay.vue
interface Props {
  tiles: string[]
  drawTile: string | null
  tingPai?: string[]
}
interface Emits {
  (e: 'tile-add', tile: string): void
  (e: 'tile-remove', tile: string, index: number): void
  (e: 'draw-set', tile: string): void
  (e: 'draw-remove'): void
}

// FuluPanel.vue
interface Props {
  fuluList: Fulu[]
  tempTiles: string[]
  disabled?: boolean
  mode: 'none' | 'chi' | 'pon' | 'kan'
}
interface Emits {
  (e: 'add', fulu: Fulu): void
  (e: 'remove', index: number): void
  (e: 'toggle-type', index: number): void // 明杠/暗杠切换
  (e: 'mode-change', mode: 'none' | 'chi' | 'pon' | 'kan'): void
  (e: 'temp-add', tile: string): void
  (e: 'temp-remove', index: number): void
}

// RiverPanel.vue
interface Props {
  tiles: string[]
}
interface Emits {
  (e: 'add', tile: string): void
  (e: 'remove', index: number): void
  (e: 'recover', index: number): void // 回收到手牌
}

// YakuSettings.vue
interface Props {
  isLiqi: boolean
  canLiqi: boolean
  dealer: boolean
  selfWind: Wind
  fieldWind: Wind
}
interface Emits {
  (e: 'liqi-change', value: boolean): void
  (e: 'dealer-change', value: boolean): void
  (e: 'self-wind-change', wind: Wind): void
  (e: 'field-wind-change', wind: Wind): void
}

// AnalysisResult.vue
interface Props {
  result: AnalysisResult | null
}
```

---

## 6. 接口设计

### 6.1 组件间通信方式

| 通信方式       | 适用场景                                         |
| -------------- | ------------------------------------------------ |
| Props/Emits    | 父子组件间数据传递和事件通信                     |
| Pinia Store    | 跨组件共享状态（tiles, drawTile, fulu, river等） |
| provide/inject | 深层嵌套组件间传递（如 HandView → HandDisplay）  |

### 6.2 事件定义

```typescript
// 拖拽事件（使用原生 DragEvent）
interface DragData {
  tile: Tile           // 牌ID
  source: TileSource   // 来源区域
  index?: number       // 来源索引
}

type TileSource = 'source' | 'hand' | 'draw' | 'river' | 'fulu' | 'fulu-temp'

// 主要事件流
// 1. 素材区选择
TileSelector:select(tile: Tile) → HandView → store.addTile(tile)

// 2. 牌移除（双击或按钮）
HandDisplay:tile-remove(tile, index) → HandView → store.removeTile(tile, index)

// 3. 摸牌设置
HandDisplay:draw-set(tile) → HandView → store.setDrawTile(tile)

// 4. 副露操作
FuluPanel:add(fulu) → HandView → store.addFulu(fulu)
FuluPanel:remove(index) → HandView → store.removeFulu(index)
FuluPanel:toggle-type(index) → HandView → store.toggleFuluType(index)

// 5. 役种设置变更
YakuSettings:liqi-change(value) → HandView → store.setLiqi(value)
YakuSettings:dealer-change(value) → HandView → store.setDealer(value)
YakuSettings:self-wind-change(wind) → HandView → store.setSelfWind(wind)
YakuSettings:field-wind-change(wind) → HandView → store.setFieldWind(wind)

// 6. 分析触发
HandView:analyze-click → store.analyze()
```

### 6.3 Store 核心接口

```typescript
// src/stores/hand.ts

interface HandStore {
  // State (只读)
  readonly tiles: Tile[]
  readonly drawTile: Tile | null
  readonly fulu: Fulu[]
  readonly river: Tile[]
  readonly isLiqi: boolean
  readonly dealer: boolean
  readonly selfWind: Wind
  readonly fieldWind: Wind
  readonly analysis: AnalysisResult | null

  // Getters
  allTiles: Tile[] // 手牌+摸牌
  tileCount: number // 手牌张数
  canLiqi: boolean // 能否立直
  isMenqian: boolean // 是否门清

  // Actions
  addTile(tile: Tile): boolean
  removeTile(tile: Tile, index?: number): boolean
  setDrawTile(tile: Tile | null): void
  addToRiver(tile: Tile): boolean
  removeFromRiver(index: number): void
  addFulu(fulu: Fulu): void
  removeFulu(index: number): void
  toggleFuluType(index: number): void // 明杠↔暗杠
  setLiqi(liqi: boolean): void
  setDealer(dealer: boolean): void
  setSelfWind(wind: Wind): void
  setFieldWind(wind: Wind): void
  clear(): void
  randomHand(): void
  analyze(): void

  // 副露暂存区
  addToFuluTemp(tile: Tile): void
  removeFromFuluTemp(index: number): void
  commitFuluTemp(): Fulu | null
  clearFuluTemp(): void
}
```

---

## 7. 文件结构

```
src/
├── views/
│   └── HandView.vue              # 手牌分析主页面
├── components/
│   ├── MahjongTile.vue           # 麻将牌渲染组件
│   ├── TileSelector.vue          # 素材选择区组件
│   ├── HandDisplay.vue           # 手牌展示区组件 [重构]
│   │   ├── HandTiles.vue         # 手牌区组件
│   │   └── DrawTile.vue          # 摸牌区组件
│   ├── FuluPanel.vue             # 副露区组件 [重构]
│   │   ├── FuluGroup.vue         # 副露组组件
│   │   ├── FuluTemp.vue          # 暂存区组件
│   │   └── FuluButtons.vue       # 吃碰杠按钮组件
│   ├── RiverPanel.vue            # 牌河组件 [重构]
│   ├── YakuSettings.vue          # 役种设置组件 [重构]
│   └── AnalysisResult.vue        # 分析结果组件 [重构]
├── stores/
│   └── hand.ts                   # 手牌状态管理
├── utils/
│   ├── mahjong.ts               # 麻将核心算法（已有）
│   ├── yaku-match.ts            # 役种匹配算法（已有）
│   ├── random-hand.ts           # 随机生成算法 [新增]
│   └── index.ts                 # 工具函数导出
├── data/
│   ├── yaku-config.json          # 役种配置数据
│   └── yaku.ts                  # 役种类型和工具函数
└── types/
    └── hand.ts                  # 手牌相关类型定义 [新增]

docs/
└── architecture.md              # 本文档

requirements/
├── hand-view-requirements.md    # 需求规格
└── yaku/
    ├── SPEC.md                  # 役种需求规格
    └── ARCHITECTURE.md          # 役种架构文档
```

---

## 8. 技术债务与优化建议

### 8.1 已知问题

| 问题           | 现状                     | 建议                                  |
| -------------- | ------------------------ | ------------------------------------- |
| 双击移除功能   | 未实现                   | 在各区域组件中添加 @dblclick 事件处理 |
| 随机生成算法   | 只生成随机牌，不保证胡牌 | 重写 randomHand() 为生成可胡牌牌型    |
| 拖拽交互       | 存在跨区域拖拽问题       | 完善 drag/drop 事件处理，增加测试     |
| 素材区数量同步 | 使用独立的 sourceTiles   | 与 store 状态统一，通过 computed 计算 |

### 8.2 优化建议

1. **组件拆分**: HandView.vue 代码量较大，建议拆分为多个小组件
2. **拖拽统一**: 抽取拖拽逻辑为 composable (`useDragDrop`)
3. **测试覆盖**: 增加自动化测试，特别是拖拽交互和胡牌判定
4. **性能优化**: 素材区搜索使用防抖，牌渲染使用虚拟列表（如果牌数量大）

---

## 9. 役种数据参考

役种配置存储在 `src/data/yaku-config.json`，关键字段：

```typescript
interface Yaku {
  id: string // 唯一标识
  name: string // 役种名称
  han: number // 番数（1-6, 5=满贯, 8=役满, -2=双倍役满, -3=流局）
  category: '无限制' | '门前清' | '副露后'
  desc: string // 描述
  tiles: string[] // 牌型示例
  splitAt?: number[] // 听牌分割位置
}
```

役种匹配逻辑参考 `src/utils/yaku-match.ts`，与役种配置保持一致。

---

## 10. 参考文档

| 文档         | 路径                                   |
| ------------ | -------------------------------------- |
| 需求规格     | requirements/hand-view-requirements.md |
| 役种需求规格 | requirements/yaku/SPEC.md              |
| 役种配置     | src/data/yaku-config.json              |
| 麻将算法     | src/utils/mahjong.ts                   |
| 役种匹配     | src/utils/yaku-match.ts                |
| 现有状态管理 | src/stores/hand.ts                     |

---

## 11. 后续工作

1. **UI Designer**: 基于本架构设计详细的 UI 组件结构和布局
2. **Coder**: 按照本架构实现各组件和功能
3. **Automation Tester**: 编写单元测试和集成测试
4. **UI Tester**: 进行 UI 自动化测试，重点测试拖拽交互

---

_文档版本: 1.0_
_创建时间: 2026-03-18_
_作者: Architect Agent_
