# 雀魂麻将游戏攻略系统 - 项目优化计划

> 创建日期：2026-03-16
> 版本：v2.3
> 更新日期：2026-03-16
> 首要约束：**不能破坏现有役种一览功能**

---

## 一、优化目标概述

本次优化旨在提升代码质量、完善工具链、清理冗余文件，并为后续新功能开发建立标准化流程。优化范围涵盖问题定位、代码修复、工具链建设、测试修复、代码清理、文档整合等多个维度。

**核心原则**：先定位后修复 - 由 code-reviewer 先定位具体问题位置，再由对应 agent 修复。

---

## 二、问题清单汇总

### 2.1 代码质量问题（来自代码审查）

| # | 问题 | 位置 | 优先级 | 定位状态 |
|---|------|------|--------|----------|
| 1 | 数据配置重复ID：`sufonrenda`、`suukansan`、`kyushokujun`、`sikazero` 各出现2次 | `src/data/yaku-config.json` | P0 | 已定位 |
| 2 | localStorage 解析缺乏错误处理 | 待定位 | P1 | 待定位 |
| 3 | autoCalculateSplitAt 函数潜在bug | `src/data/yaku.ts` | P1 | 待定位 |
| 4 | CSS 样式重复定义 | 待定位 | P2 | 待定位 |
| 5 | onMounted 钩子重复定义 | 待定位 | P2 | 待定位 |
| 6 | mastery=0 时不保存问题 | 待定位 | P1 | 待定位 |

### 2.2 工具链缺失

| # | 问题 | 当前状态 | 优先级 |
|---|------|----------|--------|
| 1 | Prettier 未安装 | 仅有 `.prettierrc` 配置文件 | P1 |
| 2 | lint/format 脚本缺失 | `package.json` 无相关脚本 | P1 |
| 3 | 测试失败 | MahjongTile 组件 1个测试失败 | P0 |

### 2.3 代码清理

| # | 文件/目录 | 说明 | 优先级 |
|---|-----------|------|--------|
| 1 | `src/views/draft/` | 8个测试文件需清理 | P2 |
| 2 | `src/views/DraftView_backup_20260314.vue` | 备份文件 | P2 |
| 3 | `src/components/HelloWorld.vue` | 可能未使用 | P2 |

### 2.4 文档问题

| # | 问题 | 说明 | 优先级 |
|---|------|------|--------|
| 1 | 文档分散 | README.md、PROJECT_STATUS.md、docs/ 有内容重叠 | P2 |
| 2 | 缺少开发模板 | 缺少新功能开发标准化模板 | P2 |

---

## 三、分阶段优化计划

### 阶段0：问题定位（新增）

**目标**：由 code-reviewer 定位具体问题位置，为后续修复提供准确信息

#### 任务 0.1：定位 localStorage 使用位置

```
优先级：P1
类型：问题定位
涉及文件：全局搜索
子Agent：code-reviewer

详细说明：
- 搜索项目中所有 localStorage.getItem/localStorage.setItem 调用
- 记录每个使用位置的文件和行号
- 识别需要添加错误处理的具体位置
输出：列出需要修复的具体位置清单
```

#### 任务 0.2：定位 CSS 重复定义位置

```
优先级：P2
类型：问题定位
涉及文件：全局搜索
子Agent：code-reviewer

详细说明：
- 搜索重复的CSS选择器
- 记录重复的样式规则
- 识别可提取为CSS变量的样式
输出：列出CSS重复位置清单
```

#### 任务 0.3：定位 onMounted 重复定义位置

```
优先级：P2
类型：问题定位
涉及文件：Vue组件
子Agent：code-reviewer

详细说明：
- 搜索项目中重复的 onMounted 钩子
- 记录每个组件的 onMounted 使用情况
- 识别可合并的组件
输出：列出需要重构的组件清单
```

#### 任务 0.4：定位 mastery 相关代码位置

