# 协作计划

## 项目信息

- 项目：雀魂麻将游戏攻略
- 启动时间：2026-03-18
- 开发服务器地址：http://localhost:5173
- 启动命令：npm run dev

---

## 本周执行入口（3行）

1. 先看“最新任务”中的“当前进行中”和“待办事项”，确认本次要做的条目。
2. 实现前后同步更新：`requirements/INDEX.md` + 对应需求文档 + 本文状态。
3. 完成后补“验证证据/回归结论”，未验证不标记关闭。

---

## 需求进度（引用SPEC.md）

| 需求编号 | 需求描述     | 状态                                   | 负责人 |
| -------- | ------------ | -------------------------------------- | ------ |
| #001     | 手牌分析功能 | 已合入并完成11项生产问题修复，当前维护中 | -      |

---

## 最新任务（用户可直接复制给agent）

### 当前进行中（建议）

- `RF-003` 拆分 `src/stores/hand.ts` 纯逻辑到 domain utils（P1）
- `RF-004` 拆分 `requirements/hand-view-requirements.md` 文档结构（P1）
- 新需求分支准备：从当前收尾版本切 `feature/*` 后开始特性开发

> 说明：以上为建议优先队列；正式开工后请同步到下方任务池状态与进度追踪。

#### RF-001 执行拆分（可直接分配）

| 子任务 | 内容 | 产出 | 验收标准 |
| --- | --- | --- | --- |
| RF-001-A | 从 `src/views/HandView/index.vue` 提取状态与计算逻辑到 composable（如 `useHandViewState`） | `src/views/HandView/composables/` | `index.vue` 行数明显下降；页面行为无回归 |
| RF-001-B | 抽离交互动作（摸牌/副露/拖拽）到 composable（如 `useHandActions`） | `src/views/HandView/composables/` | 关键交互可用；方法命名与参数语义清晰 |
| RF-001-C | 将视图片区块拆为展示组件（手牌区/牌河区/副露区） | `src/views/HandView/components/` | 组件职责单一；父子 props/emits 类型完整 |
| RF-001-D | 回归测试与文档同步（需求索引/协作记录） | `tests/`、`requirements/INDEX.md`、`collaboration.md` | `npm run test:run` 通过；状态更新完整 |

#### RF-002 执行拆分（可直接分配）

| 子任务 | 内容 | 产出 | 验收标准 |
| --- | --- | --- | --- |
| RF-002-A | 梳理 `src/utils/yaku-match.ts` 现有对外导出 API，冻结函数签名与返回结构 | `src/utils/yaku-match.ts`、`docs/`（可选记录） | 对外调用点无需改动；签名变更为 0 |
| RF-002-B | 按役种簇拆分匹配逻辑模块（如顺子类/刻子类/特殊役），抽到 `src/utils/yaku/` 子模块 | `src/utils/yaku/` | 模块边界清晰；单文件复杂度下降 |
| RF-002-C | 在入口文件重组聚合导出，保持旧入口兼容 | `src/utils/yaku-match.ts` | 业务侧 import 路径不变；类型检查通过 |
| RF-002-D | 补充/更新回归测试，覆盖高频役种与边界组合 | `tests/` | 核心识别结果与重构前一致；`npm run test:run` 通过 |
| RF-002-E | 同步文档状态（索引/协作记录）并记录风险点 | `requirements/INDEX.md`、`collaboration.md` | 状态与备注可追溯；后续迭代有明确 follow-up |

#### TEST-001 执行拆分（可直接分配）

| 子任务 | 内容 | 产出 | 验收标准 |
| --- | --- | --- | --- |
| TEST-001-A | 对齐 `tests/drag-drop.spec.ts` 手动区域选择器到当前 DOM（移除 `.hand-display-area`） | `tests/drag-drop.spec.ts` | 选择器能稳定命中手牌拖拽区 |
| TEST-001-B | 运行拖拽核心回归用例（素材区→手牌区、单次拖拽只增1张） | `tests/drag-drop.spec.ts` | Playwright 用例通过 |
| TEST-001-C | 回填迭代记录与后续未覆盖项 | `collaboration.md` | 当前迭代可追溯 |

