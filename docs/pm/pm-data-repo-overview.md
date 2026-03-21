# 管理数据仓库 — 概览

面向：**刚接触双仓、需要建立心智模型**的读者。操作步骤与配置字段仍以 [项目管理关联与备份](./pm-linking.md) 为准；分支与界面能力见 [PM 数据仓分支约定](./pm-data-repo-branches.md)。

---

## 1. 它是什么

- **管理数据仓库**（常简称「数据仓」）是一个 **独立的 Git 仓库**，专门存放 **交付管理相关的 JSON 等数据**（交付项、收据、与 `projectKey` 绑定的项目文件等），**不存放**本业务项目（雀魂攻略）的应用源码。
- 本项目的远端数据仓示例：**[learnMajSoul-pm-data](https://github.com/ThymeD/learnMajSoul-pm-data)**（仓库内另有 README，说明 `data/` 下文件与协作约定）。
- **业务仓库**即你日常开发的 `learnMajSoul` 代码仓；两边 **物理路径不同**，通过便携中心里的 **`project-links.local.json`** 映射到一起（该文件 **不入业务仓**）。

这样设计的目的：切换业务分支、发版或拆库时，**不会**把交付进度和备份策略与业务代码绑死。

### 本仓库默认目录关系（与代码一致）

`npm run pm:init` / `pm-link.mjs` 在未手写配置时，会把 **`managementRepoPath`** 设为：

`resolve(业务仓根目录, '..', 'learnMajSoul-pm-data')`

因此常见布局为：业务代码在 **`…/learnMajSoul/learnMajSoul`**，数据仓在 **`…/learnMajSoul/learnMajSoul-pm-data`**（与业务仓 **共享同一父目录** `learnMajSoul`）。`pm-startup-check.mjs` 在无映射条目时回退到同一相对路径。若你的数据仓在别处，只要在 `project-links.local.json` 写明即可。

---

## 2. 与业务仓库的对应关系（心智模型）

| 概念 | 说明 |
|------|------|
| 业务仓库 | 前端、路由、`src/pm` 代码等；`npm run dev` 在这里执行。 |
| 管理数据仓库 | 只承载「管理数据」；Git 操作（拉取 / 推送 / 分支）在 **数据仓目录** 内进行。 |
| 便携中心 `../.pm-center/` | 存 **本地映射**（如 `project-links.local.json`），告诉 dev 服务器：当前业务项目对应哪一块磁盘上的数据仓。 |

开发模式下，Vite 中间件根据映射读写数据仓目录下的数据文件；**静态构建单独部署**时若无等价后端，则无法使用 `__pm_api`（见使用说明中的说明）。

---

## 3. 路径与配置里常见字段

在 `project-links.local.json` 的 `projects.<projectKey>` 中，与「数据仓」直接相关的典型字段包括：

- **`managementRepoPath`**：本机 **数据仓根目录**（克隆下来的 Git 仓库根路径）。
- **`managementDataSubdir`**：数据文件相对数据仓根的子目录，常见为 **`data`**；实际读写目录为 `managementRepoPath` + `managementDataSubdir`。

具体示例见 [pm-linking.md](./pm-linking.md) 中的 JSON 样例。

---

## 4. 远端与多设备

- 数据仓通常也会有一个 **GitHub（或其它远端）** 仓库，用于备份与多设备对齐；**备份 / 同步** 针对的是 **数据仓** 的当前分支与远端，不是业务仓库。
- 多设备、分支策略、界面上的「同步 / 备份」语义，见 [pm-data-repo-branches.md](./pm-data-repo-branches.md) 与 [使用说明](./pm-delivery-suite-user-guide.md)。

---

## 5. 接下来读什么

| 需求 | 文档 |
|------|------|
| 初始化映射、CLI、便携中心 | [pm-linking.md](./pm-linking.md) |
| 交付页 / 数据管理页怎么用 | [pm-delivery-suite-user-guide.md](./pm-delivery-suite-user-guide.md) |
| 分支约定与「协作主分支」 | [pm-data-repo-branches.md](./pm-data-repo-branches.md) |
