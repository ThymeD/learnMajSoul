# 役种一览 - 技术架构设计文档

## 1. 技术架构概述

### 1.1 系统架构

本功能采用 **Vue 3 + TypeScript** 单页面应用架构，使用 Vite 作为构建工具。整体架构遵循 Vue 3 组合式 API (Composition API) 最佳实践，实现数据驱动视图的响应式更新。

```
┌─────────────────────────────────────────────────────────────┐
│                      YakuView.vue                          │
│                   (页面主组件 - 710行)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  筛选器区域   │  │  役种列表     │  │   侧边导航栏     │  │
│  │ (番数/分类)  │  │ (卡片展示)    │  │  (快速跳转)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    yaku.ts (数据层)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Yaku 接口定义 │ autoCalculateSplitAt 算法 │ 存储API │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              yaku-config.json (配置数据源)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MahjongTile.vue                          │
│                   (麻将牌展示组件)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  localStorage (持久化)                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Vue 3 | 组合式 API + `<script setup>` 语法 |
| 语言 | TypeScript | 严格类型检查 |
| 构建 | Vite | 快速开发服务器和构建 |
| UI | Element Plus | el-radio-group, el-input, el-card |
| 持久化 | localStorage | 役种掌握度 + 筛选状态 |
| 组件库 | 自定义 MahjongTile | 麻将牌可视化 |

---

## 2. 组件结构设计

### 2.1 组件层次

```
YakuView (根组件)
├── .yaku-header (头部区域)
│   ├── h2 (标题)
│   ├── .filter-groups (筛选条件组)
│   │   ├── .han-tabs (番数筛选)
│   │   └── .category-tabs (分类筛选)
│   └── .search-input (搜索框)
├── .yaku-content (内容区域)
│   ├── .yaku-list (役种卡片列表)
│   │   └── YakuCard (v-for 循环)
│   │       ├── .yaku-top (名称+番数+条件)
│   │       ├── .yaku-middle (描述)
│   │       └── .yaku-bottom (麻将牌展示)
│   │           └── MahjongTile (麻将牌组件)
│   └── .nav-area (侧边导航)
│       └── .nav-list (快速跳转列表)
```

### 2.2 MahjongTile 组件接口

```typescript
interface MahjongTileProps {
  tileId: string        // 牌ID: 'w1', 'b5', 's9', 'd1', 'z1' 等
  width?: number        // 牌宽度 (默认 100)
  showName?: boolean    // 是否显示牌名 (默认 true)
  split?: boolean       // 是否在牌右侧添加间隔 (用于分割牌组)
}
```

---

## 3. 数据流设计

### 3.1 数据流向

```
┌─────────────────┐
│ yaku-config.json│ ←── 静态配置数据源
└────────┬────────┘
         │ 读取
         ▼
┌─────────────────┐
│    yaku.ts     │ ←── 核心数据模块
│  (yakuData)    │
└────────┬────────┘
         │ 导入
         ▼
┌─────────────────┐
│   YakuView.vue  │
│  (响应式数据)   │
└────────┬────────┘
         │ 计算属性过滤
         ▼
┌─────────────────┐
│  filteredYaku   │ ──→ 渲染役种卡片列表
└─────────────────┘
```

### 3.2 响应式数据流

```typescript
// YakuView.vue 中的响应式数据
const searchText = ref('')           // 搜索文本
const activeHan = ref(1)             // 当前番数筛选
const activeCategory = ref('')       // 当前分类筛选
const activeId = ref('')             // 当前选中役种

// 计算属性
const filteredYaku = computed(() => {
  // 依次应用: 搜索过滤 → 番数过滤 → 分类过滤
  return yakuData.filter(...)
})

// 监听器
watch([activeHan, activeCategory], () => {
  // 持久化筛选状态到 localStorage
  localStorage.setItem(YAKU_FILTER_KEY, JSON.stringify({...}))
})
```

---

## 4. 核心算法说明 (autoCalculateSplitAt)

### 4.1 算法概述

`autoCalculateSplitAt` 函数用于自动计算麻将牌型的分割位置，返回需要在哪些索引处插入间隔（便于视觉区分牌组）。

### 4.2 算法规则

| 规则 | 说明 | 示例 |
|------|------|------|
| 刻子/杠分隔 | 刻子(AAA)或杠(AAAA)结束后分隔 | w1w1w1 w2w2w2 → 分隔在 index 3 |
| 顺子分隔 | 顺子(ABC)结束后分隔（若后面接雀头或听牌） | w1w2w3 w4w5w6 → 分隔在 index 6 |
| 雀头分隔 | 单独一张牌作为雀头时，左右都分隔 | AA BBB CCC DD → 分隔在 index 2, 5, 8, 10 |
| 听牌分隔 | 听牌位置在牌组左边有空隙 | 立直听牌 → 分隔在 index 13 |
| 国士无双 | 全部幺九牌特殊处理 | 13张不同幺九 → 分隔在 index 12 |
| 九莲宝灯 | 同种数牌1112345678999 | 分隔在 index 12 |
| 三杠及以上 | 只显示听牌间隔 | suukantsu → 分隔在 index 12 |

### 4.3 算法实现逻辑

```typescript
export const autoCalculateSplitAt = (tiles: string[]): number[] => {
  // 1. 空牌组返回空数组
  if (tiles.length === 4) return []

  // 2. 国士无双检测 (13张不同幺九牌)
  if (tiles.filter(t => 'w19b19s19d1234z123'.includes(t)).length === 13) {
    return [12]  // 听牌在最后一张前
  }

  // 3. 九莲宝灯检测 (同种数牌 1112345678999)
  if (tiles[0] === tiles[1] && tiles[1] === tiles[2] && 
      tiles[3] === tiles[4] && tiles[4] === tiles[5] && 
      /* ... 8组刻子/顺子 ... */) {
    return [2, 5, 8, 11, 12]  // 听牌分隔
  }

  // 4. 通用牌组分割
  // 遍历牌组，识别刻子(AAA)、顺子(ABC)，在分隔处记录索引
  // 同时检测听牌位置（雀头所在索引）
  
  // 5. 返回去重排序后的分割索引数组
  return [...new Set(splitAt)].sort((a, b) => a - b)
}
```

---

## 5. 状态管理方案

### 5.1 本地状态管理

采用 Vue 3 内置的响应式系统，无需引入 Vuex/Pinia：

| 状态 | 类型 | 用途 |
|------|------|------|
| `searchText` | `Ref<string>` | 搜索关键词 |
| `activeHan` | `Ref<number \| string>` | 番数筛选值 |
| `activeCategory` | `Ref<string>` | 分类筛选值 |
| `activeId` | `Ref<string>` | 当前选中役种ID |
| `pressingYakuId` | `Ref<string>` | 长按中的役种ID |
| `yakuData` | `Reactive<Yaku[]>` | 役种数据（响应式） |

### 5.2 数据共享方式

```typescript
// 从 yaku.ts 导入核心数据
import { yakuData, setYakuMastery, clearAllMastery } from '../data/yaku'