```
优先级：P1
类型：问题定位
涉及文件：全局搜索
子Agent：code-reviewer

详细说明：
- 搜索 mastery 相关的代码
- 定位保存逻辑的位置
- 分析为什么 mastery=0 时不保存
输出：定位问题代码的具体位置
```

#### 任务 0.5：审查 autoCalculateSplitAt 函数

```
优先级：P1
类型：问题定位
涉及文件：src/data/yaku.ts
子Agent：code-reviewer

详细说明：
- 审查函数逻辑完整性和边界处理
- 识别潜在的bug场景
- 分析测试用例覆盖情况
输出：问题分析报告
```

---

### 阶段1：测试修复（P0）

**目标**：修复 MahjongTile 测试失败问题

#### 任务 1.1：分析 MahjongTile 测试失败原因

```
优先级：P0
类型：测试分析
涉及文件：src/components/__tests__/MahjongTile.test.ts
子Agent：tester

详细说明：
测试失败详情：
- 测试："renders correct tile name"
- 期望：wrapper.text() 包含 '东风'
- 实际：返回 ''（空字符串）

分析方向：
1. showName prop 是否正确定义和传递
2. 测试环境中 text() 获取文本的方式
3. 组件渲染逻辑问题

输出：测试失败原因分析报告 + 修复建议
```

#### 任务 1.2：根据分析结果修复测试

```
优先级：P0
类型：测试修复
涉及文件：src/components/__tests__/MahjongTile.test.ts 或 MahjongTile.vue
子Agent：coder

前置条件：任务 1.1 完成

详细说明：
根据 tester 的分析结果进行修复：
- 方案A：调整组件prop默认值
- 方案B：修改测试用例验证方式
- 方案C：修复组件渲染逻辑

验证：运行 npm run test:run 确保所有42个测试通过
```

#### 任务 1.3：验证构建

```
优先级：P0
类型：构建验证
涉及文件：全局
子Agent：project-builder

详细说明：
- 运行 npm run build 验证构建成功
- 确保测试修复未破坏其他功能
```

---

### 阶段2：工具链完善（P1）

**目标**：补充必要的开发工具和脚本

#### 任务 2.1：安装 Prettier

```
优先级：P1
类型：工具链
涉及文件：package.json
子Agent：project-builder

详细说明：
- 运行 npm install prettier --save-dev
- 验证 .prettierrc 配置生效
- 可选：添加 .prettierignore 文件
```

#### 任务 2.2：添加 lint/format 脚本

```
优先级：P1
类型：工具链
涉及文件：package.json
子Agent：project-builder

详细说明：
在 package.json scripts 中添加：
- "lint": "eslint src --ext .ts,.vue"
- "format": "prettier --write src/"
- "lint:fix": "eslint src --ext .ts,.vue --fix"

验证：
- 运行 npm run lint 确保无错误
- 运行 npm run format 格式化代码
```

---

### 阶段3：代码质量修复（P1）

**目标**：修复6个代码质量问题

#### 任务 3.1：修复重复ID问题（P0）

```
优先级：P0
类型：Bug修复
涉及文件：src/data/yaku-config.json
子Agent：coder → code-reviewer → project-builder → tester

详细说明：
- sufonrenda 出现在 line 376 和 line 549
- suukansan 出现在 line 384 和 line 558
- kyushokujun 出现在 line 392 和 line 567
- sikazero 出现在 line 401 和 line 576

修复方案：
- 确认每个ID的正确数据（比较两处定义，保留更完整的）
- 删除重复项或合并数据
- 验证不影响现有功能

验证：运行测试确保役种一览功能正常
```

#### 任务 3.2：修复 localStorage 错误处理

```
优先级：P1
类型：Bug修复
涉及文件：基于阶段0定位结果
子Agent：coder → tester

前置条件：任务 0.1 完成

详细说明：
- 根据 code-reviewer 定位的位置添加 try-catch
- 处理 JSON.parse 可能的异常
- 确保错误不影响用户使用

验证：运行测试确保本地存储功能正常
```

#### 任务 3.3：修复 autoCalculateSplitAt 函数

