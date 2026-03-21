# PM 数据仓：分支约定与界面能力（方案）

## 1. 背景与问题

- 数据仓是独立 Git 仓库，日常很少在资源管理器 / IDE 里打开。
- 跨设备交接时可能被切到**临时分支**长期开发，偏离团队约定的「标准协作分支」。
- 现有页面上的「同步 / 备份」始终针对**当前检出分支**（见 `vite.config.ts` 中 `runDataRepoAction`），**没有**「一键回到约定主分支」的能力。

本方案回答三件事：

1. **数据仓分支怎么设计**（轻量、可配置）。
2. **界面上要提供哪些操作**（安全、可理解）。
3. **配置存在哪里**（与现有 `project-links` 一致：本地、不入业务仓）。

---

## 2. 数据仓分支设计建议（轻量 Git Flow）

PM 数据仓存的是**交付/进度类数据**，不是业务代码，分支宜**少而清晰**。

### 2.1 推荐约定（默认）

| 分支 | 角色 | 说明 |
|------|------|------|
| **`develop`** | **日常协作主线** | 多设备同步、日常备份推送的默认目标；新设备「回到标准流程」= 切回 `develop`。 |
| **`release`** | **已发布 / 生产对齐快照（可选）** | 需要「冻结某一版对外可见数据」时，从 `develop` 合并或打 tag；不必每天使用。 |
| **`main`** | **可选** | 若 GitHub 仓库默认分支是 `main`，可与 `develop` 保持同步，或仅作镜像；**团队若不使用 `main`，可在配置里把「主协作分支」设为 `develop`，界面不再强调 `main`。 |

原则：**只有一个「日常必用」的集成分支**，避免 `main` / `develop` 双主线并行却没人合并。

### 2.2 若仓库极简（单人 / 小团队）

- 只保留 **`develop`**（或只保留 **`main`** 一条线），所有同步/备份都针对这一条分支。  
- `release` 用 **tag**（如 `v2025.03.21`）代替长期分支亦可。

### 2.3 与当前实现的关系

- 「同步」= `fetch` + `pull --rebase` **当前分支**。  
- 「备份」= `add/commit`（若有变更）+ `pull` + `push` **当前分支**。  
- 因此：**先检出到约定分支，再同步/备份**，行为与今天一致，只是补上「检出」这一步的显式入口。

### 2.4 何时合入 release、用户是否要做这个动作

**日常不必做。** 多设备协作、日常备份，以 **`integrationBranch`（默认 `develop`）** 为准即可；本页主流程（检查远端、并入协作主分支、同步、备份）**不依赖** release。

**什么时候考虑 release（或 tag）？**

| 场景 | 说明 |
|------|------|
| 需要「冻结」一版对外可见的交付/进度数据 | 与某次业务发布、里程碑对齐，便于以后对照 |
| 团队约定「发布线」单独维护 | 例如 `release` 只从 `develop` 合并，再打 tag |
| 用 tag 代替长期 `release` 分支 | 例如 `v2025.03.21`，同样满足「标记某一版」 |

**用户是否要自己做「合入 release」？**

- **不是必须。** 没有发布/冻结需求时，可以一直在 `develop` 上工作，不必切 release、不必合并 release。  
- **需要时**：合入 release 属于 **Git 操作**（在数据仓目录里 `merge`、或按团队流程从 `develop` 提 PR），**当前界面未提供「一键并入 release」**；若配置了 `releaseBranch`，「检查远端分支」会顺带提示该分支在远端是否存在，**是否初始化、何时合并**仍由团队与你在数据仓里自行决定。

---

## 3. 可配置项（建议 schema）

放在便携中心本地配置（**不入业务仓库**），例如扩展 `project-links.local.json` 的 `projects.<key>`，或单独 `data-repo-branches.local.json`：

```json
{
  "version": 1,
  "projects": {
    "learnMajSoul": {
      "integrationBranch": "develop",
      "releaseBranch": "release",
      "githubDefaultBranch": "main"
    }
  }
}
```

字段含义：

- **`integrationBranch`**（必填，默认 `develop`）：**日常协作主分支**；界面「回到标准分支」「新设备建议检出」均指向它。
- **`releaseBranch`**（可选）：仅文档与高级操作展示；不强制每天切换。
- **`githubDefaultBranch`**（可选）：仅用于提示「远端默认分支是 xxx，与 integration 是否一致」；不强制与 integration 同名。

未配置时：**默认 `integrationBranch = develop`**（若仓库无该分支，界面提示先建分支或改配置）。

---

## 4. 界面功能（建议分阶段）

### 4.1 第一阶段（高价值、低风险）

在「数据管理」数据仓相关区域（如 ③ 双仓对照 / ⑥ 备份 附近）增加：

