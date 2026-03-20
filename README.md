# 雀魂麻将攻略

Vue3 + TypeScript + Vite + Element Plus 麻将游戏攻略系统

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 单元测试
npm run test:run
```

## 流程入口（统一）

1. [collaboration.md](./collaboration.md) - 任务池、缺陷闭环、迭代记录（执行入口）
2. [requirements/INDEX.md](./requirements/INDEX.md) - 需求主索引（需求真相源）
3. [AGENTS.md](./AGENTS.md) - 协作约束与工作流规则

## 文档职责边界

| 文档 | 承载内容 | 不承载内容 |
|------|----------|------------|
| `README.md` | 项目简介、启动方式、文档导航 | 任务状态、缺陷状态、详细验收标准 |
| `collaboration.md` | 执行中的任务、缺陷闭环、迭代记录 | 需求细节定义 |
| `requirements/INDEX.md` | 需求索引与状态 | 具体实现过程 |
| `requirements/*` | 单模块需求、验收标准、边界条件 | 日常执行记录 |

## 项目结构（简）

```
src/
├── assets/
│   ├── mahjong/          # 麻将牌素材（34张）
│   ├── hand-patterns/    # 役种素材图
│   └── 日麻规则.txt      # 日麻役种规则参考
├── components/
│   └── MahjongTile.vue   # 麻将牌组件
├── data/
│   └── yaku.ts          # 役种数据
├── layouts/
│   └── MainLayout.vue    # 左侧菜单布局
├── router/
│   └── index.ts         # 路由配置
├── stores/               # Pinia 状态管理
└── views/
    ├── HomeView.vue      # 首页
    ├── HandView.vue      # 手牌分析
    ├── TilesView.vue     # 素材验证
    ├── YakuView.vue      # 役种一览
    ├── DraftView.vue     # 草稿区
    ├── StrategyView.vue  # 策略指南
    └── draft/           # 草稿区临时开发
```

## 菜单页面（高层）

| 路由 | 页面 | 说明 |
|------|------|------|
| /home | 首页 | 项目入口 |
| /hand | 手牌分析 | 已实现，持续迭代 |
| /tiles | 素材验证 | 麻将牌素材展示 |
| /yaku | 役种一览 | 役种列表及导航 |
| /draft | 草稿区 | 临时功能验证 |
| /strategy | 策略指南 | 待开发 |

## 其他参考文档

- [requirements/SPEC.md](./requirements/SPEC.md) - 页面级高层概览（非执行清单）
- [docs/branch-strategy.md](./docs/branch-strategy.md) - 分支管理策略

## 技术栈

- Vue 3 + TypeScript
- Vite
- Element Plus
- Vue Router
- Pinia
