# 雀魂麻将游戏攻略 - 项目全局规则

---

## 1. 项目基础

### 项目概述

本项目旨在实现雀魂麻将游戏攻略系统，采用模块化开发，每个功能可独立验证，最终整合为完整系统。

### 技术规范

- **UI 组件库**：优先使用 Element Plus，组件缺失时使用自定义组件但保持风格一致
- **文档参考**：遇到 AI 训练语料可能过时时，以官网 https://element-plus.org/zh-CN/ 为准
- **TypeScript**：全项目使用 TypeScript，严格类型检查

### 业务规则

- 正常胡牌14张牌（13张手牌+1张听牌）
- 开杠比正常胡牌多一张，每个杠多一张（杠=4张相同的牌）

---

## 2. 开发规范（核心约束）

### 代码组织与模块化规范

#### 单文件行数控制

> **核心原则**：`script` 部分行数才是关键指标，template 行数多不一定代表复杂

| 文件类型        | `<script>` 上限 | 整体参考 |
| --------------- | --------------- | -------- |
| 页面组件 .vue   | 200行           | 600行    |
| 业务组件 .vue   | 150行           | 400行    |
| 公共组件 .vue   | 100行           | 200行    |
| Store .ts       | 300行           | 500行    |
| Composables .ts | 150行           | 200行    |

**触发拆分条件**（满足任一即触发）：

- `<script>` 部分超过上述上限
- 存在 2 处以上相同/相似逻辑
- 组件承担超过 2 个独立职责
- 某个函数/逻辑可被其他模块复用

#### 目录结构规范

```
src/
├── components/                   # 公共UI组件
│   ├── MahjongTile.vue          # 原子组件（仅渲染）
│   ├── TileSelector.vue         # 业务组件
│   ├── HandDisplay.vue          # 业务组件
│   └── MasteryStars.vue         # 业务组件
│
├── composables/                 # 全局可复用逻辑
│   ├── useLongPress.ts          # 长按交互
│   ├── useDragDrop.ts           # 拖拽逻辑
│   ├── useHandAnalysis.ts       # 手牌分析逻辑
│   ├── useYakuFilter.ts         # 役种筛选逻辑
│   └── useClickOutside.ts       # 点击外部关闭
│
├── stores/                      # 状态管理
├── utils/                       # 纯函数工具
├── views/                       # 页面视图
│   ├── HomeView.vue             # 简单页面保持单文件
│   ├── HandView/                # 复杂页面按目录组织
│   │   ├── index.vue            # 主入口，负责组装
│   │   ├── components/          # 页面私有组件
│   │   ├── composables/         # 页面私有逻辑
│   │   └── types.ts
│   └── YakuView/
│       ├── index.vue
│       ├── components/
│       └── composables/
└── DraftView/                   # 草稿区
```

### Composables 设计规范

#### 命名规范

- 前缀：`use` + 语义化名称
- 示例：`useHandAnalysis`, `useLongPress`

#### 职责单一原则

```
✅ useLongPress.ts      # 仅处理长按逻辑
✅ useDragDrop.ts       # 仅处理拖拽逻辑
❌ useHandLogic.ts      # 混杂多种逻辑
```

#### 抽离时机

| 场景               | 决策         |
| ------------------ | ------------ |
| 逻辑被 2+ 组件复用 | **必须抽离** |
| 逻辑超过 30 行     | 考虑抽离     |
| 涉及复杂状态/计算  | 考虑抽离     |
| 仅为当前组件服务   | 不抽离       |

#### 输出规范

```typescript
// ✅ 正确：清晰的输入/输出
export function useLongPress(callback: () => void, options?: { delay?: number }) {
  const isPressing = ref(false)
  return { start, stop, isPressing }
}

// ❌ 错误：隐式依赖不明确
export function useHandLogic() {
  const store = useHandStore() // 隐式依赖
}
```

### 组件拆分规范

#### 拆分原则

| 原则     | 说明                       |
| -------- | -------------------------- |
| 职责单一 | 一个组件只做一件事         |
| 高内聚   | 相关逻辑放一起             |
| 低耦合   | 组件间通过 props/emit 通信 |
| 可复用   | 公共逻辑抽到 components/   |

#### 页面组件拆分模板

