import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ruleReviewItems } from '../../../data/rule-review-items'
import { loadNormalizedObjectMap } from '../../../utils/storage-map'
import { projectManagementConfig } from '../../config'
import {
  createDeliveryItem,
  appendDeliveryReceiptToProjectFile,
  backupProjectDataRepo,
  cleanupProcessLogs,
  type DeliveryReceipt,
  type DeliveryDomain,
  type DeliveryHandler,
  type ProjectLinkStatus,
  type ProjectStartupCheck,
  loadProjectLinkStatus,
  loadProjectStartupCheck,
  runProjectControlAction,
  loadProjectContextInfo,
  loadDeliveryItems,
  loadDeliveryItemsFromProjectFile,
  previewProcessLogCleanup,
  saveDeliveryItems,
  saveDeliveryItemsToProjectFile,
  setProjectWorkingMode,
  syncProjectDataRepo,
  type DeliveryItem,
  type DeliveryKind,
  type DeliveryMode,
  type DeliveryStatus
} from '../../api/delivery'
import type { ProjectItemStatus } from '../types'

const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending_ai: ['ai_in_progress', 'blocked'],
  ai_in_progress: ['pending_user_confirm', 'blocked'],
  pending_user_confirm: ['confirmed_done', 'ai_in_progress', 'blocked'],
  confirmed_done: [],
  blocked: ['pending_ai', 'ai_in_progress', 'pending_user_confirm']
}

const PRODUCT_DOMAIN_KEYWORDS = ['手牌', '听牌', '胡牌', '役种', '三麻', '四麻', '番数', '牌局', '麻将']
const MANAGEMENT_DOMAIN_KEYWORDS = ['流程', '看板', '模板', '状态', '日志', '交付', '协作', '确认', '优先级', '项目管理']
const BRIDGE_ENDPOINT = '/__pm_api/bridge'
const ITEMS_ENDPOINT = '/__pm_api/items'
const RECEIPTS_ENDPOINT = '/__pm_api/receipts'
const DELIVERY_DATA_HARDENING_TEMPLATE_ID = 'delivery-data-page-hardening'

interface BridgeEvent {
  id: string
  action: 'update_status' | 'create_item'
  createdAt: number
  actor?: string
  note?: string
  itemId?: string
  toStatus?: DeliveryStatus
  payload?: {
    title?: string
    domain?: DeliveryDomain
    kind?: DeliveryKind
    mode?: DeliveryMode
    status?: DeliveryStatus
    priority?: DeliveryItem['priority']
    handler?: DeliveryHandler
    decisionOwner?: string
    dueDate?: string
    note?: string
    evidence?: string
    risk?: string
    impact?: string
    rollback?: string
  }
}

interface ApiHealthCheckOutcome {
  kind: 'no_update' | 'updated_latest' | 'error'
  message: string
  applied?: number
}

interface ApiEndpointHealth {
  endpoint: 'items' | 'bridge' | 'receipts'
  ok: boolean
  message: string
}

interface BridgeApplyResult {
  ok: boolean
  reason?: string
}

interface BridgeFailureEntry {
  id: string
  action: BridgeEvent['action']
  itemId: string
  title: string
  reason: string
  retryCount: number
  lastTriedAt: number
}

