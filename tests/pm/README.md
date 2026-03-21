# PM 交付套件测试（`tests/pm`）

与 **`src/pm/`** 对齐：此处放 **交付管理 / 数据管理 / 便携中心相关** 的单元与集成测试，避免与麻将业务测试混在同一目录根下难以区分。

## 约定

| 位置 | 用途 |
|------|------|
| `tests/pm/**/*.test.ts` | Vitest（与 `vitest.config.ts` 的 `include` 一致） |
| 若需 E2E | Playwright 规格可放在本目录下 `*.spec.ts`（`playwright.config.ts` 的 `testDir` 为 `./tests`，会递归包含） |

编写测试时，**避免**从 `src/pm/config` 或 `src/pm/core/index` 做会拉满整条依赖链的导入：`config` 与 `api/delivery` 存在循环依赖，在 Vitest 中可能导致 `projectManagementConfig` 未初始化。优先 **`import … from '../../src/pm/core/<具体文件>'`** 等直达路径（参见 `templates.smoke.test.ts`）。

## 命令

```bash
# 仅跑 PM 套件测试
npm run test:pm

# 全量 Vitest
npm run test:run
```

业务侧大文件（如手牌分析）仍放在 **`tests/`** 根或其它业务子目录，不迁入本目录。
