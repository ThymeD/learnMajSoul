# 项目管理模块复用说明

## 目标

将“交付管理（需求/缺陷/待办）”能力抽成可复用模块，便于在后续项目快速接入。

## 模块位置

- `src/modules/project-management/types.ts`：通用类型定义
- `src/modules/project-management/repository.ts`：按 `projectKey` 读写仓库
- `src/modules/project-management/templates.ts`：通用模板与模板实体化工具
- `src/modules/project-management/index.ts`：统一导出入口

## 快速接入步骤

1. 在业务适配层创建仓库实例（示例：`src/data/delivery.ts`）：
   - `createProjectManagementRepository('<your-project-key>')`
2. 通过适配层暴露业务函数：
   - `loadItems()` / `saveItems()` / `createItem()`
3. 在页面层接入：
   - 列表视图
   - 看板视图（按状态拖拽）
   - 模板导入（`createDefaultProjectTemplates()`）
4. 按项目需要增加 feature flag 控制入口显示（上线前可隐藏）。

## 可复用能力

- 类型系统：模式、类型、状态、优先级统一
- 持久化：支持基于 `projectKey` 的隔离存储
- 模板：支持迭代模板、缺陷模板、规则优化模板
- 快照导出：可用于周报/验收归档

## 扩展建议

- 后续可替换本地存储为后端 API，保留同一 repository 接口不变
- 可按项目需求新增模板，不影响核心模块
- 可增加权限字段（如 reviewer、qaOwner）用于团队协作
