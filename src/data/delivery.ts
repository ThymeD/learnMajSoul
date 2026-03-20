import {
  createProjectManagementRepository,
  type CreateProjectItemInput,
  type ProjectDomain,
  type ProjectHandler,
  type ProjectItem,
  type ProjectItemKind,
  type ProjectItemPriority,
  type ProjectItemStatus,
  type ProjectMode
} from '../modules/project-management'
import { projectManagementConfig } from '../config/project-management'

export type DeliveryMode = ProjectMode
export type DeliveryKind = ProjectItemKind
export type DeliveryStatus = ProjectItemStatus
export type DeliveryPriority = ProjectItemPriority
export type DeliveryHandler = ProjectHandler
export type DeliveryDomain = ProjectDomain
export type DeliveryItem = ProjectItem
export interface DeliveryFileLoadResult {
  items: DeliveryItem[]
  revision: number
}

const repository = createProjectManagementRepository(projectManagementConfig.projectKey)
const PROJECT_ITEMS_API = '/__pm_api/items'
const PROJECT_RECEIPTS_API = '/__pm_api/receipts'
const PROJECT_CONTEXT_API = '/__pm_api/context'
const PROJECT_LOG_SUMMARY_API = '/__pm_api/logs/summary'
const PROJECT_LOG_CLEANUP_API = '/__pm_api/logs/cleanup'
const PROJECT_LINK_STATUS_API = '/__pm_api/link/status'
const PROJECT_STARTUP_CHECK_API = '/__pm_api/startup/check'
const PROJECT_CONTROL_API = '/__pm_api/control'
const PROJECT_DATA_SYNC_API = '/__pm_api/data/sync'
const PROJECT_DATA_BACKUP_API = '/__pm_api/data/backup'
const PROJECT_MODE_API = '/__pm_api/mode'

export function loadDeliveryItems(): DeliveryItem[] {
  return repository.load()
}

export function saveDeliveryItems(items: DeliveryItem[]): void {
  repository.save(items)
}

export function createDeliveryItem(partial: CreateProjectItemInput): DeliveryItem {
  return repository.create(partial)
}

export async function loadDeliveryItemsFromProjectFile(): Promise<DeliveryFileLoadResult> {
  const response = await fetch(`${PROJECT_ITEMS_API}?projectKey=${projectManagementConfig.projectKey}`, {
    cache: 'no-store'
  })
  if (!response.ok) {
    throw new Error(`load project items failed: ${response.status}`)
  }
  const data = (await response.json()) as { items?: DeliveryItem[]; revision?: number }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    revision: typeof data.revision === 'number' ? data.revision : 0
  }
}

export async function saveDeliveryItemsToProjectFile(
  items: DeliveryItem[],
  expectedRevision?: number
): Promise<{ revision: number }> {
  const response = await fetch(PROJECT_ITEMS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectKey: projectManagementConfig.projectKey,
      items,
      expectedRevision
    })
  })
  if (response.status === 409) {
    const data = (await response.json()) as { currentRevision?: number }
    const conflictError = new Error('revision conflict') as Error & {
      code?: string
      currentRevision?: number
    }
    conflictError.code = 'REVISION_CONFLICT'
    conflictError.currentRevision = data.currentRevision
    throw conflictError
  }
  if (!response.ok) {
    throw new Error(`save project items failed: ${response.status}`)
  }
  const data = (await response.json()) as { revision?: number }
  return {
    revision: typeof data.revision === 'number' ? data.revision : expectedRevision ?? 0
  }
}

export interface DeliveryReceipt {
  id: string
  itemId: string
  action: 'ai_submit_for_confirm' | 'user_confirm' | 'user_reject'
  operator: string
  note: string
  statusFrom: DeliveryStatus
  statusTo: DeliveryStatus
  createdAt: number
}

export interface ProjectContextInfo {
  branch: string
  commit: string
  itemsRevision: number
  itemsUpdatedAt: number
  itemsFilePath: string
}

export interface ProjectLinkStatus {
  linked: boolean
  backupReady: boolean
  needsUserAction: boolean
  needsAiAction: boolean
  reason: string
  businessRepoPath: string
  managementRepoPath: string
  managementDataDir: string
  remoteUrl: string
  managementBranch: string
  managementCommit: string
  workingTreeDirty: boolean
  ahead: number
  behind: number
  syncMessage: string
  workingMode: 'single_local' | 'multi_sync'
  modeConfirmed: boolean
  modeConfirmedAt: number
  needsModeConfirmation: boolean
  modePromptReason: string
}

export interface ProcessLogSummary {
  bridge: { total: number; removable: number }
  receipts: { total: number; removable: number }
}

