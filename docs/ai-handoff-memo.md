# AI 接力备忘（跨设备继续开发）

最后更新：2026-03-20

## 目标

本备忘用于在新设备快速恢复上下文。切到指定分支后，提醒 AI 先阅读本文件，再继续实施任务。

## 代码与数据仓库

- 业务仓库：`https://github.com/ThymeD/learnMajSoul`
- 数据仓库：`https://github.com/ThymeD/learnMajSoul-pm-data`
- 接力分支（两仓一致）：`handoff/device-switch-20260320`

## 当前阶段结论

1. 已完成“项目交付管理”和“数据管理”页面拆分。
2. 已落地按钮语义（红/黄/绿/蓝）与图标规范，且仅作用于管理页面。
3. 已接入数据仓同步、备份、启动校验、连接自检与日志清理能力。
4. 已登记两条需求：
   - P3：新手模式引导（首次进入 3 步提示）
   - P1：湖南红中麻将对局功能规划（人机/线上多人，强调吸引力与社交）

## 新设备启动步骤

1. 克隆并切换业务仓分支：
   - `git clone https://github.com/ThymeD/learnMajSoul.git`
   - `git -C learnMajSoul checkout handoff/device-switch-20260320`
2. 克隆并切换数据仓分支：
   - `git clone https://github.com/ThymeD/learnMajSoul-pm-data.git`
   - `git -C learnMajSoul-pm-data checkout handoff/device-switch-20260320`
3. 安装依赖：`npm install`
4. 执行一次初始化：`npm run pm:init`
5. 配置本地映射：`C:/code/.pm-center/project-links.local.json`
   - `businessRepoPath` 指向本机业务仓目录
   - `dataRepoPath` 指向本机数据仓目录
6. 校验链接状态：`npm run pm:link-status`
7. 启动：`npm run dev`（会触发 predev 启动校验）

## 操作边界（请遵守）

- 本地路径配置是设备私有信息，不能提交到远程。
- 数据仓变更通过“数据管理页”按钮或对应脚本同步，避免手工误操作。
- 当系统提示写锁（防呆）时，优先同步/校验后再决定是否手动解锁。

## 建议 AI 接手流程

1. 先读取本文件与 `docs/pm/pm-linking.md`。
2. 读取 `src/pm/views/DeliveryView.vue` 与 `src/pm/views/DataManagementView.vue`，确认管理面交互一致性。
3. 读取 `src/pm/core/composables/useProjectManagement.ts`，确认写锁、同步、校验逻辑。
4. 若继续治理管理页面，先在当前接力分支提交；稳定后再发起 PR 合并到 `develop`。

## 远程备注入口

- 业务仓接力 Draft PR：`https://github.com/ThymeD/learnMajSoul/pull/3`
