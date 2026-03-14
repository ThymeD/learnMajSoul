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
```

## 项目结构

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

## 菜单页面

| 路由 | 页面 | 说明 |
|------|------|------|
| /home | 首页 | 项目入口 |
| /hand | 手牌分析 | 待开发 |
| /tiles | 素材验证 | 麻将牌素材展示 |
| /yaku | 役种一览 | 役种列表及导航 |
| /draft | 草稿区 | 临时功能验证 |
| /strategy | 策略指南 | 待开发 |

## 组件

### MahjongTile 麻将牌组件

```vue
<MahjongTile tile-id="w1" />           <!-- 默认尺寸 100px -->
<MahjongTile tile-id="w1" :width="60" /> <!-- 自定义宽度 -->
```

属性：
- `tileId`: 牌面ID (w1-w9, b1-b9, s1-s9, d1-d4, z1-z3)
- `width`: 宽度数值，高度按 8:13 比例自动计算

### 麻将牌 ID 规则

| 前缀 | 牌种 |
|------|------|
| w1-w9 | 1-9万 |
| b1-b9 | 1-9筒 |
| s1-s9 | 1-9条 |
| d1-d4 | 东南西北风 |
| z1-z3 | 白中发 |

## 开发规范

见 [AGENTS.md](./AGENTS.md)

## 相关文档

- [AGENTS.md](./AGENTS.md) - 项目规则
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - 项目状态

## 技术栈

- Vue 3 + TypeScript
- Vite
- Element Plus
- Vue Router
- Pinia
