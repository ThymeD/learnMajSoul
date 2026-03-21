# 项目交付套件 — 开发与拆库维护说明

面向：**在本仓库内维护「交付管理 + 数据管理」的开发者**，以及后续将 **PM 交付套件** 独立成单独仓库/包时的维护者。

---

## 1. 现有文档索引

| 文档 | 内容 |
|------|------|
| [使用说明](./pm-delivery-suite-user-guide.md) | 终用户：两页分工、工作模式、顶栏提醒、CLI 对照 |
| [业务项目发布部署确认清单](./checklist-business-release.md) | 上线时 feature、`__pm_api`、静态部署 |
| [管理系统移植确认清单](./checklist-pm-suite-migration.md) | 拆到新项目时的代码、脚本、耦合与验证 |
| [项目管理关联与备份](./pm-linking.md) | 便携中心、`project-links`、CLI、`npm` 脚本 |
| [项目管理模块复用](./project-management-module.md) | `src/pm/core` 模块边界 |
| [PM 数据仓分支约定](./pm-data-repo-branches.md) | 分支与界面能力设计 |

---

## 2. 仍与业务仓库耦合（查漏）

`src/pm` 已集中交付套件，但以下仍依赖宿主路径，**移植时必看** [管理系统移植确认清单](./checklist-pm-suite-migration.md) 第三节：

- `pm/core/composables/useProjectManagement.ts` → `src/data/rule-review-items.ts`（规则复核导入交付项）。
- `pm/core/repository.ts` → `src/utils/storage-map.ts`（本地存储封装）。
- **`scripts/pm/*.mjs`**、**`vite.config.ts`** 内 `projectManagementFileApi`、**`predev`** 与 **`.pm-center`** 约定：与业务同仓，非 `src/pm` 子树。
- Vitest：**`tests/pm/`** 与 `src/pm` 对齐；仅跑 PM 测试用 **`npm run test:pm`**。

可选增强：将 `ruleReviewItems` 改为注入，以进一步利于拆包（移植清单第四节）。

---

## 3. 代码地图（当前仓库）

| 区域 | 路径 | 说明 |
|------|------|------|
| 交付页 | `src/pm/views/DeliveryView.vue` | 看板/列表、桥接同步、写锁入口 |
| 数据管理页 | `src/pm/views/DataManagementView.vue` | 总览、模式、双仓、分支/同步/备份（多设备）、日志等 |
| 业务适配层 | `src/pm/api/delivery.ts` | `fetch` 调用 `__pm_api/*`、类型与 `projectKey` |
| 共享状态与逻辑 | `src/pm/core/composables/useProjectManagement.ts` | 交付项、项目文件、关联状态、控制面操作 |
| 配置 | `src/pm/config.ts` | **`projectKey`、项目名称、标签、按钮语义**（新宿主项目需改此处） |
| 套件入口（可选） | `src/pm/index.ts` | 聚合导出，便于拆包 |
| 全局提醒 | `src/layouts/MainLayout.vue` | `loadProjectLinkStatus`、多设备模式下的顶栏提示 |
| 路由 | `src/router/index.ts` | `/delivery`、`/data-management` |
| 功能开关 | `src/config/features.ts` | `deliveryManagement` |
| 本地 API（dev） | `vite.config.ts` | `projectManagementFileApi()`：`/__pm_api/items`、`bridge`、`receipts`、`link/status`、`mode`、`logs/*`、数据仓 Git 等 |

---

## 4. 运行时契约

- **开发**：本地 API 由 Vite 中间件提供，读写 `project-links` 解析出的管理数据目录。
- **生产构建**：若仅静态部署，无等价后端则 `__pm_api` 不可用；需在独立产品文档中说明「需 dev 或配套服务」或提供 **独立 Node 服务** 承载同一套 API。
- **`projectKey`**：前后端与配置文件中的项目键需一致；当前集中在 `src/pm/config.ts`（`vite.config.ts` 中 `defaultProjectKey` 需与之对齐）。

---

## 5. 独立拆库（建议路线）

目标：把「交付 + 数据管理」作为 **可嵌入任意 Vue 业务项目** 的套件，或 **独立 SPA + 可选后端**。

### 5.1 建议阶段

1. **文档与边界**：冻结对外行为（用户指南 + 本文件的 API 列表）。
2. **抽取包**：将 `src/pm/` 整目录（或拆成 `client` + `server`）、样式 token 迁入 `packages/pm-delivery`（名称示例）。
3. **宿主注入**：通过 `createPmDeliveryPlugin({ projectKey, labels, routesPrefix })` 或类似方式注册路由与菜单。
4. **后端**：将 `vite.config.ts` 内中间件迁为 **独立进程**（Express/Fastify），与静态资源分离部署；路径与鉴权再定。
5. **模板仓库**：提供「最小宿主项目」示例（仅菜单 + 路由 + feature flag）。

### 5.2 拆库时需重点回归

- 双仓路径校验、`workingMode` 与折叠/刷新、`processLogInventory`、数据仓 Git 错误恢复流。
- `featureFlags` 与菜单项是否一致。
- 新宿主修改 `projectKey` 后，便携中心与 `project-links` 是否仍指向正确管理仓。

### 5.3 已知耦合点（拆时逐项处理）

- 业务仓库根目录 `process.cwd()` 与 Vite 中间件中的路径解析。
- 图标与 `Element Plus` 版本；独立包时可列为 peerDependencies。
- 本仓库内「雀魂」相关文案：独立产品时应通过 `projectManagementConfig.labels` 与 i18n 抽离。

---

## 6. 变更记录

| 日期 | 说明 |
|------|------|
| 2025-03 | 初版：用户指南 + 维护/拆库说明，与 `pm-linking` 交叉引用 |
| 2025-03 | PM 文档集中到 `docs/pm/`，原 `docs/pm-*.md` 根路径保留为迁移占位 |
| 2025-03 | PM CLI 脚本集中到 `scripts/pm/`，`package.json` / `vite.config` 已更新路径 |