export interface ProcessLogCleanupResult {
  bridge: { removed: number; remaining: number; revision: number }
  receipts: { removed: number; remaining: number; revision: number }
}

export interface ProjectStartupCheck {
  projectKey: string
  checkedAt: number
  severity: 'success' | 'warning' | 'error'
  messages: string[]
  businessRepo: {
    exists: boolean
    branch: string
    commit: string
    remoteUrl: string
    dirty: boolean
    ahead: number
    behind: number
  }
  dataRepo: {
    exists: boolean
    branch: string
    commit: string
    remoteUrl: string
    dirty: boolean
    ahead: number
    behind: number
  }
}

export type ProjectControlAction = 'startup_check' | 'sync_data_repo' | 'backup_data_repo'

export interface ProjectControlResult {
  ok: boolean
  action: ProjectControlAction
  message: string
}

export interface ProjectDataControlResult {
  ok: boolean
  message: string
  changed?: boolean
}

export async function appendDeliveryReceiptToProjectFile(receipt: DeliveryReceipt): Promise<void> {
  const response = await fetch(PROJECT_RECEIPTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectKey: projectManagementConfig.projectKey,
      receipts: [receipt]
    })
  })
  if (!response.ok) {
    throw new Error(`append receipt failed: ${response.status}`)
  }
}

export async function loadProjectContextInfo(): Promise<ProjectContextInfo> {
  const response = await fetch(`${PROJECT_CONTEXT_API}?projectKey=${projectManagementConfig.projectKey}`, {
    cache: 'no-store'
  })
  if (!response.ok) {
    throw new Error(`load context failed: ${response.status}`)
  }
  const data = (await response.json()) as Partial<ProjectContextInfo>
  return {
    branch: data.branch || 'unknown',
    commit: data.commit || 'unknown',
    itemsRevision: typeof data.itemsRevision === 'number' ? data.itemsRevision : 0,
    itemsUpdatedAt: typeof data.itemsUpdatedAt === 'number' ? data.itemsUpdatedAt : 0,
    itemsFilePath: data.itemsFilePath || ''
  }
}

export async function loadProjectLinkStatus(): Promise<ProjectLinkStatus> {
  const response = await fetch(`${PROJECT_LINK_STATUS_API}?projectKey=${projectManagementConfig.projectKey}`, {
    cache: 'no-store'
  })
  if (!response.ok) {
    throw new Error(`load link status failed: ${response.status}`)
  }
  const data = (await response.json()) as Partial<ProjectLinkStatus>
  return {
    linked: Boolean(data.linked),
    backupReady: Boolean(data.backupReady),
    needsUserAction: Boolean(data.needsUserAction),
    needsAiAction: Boolean(data.needsAiAction),
    reason: data.reason || '关联状态未知',
    businessRepoPath: data.businessRepoPath || '',
    managementRepoPath: data.managementRepoPath || '',
    managementDataDir: data.managementDataDir || '',
    remoteUrl: data.remoteUrl || '',
    managementBranch: data.managementBranch || 'unknown',
    managementCommit: data.managementCommit || 'unknown',
    workingTreeDirty: Boolean(data.workingTreeDirty),
    ahead: typeof data.ahead === 'number' ? data.ahead : 0,
    behind: typeof data.behind === 'number' ? data.behind : 0,
    syncMessage: data.syncMessage || '同步状态未知',
    workingMode: data.workingMode === 'multi_sync' ? 'multi_sync' : 'single_local',
    modeConfirmed: Boolean(data.modeConfirmed),
    modeConfirmedAt: typeof data.modeConfirmedAt === 'number' ? data.modeConfirmedAt : 0,
    needsModeConfirmation: Boolean(data.needsModeConfirmation),
    modePromptReason: data.modePromptReason || ''
  }
}

export async function setProjectWorkingMode(
  workingMode: 'single_local' | 'multi_sync'
): Promise<{ ok: boolean; message: string; workingMode: 'single_local' | 'multi_sync'; modeConfirmed: boolean }> {
  const response = await fetch(PROJECT_MODE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectKey: projectManagementConfig.projectKey,
      workingMode
    })
  })
  const data = (await response.json()) as {
    ok?: boolean
    message?: string
    workingMode?: 'single_local' | 'multi_sync'
    modeConfirmed?: boolean
  }
  if (!response.ok || !data.ok) {
    throw new Error(data.message || `set working mode failed: ${response.status}`)
  }
  return {
    ok: Boolean(data.ok),
    message: data.message || '模式已更新',
    workingMode: data.workingMode === 'multi_sync' ? 'multi_sync' : 'single_local',
    modeConfirmed: Boolean(data.modeConfirmed)
  }
}

