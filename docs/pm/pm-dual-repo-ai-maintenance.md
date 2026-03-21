# 双代码仓维护说明（AI / 跨设备）

面向：**在本项目使用 AI 改代码、提交，并需要同时「看护」业务仓与 PM 数据仓**的协作者。与 [分支管理策略](../branch-strategy.md) 一致，并补充双仓路径与提交边界。

---

## 1. 两个仓库分别是什么

| 仓库 | 远程示例 | 内容 |
|------|----------|------|
| **业务仓** | `learnMajSoul` | 前端、`src/pm/`、`vite`、`scripts/pm/`、文档、`tests/` 等 |
| **管理数据仓（PM 数据仓）** | `learnMajSoul-pm-data` | 交付/管理相关 **JSON**（`data/<projectKey>-*.json`），**无业务源码** |

两者 **独立 Git 仓库**，独立 `git commit` / `git push`，**不要**混在一个仓库里提交对方的内容。

---

## 2. 跨设备：相对路径不变，绝对路径会变

约定（与 `scripts/pm/pm-link.mjs` 默认一致）：

- 固定的是 **目录相对关系**：业务仓根目录与数据仓根目录 **共享同一父目录**，数据仓名为 **`learnMajSoul-pm-data`**，业务代码在 **`learnMajSoul`**（或你的业务仓文件夹名，与 `package.json` 所在根一致）。
- 典型布局（仅示意）：

```text
<任意盘符>/<你的父目录>/learnMajSoul/          ← 业务仓根（clone learnMajSoul）
<任意盘符>/<你的父目录>/learnMajSoul-pm-data/ ← 数据仓根（clone learnMajSoul-pm-data）
```

- **每台设备**的「`<任意盘符>/<你的父目录>`」可以不同；**不要**把本机绝对路径写进任一仓库的已跟踪文件。
- **便携中心** `project-links.local.json`（在业务仓根的 `../.pm-center/`）保存 **本机绝对路径**，该文件 **不入 Git**。AI 协助编辑时 **勿提交** 该文件。

---

## 3. 分支角色（与全项目策略一致）

与 [分支管理策略](../branch-strategy.md) 对齐，摘要如下：

### 业务仓 `learnMajSoul`

| 分支 | 角色 |
|------|------|
| **`develop`** | **开发态**：日常集成；可从 `develop` **拉分支**做特性，也可 **直接在 `develop` 上推送** 开发中的代码（视改动规模与习惯而定）。 |
| **`release`** | **特性开发完成后** 再合入的分支（完成线 / 便于对照发布）。 |
| **`main` / `master`** | **不常用**。 |

### 数据仓 `learnMajSoul-pm-data`

- 默认语义与业务仓对齐：**`develop`** = 开发态；**`release`** = 特性交付后的 **归档/对照** 分支。
- **多数时候**：直接在 **`develop`** 上管理交付数据并 **推送到 GitHub**，做多设备同步即可。
- **多设备协作**：各设备保持 **同一套分支习惯**（通常都基于 `develop` 拉取/推送），避免开发状态长期分叉。
- **避免**：多人各自基于 **`release`** 拉出多个方向长期开发，最后 **合不回 `develop`**、JSON **冲突难以解决**。只要不是这类极端情况，**数据仓用 `develop` 推到 GitHub 做同步一般足够**；需要里程碑归档时再在 `release` 上对齐或打 tag。

---

## 4. AI 改动与提交边界（看护两仓）

### 业务仓 `learnMajSoul`

- 改交付 UI、数据管理页、`src/pm/`、`vite.config.ts`、`scripts/pm/`、文档、`tests/pm/` → **只在业务仓** 提交。
- 合并前建议：`npm run build` 或至少 `npm run test:run`；涉及 PM 套件可加 `npm run test:pm`。
- **禁止**把 `project-links.local.json`、`.pm-center` 下仅本机配置 **提交到远程**。

### 数据仓 `learnMajSoul-pm-data`

- 仅当 **交付数据**（`data/*.json`）或 **数据仓 README** 等需要版本化时，在 **数据仓目录** 内单独 `commit` / `push`。
- **不要**在数据仓里提交业务代码；**不要**在业务仓里提交 PM 数据 JSON（数据文件属于数据仓）。
- 若本次任务只改业务代码、**未**通过应用/CLI 产生数据变更，通常 **不必** 动数据仓。

### 跨仓一致性

- 若用户要求「两仓同一 handoff 分支」接力，见 `docs/ai-handoff-memo.md` 类备忘：**两仓检出同一分支名** 再工作。

---

## 5. 提交信息建议

- 业务仓：沿用 Conventional 风格即可（如 `feat(pm): …`、`fix: …`、`docs: …`）。
- 数据仓：`chore(pm-data): …` 或 `docs: …`；若仅为应用自动备份产生的 JSON 更新，说明用途（如备份、同步）即可。

---

## 6. 相关文档索引

| 文档 | 用途 |
|------|------|
| [pm-linking.md](./pm-linking.md) | 便携中心、`npm run pm:*`、映射字段 |
| [pm-data-repo-overview.md](./pm-data-repo-overview.md) | 数据仓含义与 `managementRepoPath` |
| [分支管理策略](../branch-strategy.md) | `develop` / `release` 总规则 |

---

## 7. 给 Cursor / Agent 的一句话

> 默认工作区是 **业务仓**；**数据仓**是同级目录下另一个 Git 仓库。改代码在业务仓提交；只有数据 JSON/数据仓文档变更时在 **learnMajSoul-pm-data** 单独提交。**绝不提交** 含本机绝对路径的 `project-links.local.json`。
