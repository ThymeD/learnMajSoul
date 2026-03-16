# 雀魂麻将游戏攻略 - 项目全局规则

## 项目概述

本项目旨在实现雀魂麻将游戏攻略系统，采用模块化开发，每个功能可独立验证，最终整合为完整系统。

## 开发策略

- **小步快跑**：分模块实现，每个功能打磨完成后独立验证
- **先设计后实现**：AI 思考清楚方案后，先提交用户确认
- **方案需包含预期效果**：让用户明确知道完成后能达到什么效果
- **草稿区开发**：未指定在已有模块优化的新需求，默认先在草稿区实现，验证通过后迁移到对应功能页面，草稿区代码需与已有功能隔离
  - 验证新功能时，直接覆盖现有草稿区内容（覆盖前主动找用户确认）
  - 旧内容做好备份和命名（如 `DraftView_backup_日期.vue`）

## Git 管理规范

- 每次独立特性完成后**必须提交到本地**
- 提交信息清晰描述完成内容
- 如需大改动，先从主分支拉取备份分支

## 技术规范

- **UI 组件库**：优先使用 Element Plus，组件缺失时使用自定义组件但保持风格一致
- **文档参考**：遇到 AI 训练语料可能过时时，以官网 https://element-plus.org/zh-CN/ 为准
- **TypeScript**：全项目使用 TypeScript，严格类型检查

## 验证标准

每个模块完成后需满足：
1. 功能可独立运行验证
2. 测试用例通过
3. 代码符合项目规范
4. 构建通过（npm run build）

## 麻将规则

- 正常胡牌14张牌（13张手牌+1张听牌）
- 开杠比正常胡牌多一张，每个杠多一张（杠=4张相同的牌）
- 听牌位置应在牌组左边有空隙，便于区分

---

## AI 工作流规则

### 敏感度分级

| 级别 | 示例 | 流程 |
|------|------|------|
| P0-微调 | 改颜色、错别字、1行代码 | coder → tester |
| P1-小改动 | 小bug修复、组件调整 | coder → code-reviewer → tester |
| P2-中改动 | 新增小功能 | 完整流程（跳过 docs） |
| P3-大需求 | 新页面、新功能 | 完整流程 |

### 阶段性触发

- **编码中**：coder 正在写代码 → 不触发任何 agent
- **功能完成**：coder 完成一个功能模块 → 立即触发 tester 测试 → 用户确认
- **编码完成**：所有功能测试通过 → 触发 code-reviewer → project-builder → 集成测试
- **构建完成**：构建成功 → 触发 tester
- **测试完成**：测试通过 → 触发 docs-writer → task-tracker

### 子 Agent 列表

| Agent | 职责 | 触发条件 |
|-------|------|----------|
| requirements-manager | 需求管理、变更评估 | 大需求（P2/P3） |
| architect | 技术方案、架构设计 | 大需求（P2/P3） |
| ui-designer | 界面设计、HTML原型 | 需要 UI 的需求 |
| coder | 代码实现 | 所有需求 |
| code-reviewer | 代码审查 | P1 及以上 |
| project-builder | 构建验证 | P1 及以上 |
| tester | 测试框架、测试用例、测试执行 | 所有需求 |
| docs-writer | 文档编写 | 大需求完成后（P2/P3） |
| task-tracker | 任务跟踪 | 可选 |
| poc-agent | POC验证、独立环境验证 | 用户或主agent判断需要时 |

### 工作流流程

#### P0-微调
```
用户需求 → coder → tester → 完成
```

#### P1-小改动
```
用户需求 → coder → code-reviewer → project-builder → tester → 完成
```

#### P2-中改动
```
用户需求 → requirements-manager → architect → coder → code-reviewer → project-builder → tester → 完成
```

#### P3-大需求
```
用户需求 → requirements-manager → architect → ui-designer → coder → code-reviewer → project-builder → tester → docs-writer → task-tracker → 完成
```

## POC 机制

### 触发场景

| 场景 | 说明 | 调用 agent |
|------|------|-----------|
| 需求不清晰 | 用户描述模糊，先验证理解 | requirements + architect + ui-designer |
| 技术验证 | 不确定技术方案是否可行 | architect + coder |
| 界面验证 | 不确定界面是否符合预期 | ui-designer |
| 改动风险高 | 大量改动已有代码 | 相关阶段 agent |
| 实现不符合预期 | 多次沟通仍不符合 | 相关阶段 agent |

