# 项目管理关联与备份（方案A）

## 目标

- 业务项目与管理项目解耦，避免切换业务分支导致进度数据丢失或混乱。
- 管理数据独立放在管理仓库，并可推送到 GitHub 做线上备份。
- 本地可检测关联状态，未关联时在交付管理页提醒用户主动处理。

## 本地配置（便携中心）

默认会把管理系统迁移到业务项目父目录的便携中心：`../.pm-center/`

1. 执行 `npm run pm:init` 初始化便携中心与本地映射文件
2. 若需自定义，编辑 `../.pm-center/project-links.local.json`
3. 按实际路径填写（本地文件，不入业务仓库）

示例：

```json
{
  "version": 1,
  "projects": {
    "learnMajSoul": {
      "businessRepoPath": "C:/code/learnMajSoul",
      "managementRepoPath": "C:/code/learnMajSoul-pm-data",
      "managementDataSubdir": "data"
    }
  }
}
```

## 命令

- 初始化便携中心：`npm run pm:init`
- 检查关联与远程备份配置：`npm run pm:link-status`
- 备份管理仓库到 GitHub：`npm run pm:backup`
- 导入当前业务项目进度：`npm run pm:import-progress`

`pm:backup` 会在管理仓库先执行 `git pull --rebase`，再执行 `git add/commit/push`。

## 业务数据隔离与可插拔导入

- 管理系统数据与业务代码分离存储：默认 `../.pm-center/data/`
- 业务项目导入来源可配置（插件式开关）：
  - 本地配置：`../.pm-center/business-sources.local.json`（或旧位置 `.project-management/business-sources.local.json`）
  - 模板：`.project-management/business-sources.template.json`
  - 目前支持：`collaboration_md`、`git_status`

## 多设备一致性建议（同一用户）

- 每台设备都维护自己的 `../.pm-center/project-links.local.json`（不入业务仓库）。
- 每次开始工作先运行 `npm run pm:link-status`，确认非 `behind` 且无未提交脏变更。
- 每次完成一轮交付后运行 `npm run pm:backup`，把管理数据推到 GitHub。
- 页面出现“需同步管理仓库”提醒时，优先处理同步再继续录入。
