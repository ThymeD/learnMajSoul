# 协作计划

## 项目信息

- 项目：雀魂麻将游戏攻略
- 启动时间：2026-03-18

---

## 需求进度（引用SPEC.md）

| 需求编号 | 需求描述     | 状态         | 负责人 |
| -------- | ------------ | ------------ | ------ |
| #001     | 手牌分析功能 | UI测试已通过 | -      |

---

## 最新任务（用户可直接复制给agent）

### 当前进行中

> 复制以下内容给当前agent：

**Committer**

- 分支：feature/hand-view
- 任务：代码审核 + 合入 develop
- 关联需求：hand-view-requirements.md #001
- 产出目录：src/
- 上一阶段产出位置：tests/ui/hand-view-test-report.md

### 待执行任务

> 以下任务等待执行，按顺序启动：

1. **Automation Tester** - 自动化测试（关联需求：#001，UI测试通过后执行）

---

## 进度追踪（完整记录）

### 已完成

> 格式：完成时间: YYYY-MM-DD HH:MM:SS → agent: 任务 → 关联需求: #xxx → 产出: 目录/文件

- 2026-03-18 14:30:00 → Requirements Manager: 需求审核与修正 → #001 → requirements/hand-view-requirements.md
- 2026-03-18 15:00:00 → Architect: 技术方案设计 → #001 → docs/architecture.md
- 2026-03-18 16:45:00 → Coder: 实现手牌分析功能 → #001 → 分支: feature/hand-view → 产出: src/
- 2026-03-18 18:20:00 → UI Tester: UI测试（发现5个Bug） → #001 → tests/ui/hand-view-test-report.md
- 2026-03-18 19:10:00 → Coder: Bug修复 → #001 → 分支: feature/hand-view → 产出: src/
- 2026-03-18 19:45:00 → UI Tester: UI测试复测通过 → #001 → tests/ui/hand-view-test-report.md
- 2026-03-18 23:19:40 → Committer: 代码审核（发现5个问题需修复） → #001 → 分支: feature/hand-view
- 2026-03-18 23:45:00 → Coder: 修复代码审核问题 → #001 → 分支: feature/hand-view → 产出: src/

### 进行中

> 格式：agent: 任务 → 关联需求: #xxx → 分支: xxx → 产出: 目录/文件

- Committer: 代码审核（等待复审） → #001 → 分支: feature/hand-view → 产出: src/

---

## 产出约定

| 任务            | 产出目录      |
| --------------- | ------------- |
| requirements    | requirements/ |
| architecture    | docs/         |
| ui-design       | design/       |
| code            | src/          |
| automation-test | tests/        |
| ui-test         | tests/ui/     |
| 其他文档        | docs/         |

## 归档目录

| 目录                      | 用途            |
| ------------------------- | --------------- |
| evaluation/daily/         | 日常评价        |
| evaluation/self-summary/  | 各agent绩效总结 |
| evaluation/stage/         | 阶段考评        |
| evaluation/cycle/         | 周期复盘        |
| evaluation/personal/      | 个人考核        |
| evaluation/retrospective/ | 复盘报告        |
| evaluation/team/          | 团队变动        |

## 考评记录（PM填写）

> 在功能模块合入release时填写

| agent | 任务 | 关联需求 | 分支 | 评分 | 详细表现与不足 |
| ----- | ---- | -------- | ---- | ---- | -------------- |
