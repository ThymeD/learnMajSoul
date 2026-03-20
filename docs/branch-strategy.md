# 分支管理策略（Cursor 时代）

## 目标
在保证稳定发布的前提下，提高需求迭代速度与变更可追溯性。

## 分支角色
- `develop`：日常集成主干，所有需求/缺陷分支先合入此分支。
- `release`：发布分支（用户验收通过后从 `develop` 合入）。

## 开发流程
1. 从 `develop` 拉取新分支。
2. 在任务分支完成开发、测试与文档同步（需求文档/缺陷状态）。
3. 合并回 `develop`（建议 `--no-ff`，保留任务轨迹）。
4. 用户验收通过后再合入 `release` 并打标签。

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