```vue
<!-- views/HandView/index.vue -->
<template>
  <div class="hand-view">
    <HandBoard :tiles="tiles" @select="handleSelect" />
    <RiverPanel :river="river" />
    <DrawTile :tile="drawTile" />
    <ActionPanel :actions="actions" @action="handleAction" />
  </div>
</template>

<script setup lang="ts">
import HandBoard from './components/HandBoard.vue'
import RiverPanel from './components/RiverPanel.vue'
import DrawTile from './components/DrawTile.vue'
import ActionPanel from './components/ActionPanel.vue'
import { useHandView } from './composables/useHandView'

const { tiles, river, drawTile, actions, handleSelect, handleAction } = useHandView()
</script>
```

#### 组件引用层级

```
index.vue (入口)
  └── components/ (子组件)
        └── components/ (孙子组件，尽量避免)
```

### 类型定义管理

| 位置                     | 用途         |
| ------------------------ | ------------ |
| `src/types/`             | 全局共享类型 |
| `src/views/XXX/types.ts` | 页面私有类型 |
| 同文件 `interface`       | 仅该组件使用 |

#### 抽离时机

- 2+ 文件使用同一类型
- 类型定义超过 20 行

### 规范执行检查表

| 检查项                      | 约束级别 |
| --------------------------- | -------- |
| `<script>` 行数上限         | 强制     |
| Composables 命名规范        | 强制     |
| 职责单一                    | 强制     |
| views/ 按目录组织（>300行） | 建议     |
| 公共逻辑抽离（复用2次+）    | 建议     |

### 重构优先级

| 优先级 | 模块                   | 原因               | 预期收益      |
| ------ | ---------------------- | ------------------ | ------------- |
| P0     | HandView (1752行)      | 最大文件，收益最高 | 拆为5+组件    |
| P1     | stores/hand.ts (788行) | 混杂状态与分析逻辑 | 抽离分析逻辑  |
| P2     | YakuView (811行)       | 列表渲染逻辑复杂   | 抽离筛选逻辑  |
| P3     | 新增 composables/      | 建立复用层         | 4+ 可复用逻辑 |

---

## 3. 开发策略

- **小步快跑**：分模块实现，每个功能打磨完成后独立验证
- **先设计后实现**：AI 思考清楚方案后，先提交用户确认
- **方案需包含预期效果**：让用户明确知道完成后能达到什么效果
- **草稿区开发**：新需求默认先在草稿区实现
  - 验证新功能时，直接覆盖现有草稿区内容（覆盖前主动找用户确认）
  - 旧内容做好备份（如 `DraftView_backup_日期.vue`）

### Git 管理规范

- 每次独立特性完成后**必须提交到本地**
- 提交信息清晰描述完成内容
- 如需大改动，先从主分支拉取备份分支

### 验证标准

每个模块完成后需满足：

1. 功能可独立运行验证
2. 测试用例通过
3. 代码符合项目规范
4. 构建通过（npm run build）

---

## 4. 工作流程（强制）

### 需求与缺陷处理流程

> **核心规则**：每次需求/缺陷都必须经过"分析→计划→固化→确认"才能进入编码

#### 触发条件

当用户提出以下表述时，**自动触发**本流程：

- "新增..."、"添加..."、"实现..."、"做一个..."
- "修复..."、"解决..."、"排查..."、"修bug"
- "优化..."、"改进..."、"重构..."

> **通用问答**（如"这个代码什么意思"）不触发

#### 处理流程

```
用户提出需求/缺陷
    ↓
[自动] 分析阶段（理解需求、分析现状）
    ↓
[自动] 计划阶段（拆解任务、分工）
    ↓
[自动] 持久化（更新 TODO.md + CURRENT.md）
    ↓
[等待] 用户确认任务计划
    ↓
执行阶段（按计划执行 + 实时更新状态）
    ↓
验证阶段（测试 + 构建）
    ↓
提交阶段（git commit）
```

#### 改动级别定级

| 级别   | 涉及环节 | 流程                           |
| ------ | -------- | ------------------------------ |
| 微调   | 1环节    | coder → tester                 |
| 小改动 | 2环节    | coder → code-reviewer → tester |
| 中改动 | 3环节    | 完整流程（含技术方案/UI设计）  |
| 大需求 | 4环节    | 完整流程 + 需求规格化          |

