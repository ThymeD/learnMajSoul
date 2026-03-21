# 项目协作与约束

流程与「每次先读什么」以 **`.cursor/rules/workflow.md`** 为准。本文只放**技术约束**、**信息源索引**和**本地环境问题**处理，不维护多角色假名清单。

## 项目信息

- **项目名称**：雀魂麻将游戏攻略
- **项目简介**：雀魂麻将攻略系统，模块化开发，功能可独立验证后整合。
- **项目入口**：[README.md](./README.md)（快速开始、目录与路由导航）
- **本地开发**：http://localhost:5173 · `npm run dev`

---

## 技术约束

### UI 组件库

- **优先使用 Element Plus**，组件缺失时使用自定义组件但保持风格一致
- 遇到 AI 训练语料可能过时时，以官网 https://element-plus.org/zh-CN/ 为准

### TypeScript

- 全项目使用 TypeScript，严格类型检查

### 业务规则

- 正常胡牌 14 张牌（13 张手牌 + 1 张听牌）
- 开杠比正常胡牌多一张，每个杠多一张（杠 = 4 张相同的牌）

---

## 协作与信息源

| 文件 | 说明 |
| ---- | ---- |
| [README.md](./README.md) | 项目入口、命令、结构简图 |
| [collaboration.md](./collaboration.md) | 任务池、缺陷闭环、迭代记录 |
| [requirements/INDEX.md](./requirements/INDEX.md) | 需求索引与状态 |
| `.cursor/rules/workflow.md` | **对话先读顺序、需求/缺陷流程**（权威） |
| `.cursor/rules/context-efficiency.md` | 上下文预算与文件规模 |
| [docs/pm/pm-dual-repo-ai-maintenance.md](./docs/pm/pm-dual-repo-ai-maintenance.md) | 业务仓 + 数据仓双仓提交、`develop`/`release`、勿提交本机映射 |

---

## 本地开发环境问题

| 情况 | 处理 |
| ---- | ---- |
| 服务器未启动 / 端口无法访问 | 在项目目录执行 `npm run dev`，确认终端无报错 |
| 端口被占用 | 结束占用 5173 的进程或改 Vite 端口 |
| 启动失败、依赖异常 | 查终端与 `npm install`；必要时在 `collaboration.md` 或对话中记录现象 |

---

## 命名提示（避免混淆）

仓库目录 **`src/pm/`** 表示 **项目交付与数据管理** 套件代码，与「产品经理」等日常用语中的 **PM** 无关；文档见 [docs/pm/README.md](./docs/pm/README.md)。