```
优先级：P1
类型：Bug修复
涉及文件：src/data/yaku.ts
子Agent：coder → tester

前置条件：任务 0.5 完成

详细说明：
- 根据 code-reviewer 的分析修复潜在bug
- 补充边界情况的测试用例
- 验证修复后函数行为正确

验证：运行相关测试用例
```

#### 任务 3.4：修复 mastery=0 问题

```
优先级：P1
类型：Bug修复
涉及文件：基于阶段0定位结果
子Agent：coder → tester

前置条件：任务 0.4 完成

详细说明：
- 根据定位的问题代码修复保存逻辑
- 确保0值能正确保存到 localStorage

验证：手动测试设置熟练度为0的场景
```

#### 任务 3.5：修复 CSS 重复定义

```
优先级：P2
类型：代码优化
涉及文件：基于阶段0定位结果
子Agent：coder → tester

前置条件：任务 0.2 完成

详细说明：
- 根据定位的重复CSS进行合并
- 使用CSS变量统一管理
- 提取到全局样式文件

验证：检查样式是否正常渲染
```

#### 任务 3.6：修复 onMounted 重复定义

```
优先级：P2
类型：代码优化
涉及文件：基于阶段0定位结果
子Agent：coder → tester

前置条件：任务 0.3 完成

详细说明：
- 根据定位的重复 onMounted 进行合并
- 使用组合式函数提取公共逻辑
- 验证功能不受影响

验证：运行测试确保功能正常
```

---

### 阶段4：代码清理（P2）

**目标**：清理测试文件和备份文件

#### 任务 4.1：清理 draft 目录

```
优先级：P2
类型：代码清理
涉及文件：src/views/draft/
子Agent：coder

清理清单：
- YakuDataTest.vue
- YakuLayoutTest.vue
- IncrementTest.vue
- HuVideoTest.vue
- HuImageTest.vue
- MasteryTest.vue
- ScrollTestView.vue
- TileTestView.vue

注意：
- 先确认这些文件确实不再使用
- 可选择移动到 .poc/ 目录作为备份而非直接删除
```

#### 任务 4.2：清理备份文件

```
优先级：P2
类型：代码清理
涉及文件：
- src/views/DraftView_backup_20260314.vue
- src/components/HelloWorld.vue

操作：
- 确认是否被引用
- 如未使用则删除
```

---

### 阶段5：文档整合（P2）

**目标**：统一文档结构，避免内容重复

#### 任务 5.1：整合文档

```
优先级：P2
类型：文档优化
涉及文件：README.md, PROJECT_STATUS.md, docs/
子Agent：docs-writer

详细说明：
- 分析各文档内容
- 确定各文档定位：
  - README.md：项目简介、快速开始
  - PROJECT_STATUS.md：项目状态、里程碑
  - docs/：详细技术文档
- 移除重复内容
- 保持文档同步更新
```

---

### 阶段6：规范完善（P2）

**目标**：补充任务管理规范和开发模板

#### 任务 6.1：完善 AGENTS.md 任务管理规范

```
优先级：P2
类型：规范优化
涉及文件：AGENTS.md
子Agent：task-tracker

补充内容：
- task-tracker 的使用规范
- TODO.md 的维护方式
- 任务优先级定义
- 任务状态流转规则
```

#### 任务 6.2：创建新功能开发模板

```
优先级：P2
类型：流程规范
涉及文件：requirements/TEMPLATE.md（新文件）
子Agent：architect

模板内容应包含：
1. 需求文档模板（requirements/功能名/SPEC.md）
2. 架构设计模板（requirements/功能名/ARCHITECTURE.md）
3. 开发检查清单
4. 测试用例模板
5. 文档编写要求
```

---

## 四、执行顺序建议

