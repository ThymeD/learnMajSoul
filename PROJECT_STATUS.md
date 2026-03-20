# 雀魂麻将攻略 - 项目状态

> 最后更新：2026-03-20

## 项目概述

Vue3 + TypeScript + Vite + Element Plus 麻将游戏攻略系统

## 页面清单

| 路由 | 页面 | 状态 | 说明 |
|------|------|------|------|
| /home | 首页 | ✅ 完成 | 项目入口 |
| /hand | 手牌分析 | ✅ 已实现 | 持续迭代 |
| /tiles | 素材验证 | ✅ 完成 | 麻将牌素材展示 |
| /yaku | 役种一览 | ✅ 完成 | 35+役种展示 |
| /draft | 草稿区 | 🔧 维护中 | 临时功能验证 |
| /strategy | 策略指南 | ⏳ 待开发 | - |

## 技术栈

- Vue 3 + TypeScript + Vite
- Element Plus + Vue Router + Pinia

## 构建与测试

```bash
# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test:run

# 代码格式化
npm run format
```

## 役种一览模块

详见：[docs/yaku-guide.md](./docs/yaku-guide.md)

## 开发规范

- 任务管理：使用 `collaboration.md` 追踪需求与缺陷闭环
- 规范文档：见 [AGENTS.md](./AGENTS.md)
- 优化计划：见 [PROJECT_OPTIMIZATION.md](./PROJECT_OPTIMIZATION.md)

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-20 | 工作流切换：迁移到 Cursor，建立需求/缺陷闭环规则 |
| 2026-03-16 | 项目优化：测试修复、工具链完善、代码清理 |