### POC 目录结构

```
project/
├── .poc/                    # POC 独立目录
│   ├── scenario-1/         # 场景1
│   │   ├── SPEC.md        # POC 方案描述
│   │   ├── demo/          # 演示代码
│   │   └── README.md      # 说明
│   └── scenario-2/        # 场景2
├── .opencode/              # 项目交付
├── src/                    # 项目代码
└── ...
```

### POC 工作流程

```
用户/主 agent 判断需要 POC
    ↓
poc-agent 创建 .poc/scenario-N/
    ↓
调用相关 agent 出方案
    ↓
展示方案供用户选择
    ↓
用户确认方案
    ↓
验证（技术/界面/功能）
    ↓
用户确认符合预期 → 合并到项目
            或
         放弃 → 删除 .poc/
```

### POC vs 项目交付

| 维度 | POC | 项目交付 |
|------|-----|----------|
| 目录 | `.poc/` | `.opencode/` + 正式目录 |
| 代码 | 独立，不影响项目 | 合并到正式代码 |
| 状态 | 临时，可放弃 | 持久化 |
| 目的 | 验证理解 | 正式交付 |

## 用户确认节点

大需求（P2/P3）必须等待用户确认后才能进入下一阶段：

| 阶段 | 确认内容 | 确认方式 |
|------|----------|----------|
| 需求规格化 | SPEC.md 需求清单 | 用户明确确认 |
| 技术方案 | 技术选型、架构设计 | 用户明确确认 |
| UI设计 | 设计稿、原型 | 用户明确确认 |
| 功能验收 | 功能测试结果 | 用户明确确认 |

确认方式：AI 输出确认提示，用户回复"确认"或提出修改意见。

---

## 状态持久化

### 保存目录结构

```
project/
├── .opencode/               # opencode 工作目录
│   └── session/
│       ├── CURRENT.md      # 当前工作状态
│       └── HISTORY.md      # 历史记录
```

### 保存内容（CURRENT.md）

```markdown
# 当前会话状态

## 最后活跃时间
2024-01-15 10:30:00

## 当前阶段
coder（编码中）

## 已完成阶段
- requirements-manager: 完成
- architect: 完成
- ui-designer: 完成

## 待办
- [ ] coder 完成当前功能
- [ ] code-reviewer 代码审查

## 关键文件
- src/pages/login.tsx

## 最后用户指令
"给登录页加一个验证码"
```

### 触发时机

| 时机 | 保存内容 |
|------|----------|
| 每个 agent 完成 | 当前阶段、已完成、待办 |
| 用户明确新需求 | 更新当前需求 |
| 每 10 轮对话 | 强制保存 |

### 恢复机制

```
新窗口启动
    ↓
检测 .opencode/session/CURRENT.md
    ↓
有内容 → 展示摘要 → 询问"是否继续当前工作"
    ↓
用户确认 → 读取上下文继续工作
```

### 原则

- 少量对话丢失可接受
- 每个阶段完成后自动保存
- 改动都在代码文件里（git 可追溯）
- 新窗口可以读取 CURRENT.md 恢复上下文

---

## 项目交付任务执行流程

### 概述
每个项目交付任务（如新增功能、优化、修复等）都应遵循以下流程，确保任务可追溯、可协作、可恢复。

---

### 1. 分析阶段

**目标**：充分了解现状和需求

**操作**：
- 分析现有代码结构
- 了解相关模块的依赖关系
- 识别需要测试的功能点
- 评估工作量

**产出**：现状分析报告

---

### 2. 计划阶段

**目标**：制定详细可执行的任务计划

**操作**：
- 列出具体任务清单
- 标注每个任务的优先级（P0/P1/P2）
- 分配负责的子 Agent
- 预估工作量

**产出**：TODO.md 任务清单

---

### 3. 持久化阶段

**目标**：将计划固化到项目本地

**操作**：
- 更新 TODO.md，添加详细任务清单
- 标注每个任务状态为 pending
- 更新 CURRENT.md 当前会话状态

