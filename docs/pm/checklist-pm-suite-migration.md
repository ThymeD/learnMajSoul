# 管理系统（交付 + 数据管理）移植确认清单

适用于：将 **项目交付 / 数据管理套件** 从本仓库 **复制或拆包** 到 **另一个业务项目**（例如用户用其管理多个 AI 辅助个人项目）。

> 业务站点自身发版（不关 PM 拆库）见 [业务项目发布部署确认清单](./checklist-business-release.md)。

---

## 1. 必须一并迁移的代码与配置

- [ ] 目录 **`src/pm/`** 整体（含 `config.ts`、`api/`、`core/`、`views/`、`index.ts`、`README.md`）。
- [ ] 目录 **`docs/pm/`** 整体（使用说明、维护说明、清单与 `pm-linking` 等；与业务文档隔离）。
- [ ] **路由**：`/delivery`、`/data-management` 的懒加载指向 `src/pm/views/...`（见宿主 `src/router/index.ts`）。
- [ ] **布局/菜单**：在宿主 `MainLayout`（或等价壳）中注册菜单项，并从 **`../pm/api/delivery`** 引用 `loadProjectLinkStatus`（全局提醒）。
- [ ] **`src/config/features.ts`**（或等价机制）：`deliveryManagement` 开关。
- [ ] **Vite**：将 `vite.config.ts` 中的 **`projectManagementFileApi()`** 中间件迁入宿主（或抽成 `vite-plugin-pm-file-api`）；保证 `__pm_api` 与 `defaultProjectKey`、便携中心路径逻辑一致。
- [ ] **根 `package.json` 脚本**（按需）：`pm:init`、`pm:link-status`、`pm:backup`、`pm:import-progress`、`pm:startup-check`、`bridge:event`、`bridge:receipts`；以及是否保留 **`predev`** 调用 `pm-startup-check.mjs`。
- [ ] **脚本目录 `scripts/pm/`** 整体：至少 `pm-link.mjs`、`pm-startup-check.mjs`；若用桥接/回执 CLI 则含 `pm-bridge.mjs`、`pm-receipts.mjs`（见 [`scripts/pm/README.md`](../../scripts/pm/README.md)）。
- [ ] **便携中心约定**：文档说明 `../.pm-center/`、`project-links.local.json`；模板可参考 `.project-management/project-links.template.json`。

---

## 2. 全仓库字符串与默认项（新宿主必改）

- [ ] **`src/pm/config.ts`**：`projectKey`、`projectName`、`labels`、`templates`（去掉雀魂/本项目专属文案若需要）。
- [ ] **`vite.config.ts`**：`defaultProjectKey`（与 `config.ts` 一致）。
- [ ] **`scripts/pm/*.mjs`**：`PM_PROJECT_KEY` 默认值、`pm-link.mjs init` 中的示例 `managementRepoPath`（当前可能存在 **learnMajSoul-pm-data** 等硬编码）。
- [ ] **`scripts/pm/pm-startup-check.mjs`**：无映射时的默认数据仓路径（当前存在 **learnMajSoul-pm-data** 回退逻辑，需改为新仓库名或改为仅读配置）。
- [ ] **`.project-management/project-links.template.json`**：示例 `projects` 键名。

---

## 3. 与业务代码仍存在的耦合（移植后建议逐项处理）

以下项 **不是** `src/pm` 内部自包含，移植后要么保留宿主实现，要么重构：

| 耦合点 | 位置 | 处理建议 |
|--------|------|----------|
| **规则复核数据** | `useProjectManagement` → `src/data/rule-review-items.ts` | 导入「复核项」用于交付页导入功能；新宿主若无规则复核页，可改为 **空数组注入** 或 **可选依赖**（抽 `PmRuleReviewSource` 接口）。 |
| **通用工具** | `pm/core/repository.ts` → `src/utils/storage-map` | 复制 `storage-map` 或改为 `@/utils` 别名；拆包时把 utils 列为 peer 或内联最小实现。 |
| **顶栏与路由** | `MainLayout`、`router` | 宿主自行挂载；拆成库时需 **插件 API** 注册路由与全局提醒。 |
| **麻将域关键词** | `useProjectManagement` 内 `PRODUCT_DOMAIN_KEYWORDS` 等 | 改为读取配置或新宿主领域词。 |

- [ ] 已确认上述耦合在目标仓库中的策略（保留 / 删除功能 / 抽象接口）。

---

## 4. 可选：进一步隔离（提升拆包纯度）

- [ ] 将 **`rule-review-items`** 从 PM 核心中 **注入**（composition 参数或 provide），避免 `pm/core` 直接 `import` 宿主 `src/data`。
- [ ] 将 Vite 中间件迁出为 **`vite-plugin-pm-center`**，宿主一行注册。
- [ ] 发布 **`@scope/pm-delivery-vue`** npm 包：`src/pm` +  peer：`vue`、`vue-router`、`element-plus`。

（本仓库已将 CLI 收拢至 **`scripts/pm/`**，PM 相关 Vitest 收拢至 **`tests/pm/`**（`npm run test:pm`）。）

---

## 5. 迁移后验证

- [ ] `npm run test:pm`：`tests/pm` 冒烟/回归通过。
- [ ] `npm run dev`：交付页可读写、`/__pm_api/items` 返回 200。
- [ ] `npm run pm:link-status`：与页面「关联状态」一致。
- [ ] 数据管理页：模式切换、刷新、多设备卡片折叠正常。
- [ ] `npm run build`：无类型错误；若生产不提供 API，已明确不对外承诺管理页可用性。

---

## 6. 文档

- [ ] 更新宿主 README 指向：`docs/pm/pm-delivery-suite-user-guide.md`、`docs/pm/pm-linking.md`。
- [ ] 在新仓库中保留或 fork **本清单** 与 [维护说明](./pm-delivery-suite-maintainer.md)。