### 待办事项（当前迭代）

> 本区可登记缺陷修复、需求实现与结构重构；所有条目完成后都需补验证结论。

#### 🔧 修复进度

| #   | 问题                                    | 状态      | 修复人 | 完成时间   |
| --- | --------------------------------------- | --------- | ------ | ---------- |
| 1   | 素材区拖牌到牌河功能                    | ✅ 已验证 | Coder  | 2026-03-20 |
| 2   | 牌河牌计入总牌数统计                    | ✅ 已合入 | Coder  | 2026-03-19 |
| 3   | 副露吃碰杠按钮功能修正                  | ✅ 已合入 | Coder  | 2026-03-19 |
| 4   | 牌河双击回到素材区                      | ✅ 已合入 | Coder  | 2026-03-19 |
| 5   | 摸牌双击回到素材区                      | ✅ 已修复 | Coder  | 2026-03-20 |
| 6   | 暗杠牌背排列修正（牌背-牌面-牌面-牌背） | ✅ 已合入 | Coder  | 2026-03-19 |
| 7   | 暗杠间距                                | ✅ 已合入 | Coder  | 2026-03-19 |
| 8   | 赤牌数量修正为1张                       | ✅ 已合入 | Coder  | 2026-03-19 |
| 9   | 普通5数量修正为3张                      | ✅ 已合入 | Coder  | 2026-03-19 |
| 10  | 赤牌副露功能                            | ✅ 已修复 | Coder  | 2026-03-20 |
| 11  | 摸牌单击问题                            | ✅ 已修复 | Coder  | 2026-03-20 |

---

## 需求/缺陷固化规则（用于 Cursor 新窗口继续工作）
1. 新需求必须同时更新两处：
   - 在 `collaboration.md` 的“需求清单/待办事项”中登记（含预期产出位置）。
   - 在 `requirements/INDEX.md` 与对应需求文档中新增/更新验收标准与边界条件（实现后再刷新为“已完成/已验证”）。
2. 用户缺陷必须走闭环：
   - 在“缺陷登记模板”填入复现步骤与期望/实际，并标注当前状态。
   - 修复后补全验证证据与修复提交信息；只有在用户确认后才可关闭。

## 需求冲突与方案决策规则
1. 新需求与现有需求冲突时，先输出冲突分析与“变更任务清单”，再向用户二次确认，不得直接改代码。
2. AI 若有更优实践，必须给出至少2个可选方案（复杂度、风险、影响范围、推荐结论），由用户决策后执行。

## 缺陷登记模板（复制填空）
- 缺陷编号：
- 用户登记日期：
- 缺陷描述（期望 vs 实际）：
- 复现步骤：
- 影响范围：
- 根因类型：REQ_CHANGE / REQ_GAP / AI_IMPL / TEST_GAP
- 当前状态：待修复 / 已修复（待验证）/ 已关闭
- 验证证据：
- 修复提交/PR：

## 防重复犯错机制
- 同一模块同一根因类型在两次迭代内重复出现 >=2 次，必须追加防重复动作：
  1) 补充需求验收清单
  2) 增加测试用例或回归步骤
  3) 在实现前检查项中固化约束
- 其中 `REQ_CHANGE` 归类为需求变更，不计入实现缺陷；`AI_IMPL` 归类为实现质量问题，需纳入改进跟踪。

## 需求清单（用于恢复项目真相）
- 统一索引：`requirements/INDEX.md`
- 手牌分析：`requirements/hand-view-requirements.md`
- 役种一览：`requirements/yaku/SPEC.md`