1. **当前数据仓分支**（已有信息可拼出，加强展示）。
2. **「切换到协作主分支」**  
   - 读取配置中的 `integrationBranch`（默认 `develop`）。  
   - 流程建议：`fetch` → `checkout <integrationBranch>`（不存在则提示：远端是否有该分支 / 是否需先创建）。  
   - **前置检查**：工作区脏、与远端分叉时，明确提示（见 4.3），禁止静默覆盖。

3. **「推送到 GitHub」**  
   - 与现有「备份」关系：**备份**已包含 `push`；本按钮可定位为「在**无新文件变更**时仍执行 `pull` + `push` 对齐远端」，或简化为「重复一次备份中的 push 路径」，避免两套语义。  
   - 更干净的做法：**保留一个主按钮「备份（提交并推送）」**，另加文案说明「仅推送」与备份的差异；或第二阶段再做「仅 push」。

### 4.2 第二阶段

- 下拉选择远端分支列表（`git branch -r`）仅**检出**，仍建议以配置的 `integrationBranch` 为默认高亮。  
- 「从 `develop` 新建交接分支」等（易与 AI 工作流结合，需更强约束与文档）。

### 4.3 安全与提示（必须）

在执行 checkout / push 前：

- **未提交变更**：提示先「备份」或手动处理，或提供「stash」（实现成本高，可后置）。  
- **当前分支领先/落后远端**：提示先同步或合并，避免误推。  
- **目标分支不存在**：提示在远端创建，或本地从某分支创建并推送（需产品决策，避免一键误操作）。

---

## 5. 后端 / 控制面

- 在现有 `__pm_api` 的 project control 通道中**新增动作**（与 `sync_data_repo` / `backup_data_repo` 并列），例如：  
  - `checkout_data_repo_branch`（body 带 `branch` 或仅用配置的 `integrationBranch`）  
- 所有命令 **cwd 限定在 `managementRepoPath`**，与现有一致。  
- 返回最新 `resolveProjectLinkStatus`，供界面刷新。

---

## 6. 文档与协作约定（给人看的）

在 `docs/pm/pm-linking.md` 增加一节链接到本文，并写清三句话：

1. 日常数据协作以 **`integrationBranch`（默认 `develop`）** 为准。  
2. 交接机器时：先在本页 **切换到协作主分支**，再 **同步 → 备份**。  
3. `release` / `main` 按团队需要选用，不强制每日操作。  
4. **何时合入 release、是否必须做**：见 **§2.4**。

---

## 7. 小结

| 项目 | 建议 |
|------|------|
| 日常主线 | **`develop`** 作为 integration 分支（可配置） |
| 生产/冻结 | **`release` 或 tag**，按需使用 |
| `main` | 可选；不使用时用配置屏蔽界面表述 |
| 界面 | 「切到协作主分支」+ 明确与「同步/备份」的顺序 |
| 配置 | 便携中心本地 JSON，字段 `integrationBranch` 等 |

实现顺序建议：**配置 schema → API checkout → UI 按钮与文案 → 再考虑仅 push / 分支列表**。

---

## 8. 已实现（本仓库）

- **配置**：`project-links.local.json` 中每个项目可增 `integrationBranch`（默认 `develop`）、`releaseBranch`（可选）。
- **API**（dev/preview 由 Vite 中间件提供）：
  - `GET /__pm_api/data/branches?projectKey=&fetch=1`：拉取远端（可选）并列出分支、当前分支。
  - `GET /__pm_api/data/branch-remote-status?projectKey=`：`fetch origin` 后检查约定中的协作主分支 / 发布分支是否在 `origin` 上存在。
  - `POST /__pm_api/data/branch-init`：`{ projectKey, integration?: boolean, release?: boolean }` 在**用户确认**后，对缺失项执行创建并推送（优先从 `origin/main` / `origin/master` / `origin/develop` 建分支；若本地已有同名分支则推送；否则基于当前 HEAD）。工作区须干净。
  - `POST /__pm_api/data/checkout`：`{ projectKey, branch }` 切换数据仓分支（需工作区干净）。
  - `POST /__pm_api/data/push`：推送当前分支到 `origin`。
  - `POST /__pm_api/data/branch-config`：保存约定分支名。
- **界面**：数据管理页在「③ 双仓对照」下方增加全宽卡片 **「数据仓分支（PM）」**；提供 **「检查远端分支」**；若约定分支在远端缺失，展示警告并可 **「初始化远端分支」**（确认后调用 `branch-init`）。主按钮 **「并入协作主分支并推送」** 要求远端已存在 `origin/<integrationBranch>`；有未提交改动时先自动 `commit`，再 `merge` 到协作主分支并 `push`；若已在协作主分支则只 `pull` + `push`。**不会**在合并流程里悄悄用 `main`/`master` 代替你配置的协作主分支。「更多」折叠内可保存约定、选分支切换等。
- **API**：`POST /__pm_api/data/merge-integration` 对应上述主按钮。
- **关联状态**：`GET /__pm_api/link/status` 返回的 JSON 中增加 `integrationBranch`、`releaseBranch` 字段。