#### 改动级别标准

| 判断维度 | 标准                                     |
| -------- | ---------------------------------------- |
| 改动范围 | 单文件=微调，2-3文件=小，4-10=中，10+=大 |
| 改动类型 | 逻辑修改至少小改动，新增功能至少中改动   |
| 影响范围 | 单模块+1级，多模块+2级                   |

### 状态持久化

#### 保存目录结构

```
project/
├── .opencode/session/
│   ├── CURRENT.md      # 当前工作状态
│   └── HISTORY.md     # 历史记录
├── TODO.md             # 项目任务清单
```

#### 触发时机

| 时机         | 保存内容                           |
| ------------ | ---------------------------------- |
| 新需求接收   | 更新 TODO.md + CURRENT.md          |
| 每个任务完成 | 更新 TODO.md 状态为 ✅ done        |
| 窗口启动     | 读取 CURRENT.md + TODO.md 恢复状态 |

> ⚠️ **启动恢复机制（强制自动）**：新窗口启动时，必须自动读取 CURRENT.md 和 TODO.md 恢复状态

### 用户确认节点

| 阶段       | 确认内容         | 方式               |
| ---------- | ---------------- | ------------------ |
| 任务计划   | TODO.md 任务清单 | 必须确认后才执行   |
| 需求规格化 | SPEC.md          | 大需求必须确认     |
| 技术方案   | 技术选型、架构   | 大需求必须确认     |
| UI设计     | 设计稿、原型     | 需要 UI 时必须确认 |
| 功能验收   | 测试结果         | 每个模块完成后确认 |

### 项目交付执行流程

#### 执行阶段

- 按 TODO.md 中改动级别顺序执行
- 每完成一个任务立即更新 TODO.md 状态为 ✅ done
- 使用子 Agent 协同（根据任务类型）
- 遇到阻塞时记录到 CURRENT.md

#### 验证阶段

- 运行测试 `npm run test:run`
- 运行构建 `npm run build`
- 验证功能正常

#### 提交阶段

- 分批提交到本地仓库
- 提交信息清晰描述完成内容
- 更新 CURRENT.md 当前状态

---

## 5. 辅助机制

### POC 验证机制

POC 是**辅助验证工具**，用于正式交付前验证理解或技术方案，**不是项目交付的一部分**。

#### 触发场景

- 需求不清晰：用户描述模糊，需要先验证理解
- 技术验证：不确定技术方案是否可行
- 界面验证：不确定界面是否符合预期
- 改动风险高：担心影响已有代码

#### 工作流程

```
判断需要 POC → 创建 .poc/scenario-N/ → 调用子 agent 出方案
    ↓
展示方案供选择 → 用户确认 → 验证（技术/界面/功能）
    ↓
符合预期 → 合并到项目 → 转正式交付
         ↓
      不符合 → 放弃 → 删除 .poc/
```

---

## 6. 附录

### 子 Agent 分工参考

| 任务类型 | 负责 Agent           |
| -------- | -------------------- |
| 代码实现 | coder                |
| 测试用例 | tester               |
| 代码审查 | code-reviewer        |
| 构建验证 | project-builder      |
| 文档编写 | docs-writer          |
| 任务管理 | task-tracker         |
| 需求管理 | requirements-manager |
| 技术方案 | architect            |
| 界面设计 | ui-designer          |

### TODO.md 模板

```markdown
# 项目任务清单

> 当前迭代：[功能名]
> 更新日期：YYYY-MM-DD

---

## 任务清单

| 状态       | 任务  | 改动级别 | 负责Agent |
| ---------- | ----- | -------- | --------- |
| ⏳ pending | 任务1 | 微调     | coder     |
| ✅ done    | 任务2 | 小改动   | tester    |

---

## 进度

- [x] X/Y 完成 (Z%)
```

### CURRENT.md 模板

```markdown
# 当前会话状态

> 更新日期：YYYY-MM-DD HH:mm

## 当前任务

- 任务名称：xxx
- 当前阶段：执行中 / 已完成
- 阻塞事项：无 / xxx

## 进度

- 任务1：✅ done
- 任务2：⏳ pending

## 上次工作内容

...

## 待确认事项

- [ ] 用户确认任务计划
```

---

> 提示：役种调试方法见 `docs/yaku-guide.md`
