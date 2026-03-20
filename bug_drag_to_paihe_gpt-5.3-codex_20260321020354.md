# 手牌分析页“素材区 -> 牌河区”拖拽问题修复报告

## 1. 为什么之前的代码没有实现该需求

根因是拖拽协商参数不兼容：

- 素材区拖拽开始时在 `TileSelector` 中设置了 `event.dataTransfer.effectAllowed = 'copy'`。
- 牌河区 `dragover` 里会根据 `source` 决定 `dropEffect`，理论上素材来源应为 `copy`，其他来源为 `move`。
- 但在部分浏览器/实现下，`dragover` 阶段读取 `dataTransfer.getData('source')` 可能拿不到值（或不稳定），从而落入默认 `move`。
- 当 `effectAllowed='copy'` 而 `dropEffect='move'` 时，浏览器会判定该 drop 非法并拒绝，表现为“素材区拖不进牌河区”。

也就是说，业务逻辑本身写了素材区到牌河区的处理分支，但在更底层的 DnD 协商阶段就被拦截了。

## 2. 我的分析过程

我按“事件链路”排查了关键路径：

1. 检查 `src/components/TileSelector.vue`：确认素材区拖拽会写入 `text/plain` 与 `source=source`，并设置 `effectAllowed`。
2. 检查 `src/views/HandView/index.vue`：
   - `handleRiverDrop` 中已存在 `source === 'source'` 分支，会把牌加入牌河并计入 `consumedFromSource`，业务逻辑是完整的。
   - 牌河容器 `dragover` 会设置 `dropEffect`（copy/move），存在与源端 `effectAllowed` 冲突的可能。
3. 结合 DnD 标准行为判断：如果 `dragover` 拿不到 `source`，目标端容易设置 `move`，与源端仅 `copy` 冲突，导致 drop 失败。
4. 验证层面：
   - 运行 `npm run test:run`，159 个测试全部通过（确保修改未破坏既有逻辑）。
   - 运行 `npm run build` 成功（确保类型与构建通过）。
   - 尝试运行 Playwright 拖拽专项用例时，环境缺少浏览器二进制（需 `npx playwright install`），无法在当前机器完成该 E2E 用例执行。

## 3. 我的修复方案

遵循“最小改动”原则，仅改 1 处：

- 文件：`src/components/TileSelector.vue`
- 变更：
  - 从 `event.dataTransfer.effectAllowed = 'copy'`
  - 调整为 `event.dataTransfer.effectAllowed = 'copyMove'`

这样即使牌河区在 `dragover` 阶段误设为 `move`，仍然属于允许操作，drop 不会被浏览器拒绝；同时素材区正常 `copy` 语义不受影响。

## 4. 我判断该问题已经修复好的依据

依据分为“逻辑依据 + 工程依据”两层：

- 逻辑依据：
  - 之前失败点在 DnD 协商（`copy` vs `move` 不兼容）；
  - 修改后源端允许 `copyMove`，消除协商冲突；
  - 牌河 drop 处理分支本来就完整，因此协商恢复后业务路径可达。

- 工程依据：
  - `npm run test:run` 全量通过（`6 files / 159 tests`）。
  - `npm run build` 通过，说明改动未引入类型或构建问题。
  - ESLint（针对修改相关文件）无新增问题。

补充说明：

- 当前环境未安装 Playwright 浏览器，导致无法直接跑“素材区到牌河拖拽”E2E 用例。若需补齐最终自动化证据，可执行：
  - `npx playwright install`
  - `npx playwright test tests/drag-drop.spec.ts -g "素材区到牌河拖拽"`

