# 项目交付套件（`src/pm`）

与雀魂等业务页面隔离：**交付管理**、**数据管理**、本地 `__pm_api` 适配层与可复用核心均在此目录，后续可整体迁入独立 npm 包或子仓库。

| 路径 | 说明 |
|------|------|
| `config.ts` | 宿主项目配置：`projectKey`、文案、模板、按钮语义 |
| `api/delivery.ts` | 调用 Vite 中间件 `__pm_api/*` 的类型与函数 |
| `core/` | 类型、仓库、模板、`useProjectManagement` |
| `views/` | `DeliveryView`、`DataManagementView` |

详细说明见仓库内 **`docs/pm/`**（与业务文档隔离）：[维护说明](../../docs/pm/pm-delivery-suite-maintainer.md)、[使用说明](../../docs/pm/pm-delivery-suite-user-guide.md)。

自动化测试与 **`src/pm` 对齐** 的目录为 **`tests/pm/`**（`npm run test:pm`），见 [tests/pm/README.md](../../tests/pm/README.md)。

**尚未迁入 `src/pm`、移植时需一并考虑的宿主侧内容**：`vite.config.ts` 中的 `__pm_api` 中间件、**`scripts/pm/`** 下 CLI、`src/data/rule-review-items.ts`（被 `useProjectManagement` 引用）、`src/utils/storage-map.ts`（被 `repository` 引用）。见 [管理系统移植确认清单](../../docs/pm/checklist-pm-suite-migration.md)。