## 重构任务池（仅结构优化，不改功能）
| 编号 | 任务 | 优先级 | 状态 | 备注 |
| --- | --- | --- | --- | --- |
| RF-001 | 拆分 `src/views/HandView/index.vue` 到 composables/components | P0 | 已完成（首轮） | 已抽离 `useFuluActions` + `useHandBoardActions`，入口降复杂 |
| RF-002 | 拆分 `src/utils/yaku-match.ts` 按役种簇模块化 | P0 | 已完成（首轮） | 已拆分 `types` / `special` / `han` 并保持 API 兼容 |
| RF-003 | 拆分 `src/stores/hand.ts` 纯逻辑到 domain utils | P1 | 待开始 | Store 仅保留状态编排 |
| RF-004 | 拆分 `requirements/hand-view-requirements.md` 文档结构 | P1 | 待开始 | 通过 `requirements/INDEX.md` 聚合 |

## 进度追踪（完整记录）

### 已完成

> 格式：YYYY-MM-DD HH:MM:SS（真实时间）→ agent: 任务 → #xxx → 产出

- 2026-03-20 → Coder: 重构收尾（RF-001/RF-002/TEST-001）→ 手牌分析维护 → `src/views/HandView/composables/useHandBoardActions.ts`、`src/utils/yaku/`、`tests/drag-drop.spec.ts`
- 2026-03-20 → Coder: 手牌分析 #5/#10/#11（摸牌单击延迟、赤牌副露 normalizeRedFive、吃牌多手牌移除、明杠牌面）→ src/views/HandView/index.vue
- 2026-03-19 → Committer: 合入问题4、5、6、7、8、9到develop
- 2026-03-18 23:38:00 → Automation Tester: 手牌分析功能自动化测试 → #001 → tests/hand-analysis.test.ts（159个测试用例全部通过）
- 2026-03-18 23:45:00 → UI Tester: UI测试发现9个生产问题 → #001 → tests/ui/hand-view-ui-test-report.md
- 2026-03-18 23:50:00 → PM: 复盘与绩效评价（历史档案已清理）→ #001
- 2026-03-18 23:32:00 → Committer: 代码审核通过，合入 develop → #001 → feature/hand-view → develop
- 2026-03-18 23:25:18 → Coder: 修复代码审核问题 → #001 → src/
- 2026-03-18 23:14:47 → Coder: Bug修复（BUG-001~005） → #001 → src/
- 2026-03-18 23:08:29 → Coder: 实现手牌分析功能 → #001 → src/
- 2026-03-18 22:35:55 → 用户: 优化需求文档 → #001 → requirements/hand-view-requirements.md

---

## 归档记录

### 2026-03-19 生产问题修复迭代

**合入develop的问题**：

- 问题2：牌河计入总牌数
- 问题3：副露吃碰杠按钮开关
- 问题4：牌河双击移除
- 问题6：暗杠排列（牌背-牌面-牌面-牌背）
- 问题7：暗杠间距
- 问题8：赤牌数量1张
- 问题9：普通5数量3张

**待验证 / 后续**：

- Playwright `tests/drag-drop.spec.ts` 中 `.hand-display-area` 与当前 DOM 不一致，需单独更新选择器（非本次业务逻辑）

**已关闭（本迭代补充）**：

- 问题1：素材区拖牌到牌河（dragover 阶段勿用 `getData`，按 `effectAllowed` 设置 `dropEffect`）
- 问题5 / #11：摸牌单击延迟 300ms，双击先取消定时器再移除，避免第一次 click 吃掉摸牌
- 问题10：副露吃/碰/杠/加杠用 `normalizeRedFive` 识别赤5与普5；碰杠写入真实牌 id；吃牌从手牌移除顺子中全部在手牌里的张

**问题5自检结论**：UI Tester测试态度问题，测试报告敷衍，未真正完成测试即报告通过。

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
| requirements/             | 需求设计与索引  |
| docs/                     | 架构与流程文档  |
| tests/                    | 测试与验证产物  |