**文件位置**：
- `TODO.md` - 项目根目录
- `.opencode/session/CURRENT.md` - 会话状态

---

### 4. 执行阶段

**目标**：按计划逐项完成任务

**操作**：
- 按优先级顺序执行
- 每完成一项更新 TODO.md 状态
- 使用子 Agent 协同（根据任务类型）

**子 Agent 分工参考**：
| 任务类型 | 负责 Agent |
|---------|-----------|
| 代码实现 | coder |
| 测试用例 | tester |
| 代码审查 | code-reviewer |
| 构建验证 | project-builder |
| 文档编写 | docs-writer |
| 任务管理 | task-tracker |

---

### 5. 验证阶段

**目标**：确保任务正确完成

**操作**：
- 运行测试 `npm run test:run`
- 运行构建 `npm run build`
- 验证功能正常

**验收标准**：
- 测试全部通过
- 构建成功
- 功能符合预期

---

### 6. 提交阶段

**目标**：保存工作进度

**操作**：
- 分批提交到本地仓库
- 提交信息清晰描述完成内容
- 更新 CURRENT.md

---

### 7. 恢复机制

**目标**：窗口关闭后可继续工作

**新窗口启动时**：
1. 读取 CURRENT.md 了解当前状态
2. 读取 TODO.md 了解待办任务
3. 询问用户是否继续

---

### 流程图

```
分析现状
    ↓
制定计划 + 子Agent分工
    ↓
持久化到 TODO.md
    ↓
执行任务（按优先级）
    ↓
验证（测试+构建）
    ↓
提交到本地仓库
    ↓
更新 CURRENT.md
```

---

### TODO.md 模板

```markdown
# 项目任务清单

> 当前迭代：[功能名]
> 更新日期：YYYY-MM-DD

---

## 任务清单

| 状态 | 任务 | 优先级 | 负责Agent |
|------|------|--------|----------|
| ⏳ pending | 任务1 | P0 | coder |
| ✅ done | 任务2 | P1 | tester |

---

## 进度

- [x] X/Y 完成 (Z%)
```

---

## 全局工具方法

### 浏览器控制台调试方法

项目在全局暴露了 `yakuUtils` 对象，可在浏览器控制台直接调用：

```js
// 设置某个牌型已胡次数
yakuUtils.setYakuMastery('reach', 5)  // id 为牌型唯一标识

// 清理所有已胡次数缓存
yakuUtils.clearAllMastery()
```

可用牌型 id：reach, tanyao, tsumo, yakuhai-jikaze, yakuhai-bakaze, yakuhai-sangen, pinfu, ipeikou, haitei, houtei, ippatsu, rinshan, double-reach, sanshoku-douko, sandangatsu, toitoi, sanankei, shousangen, honroutou, chitoitsu, honchantaiyaochuu, ikkititsuan, sanshoku-doushun, ryanpeikou, junhonchantaiyaochuu, hunyisoku, chinitsu, nagashimangan, tenhou, chihou, daisangen, suuankou, tsuuiisou, ryuuiisou, chinroutou, kokushimusou, shousuushii, suukantsu, chuurenpuutou, suuankoutanki, kokushimusoujuusanmen, chuurenpuutoujyun, daisuushii, sufonrenda, suukansan, kyushokujun, sikazero

### splitAt 自动计算

在 `src/data/yaku.ts` 中提供了 `autoCalculateSplitAt` 函数，可自动计算牌型的分割位置：

```ts
import { autoCalculateSplitAt } from './data/yaku'

// 示例
const tiles = ['w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's5', 's6', 's7', 'd1', 'd1', 'd1', 'd2', 'd2']
const splitAt = autoCalculateSplitAt(tiles)
// 返回 [2, 5, 8, 11, 12, 13]
```

算法规则：
- 刻子/杠结束后分隔
- 顺子结束后分隔（如果后面接雀头或听牌）
- 单独一张的牌（作为雀头）左右都分隔
- 听牌左边分隔
- 特殊牌型：国士无双（全部幺九牌）、九莲宝灯（万字1112345678999）、三杠及以上只显示听牌间隔

### 番数分类

- han: 1-3：一番到三番
- han: 5：满贯
- han: 6：六番
- han: 8：役满
- han: -2：双倍役满
- han: -3：流局