// 全局暴露给浏览器控制台调试
// (在项目某处通过 window.yakuUtils 暴露)
```

---

## 6. 存储方案 (localStorage)

### 6.1 存储键名

| 键名 | 用途 | 数据结构 |
|------|------|---------|
| `yaku-mastery` | 役种已胡次数 | `Record<string, number>` |
| `yaku-filter` | 筛选状态 | `{ han: number \| string, category: string }` |

### 6.2 存储结构

```typescript
// yaku-mastery 示例
{
  "reach": 5,        // 立直已胡 5 次
  "tanyao": 3,      // 断幺九已胡 3 次
  "tsumo": 2         // 门前清自摸和已胡 2 次
}

// yaku-filter 示例
{
  "han": 1,         // 当前筛选 "一番"
  "category": "门前清"  // 当前筛选 "门前清"
}
```

### 6.3 存储操作

```typescript
// 加载已胡次数
const loadMastery = () => {
  const stored = localStorage.getItem('yaku-mastery')
  if (stored) {
    const masteryMap = JSON.parse(stored)
    yakuData.forEach(y => {
      if (masteryMap[y.id] !== undefined) {
        y.mastery = masteryMap[y.id]
      }
    })
  }
}

// 保存已胡次数
const saveMastery = () => {
  const masteryMap: Record<string, number> = {}
  yakuData.forEach(y => {
    if (y.mastery) {
      masteryMap[y.id] = y.mastery
    }
  })
  localStorage.setItem('yaku-mastery', JSON.stringify(masteryMap))
}

// 监听变化自动保存
watch(() => yakuData.map(y => y.mastery), () => {
  saveMastery()
}, { deep: true })
```

---

## 7. 接口设计 (Yaku 类型定义)

### 7.1 Yaku 接口

```typescript
export interface Yaku {
  /** 役种唯一标识 */
  id: string
  
  /** 役种名称 */
  name: string
  
  /** 番数: 正数=番数, 5=满贯, 8=役满, -2=双倍役满, -3=流局 */
  han: number
  
  /** 限制条件分类 */
  category: '无限制' | '门前清' | '副露后'
  
  /** 役种描述 */
  desc: string
  
  /** 展示用麻将牌ID数组 */
  tiles: string[]
  
  /** 分割位置索引数组 (可选，用于自动计算) */
  splitAt?: number[]
  
  /** 已胡次数 (运行时属性) */
  mastery?: number
  
  /** 是否为和牌役 (可增加已胡次数) */
  isHu?: boolean
  
  /** 是否为效果类(非役) */
  isEffectOnly?: boolean
  
  /** 是否仅庄家可用 */
  isDealerOnly?: boolean
  
  /** 是否仅子家可用 */
  isNonDealerOnly?: boolean
  
  /** 额外说明 */
  note?: string
}
```

### 7.2 番数映射

| han 值 | 显示文本 | 说明 |
|--------|---------|------|
| 1 | 1番 | 一番 |
| 2 | 2番 | 二番 |
| 3 | 3番 | 三番 |
| 5 | 满贯 | 满贯 (5番) |
| 6 | 6番 | 六番 |
| 8 | 役满 | 役满 (8番) |
| -2 | 双倍役满 | 双倍役满 (16番) |
| -3 | 流局 | 流局 (特殊) |

### 7.3 牌ID规范

```
万牌: w1 ~ w9      (wan)
筒牌: b1 ~ b9      (binton)
索牌: s1 ~ s9      (sou)
字牌: d1 ~ d4     (dong/nan/xi/bei)
     z1 ~ z3       (bai/zhong/fa)
赤牌: rw5/rb5/rs5 (red-wan/red-bai/red-sou)
特殊: bg           (牌背)
```

---

## 8. 总结

本功能采用简洁的 Vue 3 单组件架构，通过：

1. **数据驱动**: 静态配置 + 运行时状态分离
2. **自动计算**: `autoCalculateSplitAt` 算法自动处理牌组分割
3. **持久化**: localStorage 保存学习进度和筛选偏好
4. **响应式**: Vue 3 组合式 API 实现流畅交互

架构设计遵循"简单优先"原则，无需引入额外状态管理库，保持代码轻量且易于维护。
