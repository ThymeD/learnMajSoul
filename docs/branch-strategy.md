# 分支管理策略（Cursor 时代）

## 目标
在保证稳定发布的前提下，提高需求迭代速度与变更可追溯性。

## 分支角色

- **`develop`**：**开发态**集成主干。日常开发成果 **合入或推送到 `develop`**；也可以 **直接基于 `develop` 推送** 进行中的代码（不强制每人每次都拉特性分支）。
- **`release`**：**特性开发完成后** 再合入的分支（交付/归档语义上的「完成线」）；需要验收或冻结时再与 `develop` 对齐。
- **`main` / `master`**：**不常用**（例如历史默认分支或远端占位）；日常协作以 **`develop` / `release`** 为准。

## 开发流程（灵活）

具体开发活动可以：

1. **从 `develop` 拉短生命周期分支**（推荐稍大改动）：开发、测试与文档同步后 **合并回 `develop`**（建议 `--no-ff`，保留任务轨迹）；或  
2. **不拉分支，直接在 `develop` 上提交/推送**（小步迭代、单人或低风险改动）。

特性 **完成后**，再按团队约定合入 **`release`**（并可打标签）。**不要**在多个长期分支上各自发展同一套功能却长期不合并，以免后期难以合入。

## 分支命名
推荐：`<type>/<short-topic>`

示例：
- `feature/hand-furu-auto-resolve`
- `bugfix/hand-redfive-count`
- `docs/cursor-workflow-rules`
- `refactor/hand-dnd-logic`
- `test/drag-drop-regression`

## 提交与合并要求
- 提交信息要描述“为什么改”，不只写“改了什么”。
- 需求实现必须同步更新：
  - `requirements/INDEX.md`
  - 对应需求文档（如 `requirements/hand-view-requirements.md`）
  - `collaboration.md`（缺陷/任务状态）
- 合并前至少执行：
  - `npm run test:run`
  - 必要时 `npx vue-tsc -b --noEmit`

## 冲突与回滚
- 若需求冲突：先在 `collaboration.md` 记录冲突分析，待用户确认后再继续。
- 若线上回滚：优先以 `release` 标签或提交点回滚，禁止在 `develop` 直接硬改历史。