export async function loadProjectStartupCheck(): Promise<ProjectStartupCheck> {
  const response = await fetch(
    `${PROJECT_STARTUP_CHECK_API}?projectKey=${projectManagementConfig.projectKey}`,
    {
      cache: 'no-store'
    }
  )
  if (!response.ok) {
    throw new Error(`load startup check failed: ${response.status}`)
  }
  const data = (await response.json()) as Partial<ProjectStartupCheck>
  return {
    projectKey: data.projectKey || projectManagementConfig.projectKey,
    checkedAt: typeof data.checkedAt === 'number' ? data.checkedAt : 0,
    severity:
      data.severity === 'success' || data.severity === 'warning' || data.severity === 'error'
        ? data.severity
        : 'warning',
    messages: Array.isArray(data.messages) ? data.messages.map((msg) => String(msg)) : ['启动检查信息不可用'],
    businessRepo: {
      exists: Boolean(data.businessRepo?.exists),
      branch: data.businessRepo?.branch || 'unknown',
      commit: data.businessRepo?.commit || 'unknown',
      remoteUrl: data.businessRepo?.remoteUrl || '',
      dirty: Boolean(data.businessRepo?.dirty),
      ahead: typeof data.businessRepo?.ahead === 'number' ? data.businessRepo.ahead : 0,
      behind: typeof data.businessRepo?.behind === 'number' ? data.businessRepo.behind : 0
    },
    dataRepo: {
      exists: Boolean(data.dataRepo?.exists),
      branch: data.dataRepo?.branch || 'unknown',
      commit: data.dataRepo?.commit || 'unknown',
      remoteUrl: data.dataRepo?.remoteUrl || '',
      dirty: Boolean(data.dataRepo?.dirty),
      ahead: typeof data.dataRepo?.ahead === 'number' ? data.dataRepo.ahead : 0,
      behind: typeof data.dataRepo?.behind === 'number' ? data.dataRepo.behind : 0
    }
  }
}

export async function runProjectControlAction(action: ProjectControlAction): Promise<ProjectControlResult> {
  const response = await fetch(PROJECT_CONTROL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectKey: projectManagementConfig.projectKey,
      action
    })
  })
  if (!response.ok) {
    throw new Error(`control action failed: ${response.status}`)
  }
  const data = (await response.json()) as Partial<ProjectControlResult>
  return {
    ok: Boolean(data.ok),
    action: (data.action as ProjectControlAction) || action,
    message: data.message || '操作完成'
  }
}

async function postProjectDataControl(url: string): Promise<ProjectDataControlResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectKey: projectManagementConfig.projectKey
    })
  })
  const data = (await response.json()) as Partial<ProjectDataControlResult>
  if (!response.ok || !data.ok) {
    throw new Error(data.message || `project data control failed: ${response.status}`)
  }
  return {
    ok: Boolean(data.ok),
    message: data.message || '操作完成',
    changed: typeof data.changed === 'boolean' ? data.changed : undefined
  }
}

export async function syncProjectDataRepo(): Promise<ProjectDataControlResult> {
  return postProjectDataControl(PROJECT_DATA_SYNC_API)
}

export async function backupProjectDataRepo(): Promise<ProjectDataControlResult> {
  return postProjectDataControl(PROJECT_DATA_BACKUP_API)
}

export async function previewProcessLogCleanup(beforeDate: string): Promise<ProcessLogSummary> {
  const response = await fetch(
    `${PROJECT_LOG_SUMMARY_API}?projectKey=${projectManagementConfig.projectKey}&beforeDate=${encodeURIComponent(beforeDate)}`,
    { cache: 'no-store' }
  )
  if (!response.ok) {
    throw new Error(`preview cleanup failed: ${response.status}`)
  }
  const data = (await response.json()) as Partial<ProcessLogSummary>
  return {
    bridge: {
      total: data.bridge?.total || 0,
      removable: data.bridge?.removable || 0
    },
    receipts: {
      total: data.receipts?.total || 0,
      removable: data.receipts?.removable || 0
    }
  }
}

export async function cleanupProcessLogs(beforeDate: string): Promise<ProcessLogCleanupResult> {
  const response = await fetch(PROJECT_LOG_CLEANUP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectKey: projectManagementConfig.projectKey,
      beforeDate,
      confirm: true
    })
  })
  if (!response.ok) {
    throw new Error(`cleanup logs failed: ${response.status}`)
  }
  const data = (await response.json()) as Partial<ProcessLogCleanupResult>
  return {
    bridge: {
      removed: data.bridge?.removed || 0,
      remaining: data.bridge?.remaining || 0,
      revision: data.bridge?.revision || 0
    },
    receipts: {
      removed: data.receipts?.removed || 0,
      remaining: data.receipts?.remaining || 0,
      revision: data.receipts?.revision || 0
    }
  }
}