```
第零阶段（问题定位）：
├── 任务 0.1：定位 localStorage 使用位置
├── 任务 0.2：定位 CSS 重复定义位置
├── 任务 0.3：定位 onMounted 重复定义位置
├── 任务 0.4：定位 mastery 相关代码位置
└── 任务 0.5：审查 autoCalculateSplitAt 函数

第一优先级（立即执行）：
├── 任务 1.1：分析 MahjongTile 测试失败原因
├── 任务 1.2：修复测试
├── 任务 1.3：验证构建
└── 任务 3.1：修复重复ID（P0）

第二优先级（紧接着）：
├── 任务 2.1：安装 Prettier
├── 任务 2.2：添加 lint/format 脚本
├── 任务 3.2：修复 localStorage 错误处理
├── 任务 3.3：修复 autoCalculateSplitAt
└── 任务 3.4：修复 mastery=0 问题

第三优先级（可并行）：
├── 任务 3.5：修复 CSS 重复定义
├── 任务 3.6：修复 onMounted 重复定义
├── 任务 4.1：清理 draft 目录
├── 任务 4.2：清理备份文件
└── 任务 5.1：整合文档

第四优先级（最后处理）：
├── 任务 6.1：完善 AGENTS.md
└── 任务 6.2：创建新功能开发模板
```

---

## 五、验收标准

每个任务完成后需满足：

| 任务类型 | 验收标准 |
|----------|----------|
| 问题定位 | 输出定位清单，包含具体文件和行号 |
| Bug修复 | 原有测试通过 + 修复的问题不再重现 |
| 测试修复 | 所有测试通过（npm run test:run） |
| 工具链 | 脚本可正常运行 |
| 代码清理 | 不影响现有功能 |
| 文档 | 内容准确、无遗漏 |

**整体验收**：
- 所有测试通过（npm run test:run）
- 构建成功（npm run build）
- 役种一览功能正常运作

---

## 六、风险管理

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 修复过程中破坏现有功能 | 高 | 每个修复后立即运行测试验证 |
| 测试修复引入新问题 | 中 | 仔细分析失败原因，必要时回滚 |
| 清理文件被其他功能引用 | 中 | 删除前先搜索引用确认安全 |

---

## 七、后续规划

优化完成后，可继续开发以下新功能：

1. **手牌分析功能** - 分析用户手牌，提示可能的役种
2. **策略指南功能** - 提供麻将策略和技巧指南
3. **图像识别功能** - 识别麻将牌图片

---

## 八、修改记录

| 日期 | 版本 | 修改内容 | 作者 |
|------|------|----------|------|
| 2026-03-16 | v1.0 | 创建优化计划文档 | OpenCode |
| 2026-03-16 | v2.0 | 优化子agent协同流程 | OpenCode |
| 2026-03-16 | v2.2 | 完成阶段4-5代码清理和文档整合 | OpenCode |
| 2026-03-16 | v2.3 | 完成代码审查与修复（长按、内存泄漏、字牌解析） | OpenCode |

---

## 九、本次完成情况（v2.3）

### 已完成任务

| 任务 | 状态 | 说明 |
|------|------|------|
| 阶段1：测试修复 | ✅ 完成 | MahjongTile 测试修复 |
| 阶段2：工具链完善 | ✅ 完成 | Prettier + format 脚本 |
| 阶段3：localStorage修复 | ✅ 完成 | 错误处理 + mastery=0 |
| 阶段3：代码审查 | ✅ 完成 | 审查 YakuView.vue 和 yaku.ts |
| 阶段3：关键bug修复 | ✅ 完成 | 长按连续触发、内存泄漏、字牌解析 |
| 阶段4：代码清理 | ✅ 完成 | 清理 draft/备份/HelloWorld |
| 阶段5：文档整合 | ✅ 完成 | PROJECT_STATUS.md 精简 |

### 验证结果
- 测试：42个全部通过
- 构建：成功
- TypeScript：类型检查通过
- 功能：正常

### 待后续处理
- 补充 UI 交互测试（P1）
- 构建优化（P2）
| 2026-03-16 | v1.0 | 创建优化计划文档 | OpenCode |
| 2026-03-16 | v2.0 | 优化任务分配，新增问题定位阶段，明确子agent职责 | OpenCode |