export function useProjectManagement() {
  const domainFilter = ref<'all' | DeliveryDomain>('all')
  const modeFilter = ref<'all' | DeliveryMode>('all')
  const kindFilter = ref<'all' | DeliveryKind>('all')
  const statusFilter = ref<'all' | DeliveryStatus>('all')
  const searchText = ref('')
  const viewMode = ref<'table' | 'kanban'>('table')
  const statusChangeActor = ref('用户')
  const statusChangeNote = ref('')
  const timelineActorFilter = ref('all')
  const timelineStatusFilter = ref<'all' | DeliveryStatus>('all')
  const timelineStartDate = ref('')
  const timelineEndDate = ref('')
  const bridgeReviewNote = ref('')
  const bridgeSyncMessage = ref('未同步')
  const bridgeLastSyncAt = ref<number | null>(null)
  const bridgeSyncing = ref(false)
  const bridgeAppliedIdsStorageKey = `${projectManagementConfig.projectKey}-bridge-applied-ids-v1`
  const deliveryDataHardeningSeededStorageKey =
    `${projectManagementConfig.projectKey}-${DELIVERY_DATA_HARDENING_TEMPLATE_ID}-seeded-v1`
  const deliveryDataHardeningPromotedStorageKey =
    `${projectManagementConfig.projectKey}-${DELIVERY_DATA_HARDENING_TEMPLATE_ID}-promoted-v1`
  const deliveryDataReminderOptimizationRegisteredStorageKey =
    `${projectManagementConfig.projectKey}-delivery-data-reminder-optimization-registered-v1`
  const bridgeAppliedIds = new Set<string>()
  const projectFileSyncMessage = ref('未连接')
  const projectFileReady = ref(false)
  const projectFileRevision = ref(0)
  const projectBranch = ref('unknown')
  const projectCommit = ref('unknown')
  const projectItemsUpdatedAt = ref(0)
  const projectItemsFilePath = ref('')
  const projectLinkStatus = ref<ProjectLinkStatus>({
    linked: false,
    backupReady: false,
    needsUserAction: true,
    needsAiAction: false,
    reason: '未检测',
    businessRepoPath: '',
    managementRepoPath: '',
    managementDataDir: '',
    remoteUrl: '',
    managementBranch: 'unknown',
    managementCommit: 'unknown',
    workingTreeDirty: false,
    ahead: 0,
    behind: 0,
    syncMessage: '未检测同步状态',
    workingMode: 'single_local',
    modeConfirmed: false,
    modeConfirmedAt: 0,
    needsModeConfirmation: false,
    modePromptReason: '',
    integrationBranch: 'develop',
    releaseBranch: ''
  })
  const projectLinkStatusMessage = ref('未检测关联')
  const writeRiskAcknowledged = ref(false)
  const projectStartupCheck = ref<ProjectStartupCheck>({
    projectKey: projectManagementConfig.projectKey,
    checkedAt: 0,
    severity: 'warning',
    messages: ['尚未执行启动检查'],
    businessRepo: {
      exists: true,
      branch: 'unknown',
      commit: 'unknown',
      remoteUrl: '',
      dirty: false,
      ahead: 0,
      behind: 0
    },
    dataRepo: {
      exists: false,
      branch: 'unknown',
      commit: 'unknown',
      remoteUrl: '',
      dirty: false,
      ahead: 0,
      behind: 0
    }
  })
  const apiHealthChecking = ref(false)
  const projectControlLoading = ref(false)
  const projectBootstrapReady = ref(false)
  const dataRepoSyncing = ref(false)
  const dataRepoBackingUp = ref(false)
  const projectControlMessage = ref('未执行')
  const apiHealthSummary = ref('未检测')
  const apiHealthDetails = ref<ApiEndpointHealth[]>([])
  const bridgeFailedEvents = ref<BridgeFailureEntry[]>([])
  const bridgeFailureMap = new Map<string, BridgeFailureEntry>()
  let bridgePollTimer: number | undefined
  let bridgePollBackoffMs = 5000
  let projectFileSaveChain: Promise<void> = Promise.resolve()

  const logCleanupDate = ref('')
  const logCleanupPreview = ref({
    bridgeTotal: 0,
    bridgeRemovable: 0,
    receiptsTotal: 0,
    receiptsRemovable: 0
  })
  const logCleanupLoading = ref(false)
  /** 进程日志全量条数（与清理日期无关），供总览与卡片展示 */
  const processLogInventory = ref({
    bridgeTotal: 0,
    receiptsTotal: 0,
    loaded: false
  })
  const processLogInventoryLoading = ref(false)

  async function refreshProcessLogInventory(): Promise<void> {
    processLogInventoryLoading.value = true
    try {
      const d = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const s = await previewProcessLogCleanup(today)
      processLogInventory.value = {
        bridgeTotal: s.bridge.total,
        receiptsTotal: s.receipts.total,
        loaded: true
      }
    } catch {
      processLogInventory.value = { bridgeTotal: 0, receiptsTotal: 0, loaded: false }
    } finally {
      processLogInventoryLoading.value = false
    }
  }
  async function reconnectProjectFileStorage(): Promise<boolean> {
    try {
      const loadResult = await loadDeliveryItemsFromProjectFile()
      const fileItems = loadResult.items
      projectFileRevision.value = loadResult.revision
      if (fileItems.length > 0) {
        items.value = fileItems
      } else if (items.value.length > 0) {
        const writeResult = await saveDeliveryItemsToProjectFile(items.value, loadResult.revision)
        projectFileRevision.value = writeResult.revision
      }
      projectFileReady.value = true
      projectFileSyncMessage.value = `已连接项目文件存储（rev ${projectFileRevision.value}）`
      return true
    } catch {
      projectFileReady.value = false
      projectFileSyncMessage.value =
        '项目文件不可用（请使用 npm run dev 或 npm run preview），已回退本地存储'
      return false
    }
  }

  async function refreshProjectContext(): Promise<void> {
    try {
      const ctx = await loadProjectContextInfo()
      projectBranch.value = ctx.branch
      projectCommit.value = ctx.commit
      projectItemsUpdatedAt.value = ctx.itemsUpdatedAt
      projectItemsFilePath.value = ctx.itemsFilePath
      if (ctx.itemsRevision > projectFileRevision.value) {
        projectFileRevision.value = ctx.itemsRevision
      }
    } catch {
      // ignore context read error
    }
  }

  async function refreshProjectLinkStatus(): Promise<void> {
    try {
      const status = await loadProjectLinkStatus()
      projectLinkStatus.value = status
      projectLinkStatusMessage.value = status.reason
    } catch {
      projectLinkStatusMessage.value = '关联状态读取失败'
    }
  }

  async function refreshProjectStartupCheck(): Promise<void> {
    try {
      projectStartupCheck.value = await loadProjectStartupCheck()
    } catch {
      projectStartupCheck.value = {
        ...projectStartupCheck.value,
        severity: 'warning',
        messages: ['启动检查读取失败，请先执行 npm run dev 触发 predev 检查']
      }
    }
  }

  async function runProjectControl(
    action: 'startup_check' | 'sync_data_repo' | 'backup_data_repo'
  ): Promise<{ ok: boolean; message: string }> {
    if (projectControlLoading.value) {
      return { ok: false, message: '正在执行中，请稍候' }
    }
    projectControlLoading.value = true
    try {
      const result = await runProjectControlAction(action)
      await refreshProjectStartupCheck()
      await refreshProjectLinkStatus()
      await refreshProjectContext()
      if (action !== 'startup_check') {
        await reconnectProjectFileStorage()
      }
      projectControlMessage.value = result.message
      return { ok: result.ok, message: result.message }
    } catch {
      projectControlMessage.value = '操作失败，请检查网络或仓库状态'
      return { ok: false, message: projectControlMessage.value }
    } finally {
      projectControlLoading.value = false
    }
  }

  async function syncDataRepoByUi(): Promise<{ ok: boolean; message: string }> {
    if (dataRepoSyncing.value) {
      return { ok: false, message: '正在同步，请稍候' }
    }
    dataRepoSyncing.value = true
    try {
      const result = await syncProjectDataRepo()
      await refreshProjectLinkStatus()
      await refreshProjectStartupCheck()
      await refreshProjectContext()
      return { ok: result.ok, message: result.message }
    } catch (error: unknown) {
      return {
        ok: false,
        message: error instanceof Error && error.message ? error.message : '同步失败，请检查数据仓状态'
      }
    } finally {
      dataRepoSyncing.value = false
    }
  }

  async function backupDataRepoByUi(): Promise<{ ok: boolean; message: string }> {
    if (dataRepoBackingUp.value) {
      return { ok: false, message: '正在备份，请稍候' }
    }
    dataRepoBackingUp.value = true
    try {
      const result = await backupProjectDataRepo()
      await refreshProjectLinkStatus()
      await refreshProjectStartupCheck()
      await refreshProjectContext()
      return { ok: result.ok, message: result.message }
    } catch (error: unknown) {
      return {
        ok: false,
        message: error instanceof Error && error.message ? error.message : '备份失败，请检查数据仓状态'
      }
    } finally {
      dataRepoBackingUp.value = false
    }
  }

  async function updateProjectWorkingModeByUi(
    mode: 'single_local' | 'multi_sync'
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const result = await setProjectWorkingMode(mode)
      await refreshProjectLinkStatus()
      return { ok: result.ok, message: result.message }
    } catch (error: unknown) {
      return {
        ok: false,
        message: error instanceof Error && error.message ? error.message : '模式更新失败，请稍后重试'
      }
    }
  }

  const writeLockReason = computed(() => {
    const startup = projectStartupCheck.value
    if (!startup.dataRepo.exists) {
      return '数据仓不存在，已锁定写操作'
    }
    if (startup.dataRepo.behind > 0) {
      return `数据仓落后远端 ${startup.dataRepo.behind} 提交，已锁定写操作`
    }
    if (startup.businessRepo.behind > 0) {
      return `业务仓落后远端 ${startup.businessRepo.behind} 提交，已锁定写操作`
    }
    return ''
  })

  const writeLockRequired = computed(() => Boolean(writeLockReason.value))
  const writeLockActive = computed(() => writeLockRequired.value && !writeRiskAcknowledged.value)

  function unlockWriteWithRiskAck() {
    writeRiskAcknowledged.value = true
  }

  function relockWrites() {
    writeRiskAcknowledged.value = false
  }


  const items = ref<DeliveryItem[]>(loadDeliveryItems())
  const kanbanStatuses: DeliveryStatus[] = [
    'pending_ai',
    'ai_in_progress',
    'blocked',
    'pending_user_confirm',
    'confirmed_done'
  ]
  const handlerOptions: DeliveryHandler[] = ['ai', 'user', 'collab']

  const templates = ref(projectManagementConfig.templates)
  const selectedTemplateId = ref<string>(templates.value[0]?.id || '')

  const draft = reactive<Omit<DeliveryItem, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>>({
    title: '',
    domain: 'product',
    kind: 'todo',
    mode: 'both',
    status: 'pending_ai',
    priority: 'P2',
    handler: 'ai',
    decisionOwner: '',
    dueDate: '',
    note: '',
    evidence: '',
    risk: '',
    impact: '',
    rollback: ''
  })

  watch(
    items,
    () => {
      saveDeliveryItems(items.value)
      if (projectFileReady.value) {
        const snapshot = JSON.parse(JSON.stringify(items.value)) as DeliveryItem[]
        projectFileSaveChain = projectFileSaveChain.then(async () => {
          try {
            const result = await saveDeliveryItemsToProjectFile(snapshot, projectFileRevision.value)
            projectFileRevision.value = result.revision
            projectFileSyncMessage.value = `已写入项目文件（${snapshot.length}条，rev ${result.revision}）`
          } catch (error: unknown) {
            const err = error as { code?: string; currentRevision?: number }
            if (err.code === 'REVISION_CONFLICT') {
              if (typeof err.currentRevision === 'number') {
                projectFileRevision.value = err.currentRevision
              }
              projectFileSyncMessage.value = '检测到并发更新，请点击连接自检同步最新内容'
              return
            }
            projectFileSyncMessage.value = '项目文件写入失败（已保留本地）'
          }
        })
      }
    },
    { deep: true }
  )

  const filteredItems = computed(() => {
    const keyword = searchText.value.trim().toLowerCase()
    return items.value.filter((item) => {
      const domainPass = domainFilter.value === 'all' || item.domain === domainFilter.value
      const modePass = modeFilter.value === 'all' || item.mode === modeFilter.value
      const kindPass = kindFilter.value === 'all' || item.kind === kindFilter.value
      const statusPass = statusFilter.value === 'all' || item.status === statusFilter.value
      const searchPass =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        item.note.toLowerCase().includes(keyword) ||
        item.decisionOwner.toLowerCase().includes(keyword) ||
        item.evidence.toLowerCase().includes(keyword)
      return domainPass && modePass && kindPass && statusPass && searchPass
    })
  })

  const timelineEntries = computed(() => {
    return items.value
      .flatMap((item) =>
        item.statusHistory.map((entry) => ({
          itemId: item.id,
          title: item.title,
          domain: item.domain,
          kind: item.kind,
          mode: item.mode,
          fromStatus: entry.fromStatus as ProjectItemStatus | 'init',
          toStatus: entry.toStatus,
          actor: entry.actor,
          note: entry.note,
          changedAt: entry.changedAt
        }))
      )
      .sort((a, b) => b.changedAt - a.changedAt)
  })

  const timelineActors = computed(() => {
    const actors = new Set<string>()
    timelineEntries.value.forEach((entry) => {
      if (entry.actor.trim()) actors.add(entry.actor.trim())
    })
    return Array.from(actors).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  })

  const filteredTimelineEntries = computed(() => {
    const startTs = timelineStartDate.value
      ? new Date(`${timelineStartDate.value}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY
    const endTs = timelineEndDate.value
      ? new Date(`${timelineEndDate.value}T23:59:59.999`).getTime()
      : Number.POSITIVE_INFINITY

    return timelineEntries.value.filter((entry) => {
      const actorPass = timelineActorFilter.value === 'all' || entry.actor === timelineActorFilter.value
      const statusPass = timelineStatusFilter.value === 'all' || entry.toStatus === timelineStatusFilter.value
      const timePass = entry.changedAt >= startTs && entry.changedAt <= endTs
      return actorPass && statusPass && timePass
    })
  })

  const stats = computed(() => {
    const total = items.value.length
    const done = items.value.filter((i) => i.status === 'confirmed_done').length
    const blocked = items.value.filter((i) => i.status === 'blocked').length
    const inProgress = items.value.filter((i) => i.status === 'ai_in_progress').length
    const waitingUserConfirm = items.value.filter((i) => i.status === 'pending_user_confirm').length
    const completion = total === 0 ? 0 : Math.round((done / total) * 100)
    return { total, done, blocked, inProgress, waitingUserConfirm, completion }
  })

  const pendingUserConfirmItems = computed(() =>
    items.value.filter((item) => item.status === 'pending_user_confirm')
  )

  function loadAppliedBridgeIds() {
    try {
      const raw = localStorage.getItem(bridgeAppliedIdsStorageKey)
      if (!raw) return
      const ids = JSON.parse(raw)
      if (!Array.isArray(ids)) return
      ids.forEach((id) => {
        if (typeof id === 'string') bridgeAppliedIds.add(id)
      })
    } catch {
      // ignore invalid bridge cache
    }
  }

  function saveAppliedBridgeIds() {
    localStorage.setItem(bridgeAppliedIdsStorageKey, JSON.stringify(Array.from(bridgeAppliedIds)))
  }

  function applyBridgeEvent(event: BridgeEvent): BridgeApplyResult {
    if (event.action === 'update_status') {
      if (!event.itemId || !event.toStatus) return { ok: false, reason: '缺少目标条目或状态' }
      const target = items.value.find((item) => item.id === event.itemId)
      if (!target) return { ok: false, reason: '目标条目不存在' }
      const result = updateStatus(target, event.toStatus, {
        actor: event.actor || 'AI',
        note: event.note || 'AI桥接同步'
      })
      return result.ok ? { ok: true } : { ok: false, reason: result.message || '状态流转失败' }
    }

    if (event.action === 'create_item') {
      const payload = event.payload ?? {}
      const title = payload?.title?.trim()
      if (!title) return { ok: false, reason: '缺少标题' }
      items.value.unshift(
        createDeliveryItem({
          title,
          domain: payload.domain || 'product',
          kind: payload.kind || 'todo',
          mode: payload.mode || 'both',
          status: payload.status || 'pending_ai',
          priority: payload.priority || 'P2',
          handler: payload.handler || 'ai',
          decisionOwner: payload.decisionOwner || '',
          dueDate: payload.dueDate || '',
          note: payload.note || event.note || '',
          evidence: payload.evidence || '',
          risk: payload.risk || '',
          impact: payload.impact || '',
          rollback: payload.rollback || ''
        })
      )
      return { ok: true }
    }

    return { ok: false, reason: '未知桥接动作' }
  }

  function upsertBridgeFailure(event: BridgeEvent, reason: string) {
    if (!event.id) return
    const prev = bridgeFailureMap.get(event.id)
    bridgeFailureMap.set(event.id, {
      id: event.id,
      action: event.action,
      itemId: event.itemId || '-',
      title: event.payload?.title?.trim() || event.note?.trim() || '-',
      reason,
      retryCount: (prev?.retryCount || 0) + 1,
      lastTriedAt: Date.now()
    })
    bridgeFailedEvents.value = Array.from(bridgeFailureMap.values()).sort((a, b) => b.lastTriedAt - a.lastTriedAt)
  }

  function clearBridgeFailure(eventId: string) {
    if (!bridgeFailureMap.has(eventId)) return
    bridgeFailureMap.delete(eventId)
    bridgeFailedEvents.value = Array.from(bridgeFailureMap.values()).sort((a, b) => b.lastTriedAt - a.lastTriedAt)
  }

  async function syncBridgeEventsNow(): Promise<{ applied: number; total: number; failed: number }> {
    if (bridgeSyncing.value) return { applied: 0, total: 0, failed: 0 }
    bridgeSyncing.value = true
    try {
      const response = await fetch(
        `${BRIDGE_ENDPOINT}?projectKey=${projectManagementConfig.projectKey}&t=${Date.now()}`,
        { cache: 'no-store' }
      )
      if (!response.ok) {
        bridgeSyncMessage.value = `同步失败：${response.status}`
        return { applied: 0, total: 0, failed: 0 }
      }
      const payload = (await response.json()) as { events?: BridgeEvent[] }
      const events = Array.isArray(payload.events) ? payload.events : []
      const sortedEvents = [...events].sort((a, b) => a.createdAt - b.createdAt)

      let applied = 0
      let failed = 0
      sortedEvents.forEach((event) => {
        if (!event?.id || bridgeAppliedIds.has(event.id)) return
        const result = applyBridgeEvent(event)
        if (result.ok) {
          bridgeAppliedIds.add(event.id)
          clearBridgeFailure(event.id)
          applied++
          return
        }
        failed++
        upsertBridgeFailure(event, result.reason || '应用失败')
      })
      saveAppliedBridgeIds()
      bridgeLastSyncAt.value = Date.now()
      if (failed > 0) {
        bridgeSyncMessage.value = `同步完成：成功 ${applied} 条，失败 ${failed} 条`
      } else {
        bridgeSyncMessage.value = applied > 0 ? `已同步 ${applied} 条桥接事件` : '已同步（无新事件）'
      }
      return { applied, total: sortedEvents.length, failed }
    } catch {
      bridgeSyncMessage.value = '同步失败：桥接文件不可用'
      return { applied: 0, total: 0, failed: 0 }
    } finally {
      bridgeSyncing.value = false
    }
  }

  async function runProjectApiHealthChecks(): Promise<{ results: ApiEndpointHealth[]; okCount: number }> {
    const checks: {
      endpoint: 'items' | 'bridge' | 'receipts'
      url: string
    }[] = [
      {
        endpoint: 'items',
        url: `${ITEMS_ENDPOINT}?projectKey=${projectManagementConfig.projectKey}&t=${Date.now()}`
      },
      {
        endpoint: 'bridge',
        url: `${BRIDGE_ENDPOINT}?projectKey=${projectManagementConfig.projectKey}&t=${Date.now()}`
      },
      {
        endpoint: 'receipts',
        url: `${RECEIPTS_ENDPOINT}?projectKey=${projectManagementConfig.projectKey}&t=${Date.now()}`
      }
    ]

    const results = await Promise.all(
      checks.map(async (check) => {
        try {
          const response = await fetch(check.url, { cache: 'no-store' })
          if (!response.ok) {
            return {
              endpoint: check.endpoint,
              ok: false,
              message: `HTTP ${response.status}`
            }
          }
          await response.json()
          return {
            endpoint: check.endpoint,
            ok: true,
            message: 'OK'
          }
        } catch {
          return {
            endpoint: check.endpoint,
            ok: false,
            message: '请求失败'
          }
        }
      })
    )

    apiHealthDetails.value = results
    const okCount = results.filter((r) => r.ok).length
    apiHealthSummary.value = okCount === results.length ? '全部可用' : `异常 ${results.length - okCount} 项`
    return { results, okCount }
  }

  async function checkProjectFileApiOnly(): Promise<{ ok: boolean; message: string }> {
    if (apiHealthChecking.value) {
      return { ok: false, message: '正在执行连接自检，请稍候' }
    }
    apiHealthChecking.value = true
    try {
      const { results, okCount } = await runProjectApiHealthChecks()
      if (okCount === results.length) {
        return { ok: true, message: '连接自检通过（仅检查，不触发同步）' }
      }
      return { ok: false, message: `连接自检异常：${results.length - okCount} 项失败` }
    } finally {
      apiHealthChecking.value = false
    }
  }

  async function checkProjectFileApiHealth(): Promise<ApiHealthCheckOutcome> {
    if (apiHealthChecking.value) {
      return {
        kind: 'no_update',
        message: '正在执行连接自检，请稍候'
      }
    }
    apiHealthChecking.value = true
    try {
      const { results, okCount } = await runProjectApiHealthChecks()
      if (okCount === results.length) {
        const reconnected = await reconnectProjectFileStorage()
        if (reconnected) {
          await refreshProjectContext()
          await refreshProjectLinkStatus()
          await refreshProjectStartupCheck()
          const syncResult = await syncBridgeEventsNow()
          if (syncResult.applied > 0) {
            return {
              kind: 'updated_latest',
              message: `有内容更新，已同步 ${syncResult.applied} 条并更新到最新`,
              applied: syncResult.applied
            }
          }
          return {
            kind: 'no_update',
            message: '无内容更新，当前已是最新'
          }
        }
        return {
          kind: 'error',
          message: '更新异常：项目文件重连失败'
        }
      }
      return {
        kind: 'error',
        message: `更新异常：连接自检存在 ${results.length - okCount} 项异常`
      }
    } finally {
      apiHealthChecking.value = false
    }
  }

  function detectDomainMismatchWarning(title: string, domain: DeliveryDomain): string | undefined {
    const content = title.trim()
    if (!content) return undefined
    const hitProduct = PRODUCT_DOMAIN_KEYWORDS.some((keyword) => content.includes(keyword))
    const hitManagement = MANAGEMENT_DOMAIN_KEYWORDS.some((keyword) => content.includes(keyword))

    if (domain === 'management' && hitProduct) {
      return '该标题更像“项目业务需求”，建议检查目标对象是否应改为「项目业务需求」。'
    }
    if (domain === 'product' && hitManagement) {
      return '该标题更像“项目管理优化”，建议检查目标对象是否应改为「项目管理优化」。'
    }
    return undefined
  }

  function addItem(): { ok: boolean; warning?: string } {
    const title = draft.title.trim()
    if (!title) return { ok: false }
    const warning = detectDomainMismatchWarning(title, draft.domain)
    items.value.unshift(
      createDeliveryItem({
        ...draft,
        title
      })
    )
    draft.title = ''
    draft.note = ''
    draft.evidence = ''
    return { ok: true, warning }
  }

  function canTransitionStatus(from: DeliveryStatus, to: DeliveryStatus): boolean {
    if (from === to) return true
    return STATUS_TRANSITIONS[from].includes(to)
  }

  function getAvailableStatuses(from: DeliveryStatus): DeliveryStatus[] {
    return [from, ...STATUS_TRANSITIONS[from]]
  }

  function updateStatus(
    item: DeliveryItem,
    status: DeliveryStatus,
    options?: { actor?: string; note?: string }
  ): { ok: boolean; message?: string; fromStatus?: DeliveryStatus; toStatus?: DeliveryStatus } {
    if (!canTransitionStatus(item.status, status)) {
      return { ok: false, message: `状态不允许从「${item.status}」流转到「${status}」` }
    }
    const now = Date.now()
    const fromStatus = item.status
    item.status = status
    item.updatedAt = now
    item.statusHistory.push({
      fromStatus,
      toStatus: status,
      actor: options?.actor?.trim() || statusChangeActor.value.trim() || '用户',
      note: options?.note ?? statusChangeNote.value.trim(),
      changedAt: now
    })
    if (!options?.note) {
      statusChangeNote.value = ''
    }
    return { ok: true, fromStatus, toStatus: status }
  }

  function appendReceipt(
    item: DeliveryItem,
    action: DeliveryReceipt['action'],
    operator: string,
    note: string,
    fromStatus: DeliveryStatus,
    toStatus: DeliveryStatus
  ) {
    const receipt: DeliveryReceipt = {
      id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemId: item.id,
      action,
      operator,
      note,
      statusFrom: fromStatus,
      statusTo: toStatus,
      createdAt: Date.now()
    }
    void appendDeliveryReceiptToProjectFile(receipt)
  }

  function submitByAiForUserConfirm(item: DeliveryItem, note?: string): { ok: boolean; message?: string } {
    const finalNote = note || 'AI提交用户确认'
    const result = updateStatus(item, 'pending_user_confirm', {
      actor: 'AI',
      note: finalNote
    })
    if (result.ok && result.fromStatus && result.toStatus) {
      appendReceipt(item, 'ai_submit_for_confirm', 'AI', finalNote, result.fromStatus, result.toStatus)
    }
    return result
  }

  function userConfirmDelivery(item: DeliveryItem, note?: string): { ok: boolean; message?: string } {
    const finalNote = note || '用户确认通过'
    const result = updateStatus(item, 'confirmed_done', {
      actor: '用户',
      note: finalNote
    })
    if (result.ok && result.fromStatus && result.toStatus) {
      appendReceipt(item, 'user_confirm', '用户', finalNote, result.fromStatus, result.toStatus)
    }
    return result
  }

  function userRejectDelivery(item: DeliveryItem, note?: string): { ok: boolean; message?: string } {
    const finalNote = note || '用户打回AI继续处理'
    const result = updateStatus(item, 'ai_in_progress', {
      actor: '用户',
      note: finalNote
    })
    if (result.ok && result.fromStatus && result.toStatus) {
      appendReceipt(item, 'user_reject', '用户', finalNote, result.fromStatus, result.toStatus)
    }
    return result
  }

  function removeItem(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function restoreItem(item: DeliveryItem, atIndex = 0) {
    const safeIndex = Math.max(0, Math.min(atIndex, items.value.length))
    items.value.splice(safeIndex, 0, item)
  }

  function groupedItemsByStatus(status: DeliveryStatus): DeliveryItem[] {
    return filteredItems.value.filter((item) => item.status === status)
  }

  function importAcceptedRuleReviewItems(): number {
    const decisionMap = loadNormalizedObjectMap<{ value: string; note: string; reference: string }>(
      'majsoul_rule_review_decisions_v1',
      (id) => id
    )
    const existingTitles = new Set(items.value.map((i) => i.title))
    let created = 0

    for (const review of ruleReviewItems) {
      const decision = decisionMap[review.id]
      if (!decision || decision.value !== 'accept') continue
      const title = `规则复核：${review.title}`
      if (existingTitles.has(title)) continue

      items.value.unshift(
        createDeliveryItem({
          title,
          domain: 'product',
          kind: 'requirement',
          mode: review.mode,
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: [review.question, decision.note].filter(Boolean).join('\n'),
          evidence: decision.reference || '',
          risk: '',
          impact: '',
          rollback: ''
        })
      )
      created++
    }
    return created
  }

  function importTemplateItems(): { count: number; name?: string } {
    const template = templates.value.find((t) => t.id === selectedTemplateId.value)
    if (!template) return { count: 0 }

    const existingKeys = new Set(items.value.map((i) => `${i.kind}-${i.title}`))
    const toInsert = template.items
      .map((draftItem) => createDeliveryItem(draftItem))
      .filter((item) => !existingKeys.has(`${item.kind}-${item.title}`))

    if (toInsert.length > 0) {
      items.value.unshift(...toInsert)
    }
    return { count: toInsert.length, name: template.name }
  }

  function ensureDeliveryDataHardeningBacklogSeeded(): number {
    try {
      if (localStorage.getItem(deliveryDataHardeningSeededStorageKey) === '1') {
        return 0
      }
    } catch {
      // ignore localStorage read error
    }

    const template = templates.value.find((t) => t.id === DELIVERY_DATA_HARDENING_TEMPLATE_ID)
    if (!template) return 0

    const existingKeys = new Set(items.value.map((i) => `${i.kind}-${i.title}`))
    const toInsert = template.items
      .map((draftItem) => createDeliveryItem(draftItem))
      .filter((item) => !existingKeys.has(`${item.kind}-${item.title}`))

    if (toInsert.length > 0) {
      items.value.unshift(...toInsert)
    }

    try {
      localStorage.setItem(deliveryDataHardeningSeededStorageKey, '1')
    } catch {
      // ignore localStorage write error
    }
    return toInsert.length
  }

  function ensureDeliveryDataHardeningTasksInProgress(): number {
    try {
      if (localStorage.getItem(deliveryDataHardeningPromotedStorageKey) === '1') {
        return 0
      }
    } catch {
      // ignore localStorage read error
    }

    const template = templates.value.find((t) => t.id === DELIVERY_DATA_HARDENING_TEMPLATE_ID)
    if (!template) return 0
    const targetKeys = new Set(template.items.map((item) => `${item.kind}-${item.title}`))
    let promoted = 0

    items.value.forEach((item) => {
      const key = `${item.kind}-${item.title}`
      if (!targetKeys.has(key)) return
      if (item.status !== 'pending_ai') return
      const result = updateStatus(item, 'ai_in_progress', {
        actor: 'AI',
        note: '优化任务已启动执行（自动推进）'
      })
      if (result.ok) {
        promoted++
      }
    })

    try {
      localStorage.setItem(deliveryDataHardeningPromotedStorageKey, '1')
    } catch {
      // ignore localStorage write error
    }
    return promoted
  }

  function ensureDeferredReminderOptimizationBacklogRegistered(): number {
    try {
      if (localStorage.getItem(deliveryDataReminderOptimizationRegisteredStorageKey) === '1') {
        return 0
      }
    } catch {
      // ignore localStorage read error
    }

    const title = '【低优先】全局提醒降噪与双模式策略细化'
    const exists = items.value.some((item) => item.title === title && item.kind === 'requirement')
    if (!exists) {
      items.value.unshift(
        createDeliveryItem({
          title,
          domain: 'management',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P3',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '先登记需求，不立即落地：仅在必要时全局提醒；增加今日免打扰、提醒节流与模式确认优化。',
          evidence: '',
          risk: '提醒过多会造成打扰，提醒过少会导致用户不知何时处理',
          impact: '影响非程序员用户对数据管理功能的理解和使用效率',
          rollback: '保留现有提醒策略，后续按AB或灰度逐步调整'
        })
      )
    }

    try {
      localStorage.setItem(deliveryDataReminderOptimizationRegisteredStorageKey, '1')
    } catch {
      // ignore localStorage write error
    }
    return exists ? 0 : 1
  }

  function exportSnapshot() {
    const payload = {
      projectKey: projectManagementConfig.projectKey,
      projectName: projectManagementConfig.projectName,
      exportedAt: new Date().toISOString(),
      stats: stats.value,
      filters: {
        domain: domainFilter.value,
        mode: modeFilter.value,
        kind: kindFilter.value,
        status: statusFilter.value
      },
      items: filteredItems.value
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `${projectManagementConfig.projectKey}-delivery-snapshot-${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function exportTimeline(format: 'json' | 'csv') {
    const date = new Date().toISOString().slice(0, 10)
    const baseName = `${projectManagementConfig.projectKey}-timeline-${date}`

    if (format === 'json') {
      const payload = {
        projectKey: projectManagementConfig.projectKey,
        projectName: projectManagementConfig.projectName,
        exportedAt: new Date().toISOString(),
        filters: {
          actor: timelineActorFilter.value,
          toStatus: timelineStatusFilter.value,
          startDate: timelineStartDate.value,
          endDate: timelineEndDate.value
        },
        total: timelineEntries.value.length,
        count: filteredTimelineEntries.value.length,
        entries: filteredTimelineEntries.value
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return
    }

    const headers = ['时间', '操作者', '标题', '目标对象', '类型', '模式', '前状态', '后状态', '备注']
    const rows = filteredTimelineEntries.value.map((entry) => [
      new Date(entry.changedAt).toISOString(),
      entry.actor,
      entry.title,
      entry.domain,
      entry.kind,
      entry.mode,
      entry.fromStatus,
      entry.toStatus,
      entry.note
    ])
    const escapeCell = (value: unknown): string => {
      const text = String(value ?? '')
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function previewLogCleanup(): Promise<boolean> {
    if (!logCleanupDate.value) return false
    logCleanupLoading.value = true
    try {
      const summary = await previewProcessLogCleanup(logCleanupDate.value)
      logCleanupPreview.value = {
        bridgeTotal: summary.bridge.total,
        bridgeRemovable: summary.bridge.removable,
        receiptsTotal: summary.receipts.total,
        receiptsRemovable: summary.receipts.removable
      }
      return true
    } catch {
      return false
    } finally {
      logCleanupLoading.value = false
    }
  }

  async function runLogCleanupWithConfirm(): Promise<{
    ok: boolean
    bridgeRemoved: number
    receiptsRemoved: number
  }> {
    if (!logCleanupDate.value) {
      return { ok: false, bridgeRemoved: 0, receiptsRemoved: 0 }
    }
    logCleanupLoading.value = true
    try {
      const result = await cleanupProcessLogs(logCleanupDate.value)
      await syncBridgeEventsNow()
      await refreshProcessLogInventory()
      return {
        ok: true,
        bridgeRemoved: result.bridge.removed,
        receiptsRemoved: result.receipts.removed
      }
    } catch {
      return { ok: false, bridgeRemoved: 0, receiptsRemoved: 0 }
    } finally {
      logCleanupLoading.value = false
    }
  }

  function clearBridgePollTimer() {
    if (bridgePollTimer !== undefined) {
      window.clearTimeout(bridgePollTimer)
      bridgePollTimer = undefined
    }
  }

  function scheduleBridgePolling(delayMs?: number) {
    if (document.hidden) return
    clearBridgePollTimer()
    const wait = typeof delayMs === 'number' ? delayMs : bridgePollBackoffMs
    bridgePollTimer = window.setTimeout(() => {
      void (async () => {
        const result = await syncBridgeEventsNow()
        await refreshProjectContext()
        await refreshProjectLinkStatus()
        await refreshProjectStartupCheck()
        bridgePollBackoffMs = result.applied > 0 || result.failed > 0 ? 5000 : Math.min(30000, bridgePollBackoffMs * 2)
        scheduleBridgePolling()
      })()
    }, wait)
  }

  function onVisibilityChange() {
    if (document.hidden) {
      clearBridgePollTimer()
      return
    }
    bridgePollBackoffMs = 5000
    scheduleBridgePolling(0)
  }

  onMounted(() => {
    void (async () => {
      await reconnectProjectFileStorage()
      await refreshProjectContext()
      await refreshProjectLinkStatus()
      await refreshProjectStartupCheck()
      loadAppliedBridgeIds()
      await syncBridgeEventsNow()
      await refreshProcessLogInventory()
      ensureDeliveryDataHardeningBacklogSeeded()
      ensureDeliveryDataHardeningTasksInProgress()
      ensureDeferredReminderOptimizationBacklogRegistered()
      bridgePollBackoffMs = 5000
      scheduleBridgePolling()
      projectBootstrapReady.value = true
    })()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  watch(
    writeLockRequired,
    (required) => {
      if (!required) {
        writeRiskAcknowledged.value = false
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    clearBridgePollTimer()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    projectName: projectManagementConfig.projectName,
    labels: projectManagementConfig.labels,
    handlerOptions,
    domainFilter,
    modeFilter,
    kindFilter,
    statusFilter,
    statusChangeActor,
    statusChangeNote,
    timelineActorFilter,
    timelineStatusFilter,
    timelineStartDate,
    timelineEndDate,
    bridgeReviewNote,
    bridgeSyncMessage,
    bridgeLastSyncAt,
    bridgeSyncing,
    bridgeFailedEvents,
    projectFileSyncMessage,
    projectFileReady,
    projectBranch,
    projectCommit,
    projectItemsUpdatedAt,
    projectItemsFilePath,
    projectLinkStatus,
    projectLinkStatusMessage,
    projectStartupCheck,
    projectControlLoading,
    projectBootstrapReady,
    dataRepoSyncing,
    dataRepoBackingUp,
    projectControlMessage,
    writeLockReason,
    writeLockRequired,
    writeLockActive,
    apiHealthChecking,
    apiHealthSummary,
    apiHealthDetails,
    timelineActors,
    searchText,
    viewMode,
    items,
    kanbanStatuses,
    templates,
    selectedTemplateId,
    draft,
    filteredItems,
    timelineEntries,
    filteredTimelineEntries,
    stats,
    pendingUserConfirmItems,
    logCleanupDate,
    logCleanupPreview,
    logCleanupLoading,
    processLogInventory,
    processLogInventoryLoading,
    refreshProcessLogInventory,
    addItem,
    updateStatus,
    canTransitionStatus,
    getAvailableStatuses,
    submitByAiForUserConfirm,
    userConfirmDelivery,
    userRejectDelivery,
    removeItem,
    restoreItem,
    groupedItemsByStatus,
    importAcceptedRuleReviewItems,
    importTemplateItems,
    exportSnapshot,
    exportTimeline,
    syncBridgeEventsNow,
    checkProjectFileApiHealth,
    checkProjectFileApiOnly,
    refreshProjectContext,
    refreshProjectLinkStatus,
    refreshProjectStartupCheck,
    runProjectControl,
    syncDataRepoByUi,
    backupDataRepoByUi,
    updateProjectWorkingModeByUi,
    unlockWriteWithRiskAck,
    relockWrites,
    previewLogCleanup,
    runLogCleanupWithConfirm
  }
}
