/**
 * 项目交付与数据管理套件（与业务代码隔离，便于后续拆包）。
 * 宿主项目通过路由注册 `/delivery`、`/data-management`，并引用本目录下视图与配置。
 */
export * from './core'
export { projectManagementConfig, type ProjectManagementConfig } from './config'
export * from './api/delivery'
