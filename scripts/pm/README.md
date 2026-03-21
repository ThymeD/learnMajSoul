# PM 命令行脚本（`scripts/pm`）

与仓库内其它脚本隔离；由 `package.json` 中 `pm:*`、`bridge:*`、`predev` 调用。

| 脚本 | npm 脚本 |
|------|----------|
| `pm-link.mjs` | `pm:init`、`pm:link-status`、`pm:backup` |
| `pm-startup-check.mjs` | `predev`、`pm:startup-check`；`vite.config` 内启动检查亦调用 |
| `pm-import-progress.mjs` | `pm:import-progress` |
| `pm-bridge.mjs` | `bridge:event` |
| `pm-receipts.mjs` | `bridge:receipts` |

移植套件时整目录复制即可；仓库根路径在脚本内解析为 **`scripts/pm` 的上两级**。

**默认数据仓路径**：`pm-link.mjs` 的 `init` 将 `managementRepoPath` 设为 **业务仓根目录的上一级** 下的 **`learnMajSoul-pm-data`**（例如业务仓在 `…/learnMajSoul/learnMajSoul` 时，数据仓为 `…/learnMajSoul/learnMajSoul-pm-data`）。`pm-startup-check.mjs` 无配置时回退逻辑与此一致。
