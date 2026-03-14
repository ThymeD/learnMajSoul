# 雀魂麻将攻略 - 项目状态

## 项目概述
Vue3 + TypeScript + Vite + Element Plus 麻将游戏攻略系统

## 菜单结构
| 路径 | 页面 | 状态 |
|------|------|------|
| /home | 首页 | 完成 |
| /hand | 手牌分析 | 待开发 |
| /tiles | 素材验证 | 完成 |
| /yaku | 役种一览 | 完成 |
| /draft | 草稿区 | 验证中 |
| /strategy | 策略指南 | 待开发 |

## 组件
- `MahjongTile.vue` - 麻将牌组件
  - 属性：`tileId` (string), `width` (number, 默认100)
  - 比例：8:13
  - 圆角：自动 width/10

## 数据
- `src/data/yaku.ts` - 役种数据（35+种役种）
- 素材本地化：z1=白、z2=中、z3=发，d1-d4=东南西北

## 素材
- `src/assets/mahjong/` - 34张麻将牌
- `src/assets/hand-patterns/` - 17张役种图

## 技术规范
- UI组件库：Element Plus
- 文档：https://element-plus.org/zh-CN/
- 构建命令：npm run build
- 开发命令：npm run dev
- 测试命令：npm run test:run

## 待开发
- 手牌分析功能
- 策略指南功能

## 规则
- 草稿区开发：覆盖前需确认，旧内容备份
- 先设计后实现，方案需用户确认
- 每次独立特性完成后提交本地
