<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Check,
  DataAnalysis,
  DataBoard,
  InfoFilled,
  Operation,
  Reading,
  Refresh,
  UploadFilled,
  Warning,
  Monitor,
  Share
} from '@element-plus/icons-vue'
import { useProjectManagement } from '../core'
import type { DataRepoRemoteBranchStatusResult } from '../api/delivery'
import {
  checkoutDataRepoBranch,
  fetchDataRepoBranchList,
  fetchDataRepoRemoteBranchStatus,
  initDataRepoRemoteBranches,
  mergeDataRepoToIntegrationBranch,
  pushDataRepoCurrentBranch,
  saveDataRepoBranchConvention
} from '../api/delivery'

type ProjectManagementUiControls = {
  dataRepoSyncing?: { value: boolean }
  dataRepoBackingUp?: { value: boolean }
  syncDataRepoByUi?: () => Promise<{ ok: boolean; message: string }>
  backupDataRepoByUi?: () => Promise<{ ok: boolean; message: string }>
  updateProjectWorkingModeByUi?: (mode: 'single_local' | 'multi_sync') => Promise<{ ok: boolean; message: string }>
}

const {
  projectName,
  projectBootstrapReady,
  projectFileReady,
  projectBranch,
  projectCommit,
  projectItemsUpdatedAt,
  projectItemsFilePath,
  projectLinkStatus,
  projectStartupCheck,
  apiHealthChecking,
  apiHealthSummary,
  apiHealthDetails,
  projectControlLoading,
  projectControlMessage,
  runProjectControl,
  checkProjectFileApiOnly,
  checkProjectFileApiHealth,
  refreshProjectContext,
  refreshProjectLinkStatus,
  refreshProjectStartupCheck,
  logCleanupDate,
  logCleanupPreview,
  logCleanupLoading,
  processLogInventory,
  processLogInventoryLoading,
  refreshProcessLogInventory,
  previewLogCleanup,
  runLogCleanupWithConfirm,
  dataRepoSyncing: rawDataRepoSyncing,
  dataRepoBackingUp: rawDataRepoBackingUp,
  syncDataRepoByUi: rawSyncDataRepoByUi,
  backupDataRepoByUi: rawBackupDataRepoByUi,
  updateProjectWorkingModeByUi: rawUpdateProjectWorkingModeByUi
} = useProjectManagement() as ReturnType<typeof useProjectManagement> & ProjectManagementUiControls

const dataRepoSyncing = rawDataRepoSyncing ?? projectControlLoading
const dataRepoBackingUp = rawDataRepoBackingUp ?? projectControlLoading
const syncDataRepoByUi = rawSyncDataRepoByUi ?? (async () => runProjectControl('sync_data_repo'))
const backupDataRepoByUi = rawBackupDataRepoByUi ?? (async () => runProjectControl('backup_data_repo'))
const updateProjectWorkingModeByUi = rawUpdateProjectWorkingModeByUi ?? (async () => ({ ok: false, message: '模式切换不可用' }))
const selectedWorkingMode = ref<'single_local' | 'multi_sync'>('single_local')
const summaryRefreshLoading = ref(false)
const uiReady = ref(false)

/** 单机模式折叠多设备运维卡片（分支/同步/备份），仅隐藏不卸载，便于切换模式试验 */
const showMultiDeviceDmPanels = computed(() => projectLinkStatus.value.workingMode === 'multi_sync')

type DmSectionKey = 'mode' | 'env' | 'compare' | 'branch' | 'sync' | 'backup' | 'system' | 'logs'

/** 带圈序号：多设备为 ①–⑧；单机折叠 ④⑤⑥ 后，可见项顺排为 ①②③④⑤（隐藏卡仍保留原 ④⑤⑥ 文案，避免切模式时跳动） */
function dmSectionGlyph(key: DmSectionKey): string {
  const multi = projectLinkStatus.value.workingMode === 'multi_sync'
  if (multi) {
    const full: Record<DmSectionKey, string> = {
      mode: '①',
      env: '②',
      compare: '③',
      branch: '④',
      sync: '⑤',
      backup: '⑥',
      system: '⑦',
      logs: '⑧'
    }
    return full[key]
  }
  const compact: Record<DmSectionKey, string> = {
    mode: '①',
    env: '②',
    compare: '③',
    branch: '④',
    sync: '⑤',
    backup: '⑥',
    system: '④',
    logs: '⑤'
  }
  return compact[key]
}

watch(
  () => uiReady.value,
  (ready) => {
    if (ready) void refreshProcessLogInventory()
  }
)

async function refreshDataSummary(): Promise<void> {
  summaryRefreshLoading.value = true
  try {
    await refreshProjectStartupCheck()
    await refreshProjectLinkStatus()
    await refreshProjectContext()
    await refreshProcessLogInventory()
  } finally {
    summaryRefreshLoading.value = false
  }
}

const dataRepoBranchesList = ref<string[]>([])
const dataRepoBranchSelect = ref('')
const dataRepoBranchListLoading = ref(false)
const dataRepoBranchOpLoading = ref(false)
const integrationBranchDraft = ref('develop')
const releaseBranchDraft = ref('')
const dataRepoRemoteStatus = ref<DataRepoRemoteBranchStatusResult | null>(null)
const dataRepoRemoteStatusLoading = ref(false)
const dataRepoRemoteStatusError = ref('')

const dataRepoRemoteStatusNeedsInit = computed(() => {
  const s = dataRepoRemoteStatus.value
  if (!s) return false
  if (!s.integrationExists) return true
  const rb = (s.releaseBranch || '').trim()
  if (rb && s.releaseExists === false) return true
  return false
})

/** 与下方编号卡片 id 对应，供顶层状态卡点击滚动 */
const DM_ANCHOR = {
  recovery: 'dm-anchor-recovery',
  mode: 'dm-anchor-mode',
  env: 'dm-anchor-env',
  compare: 'dm-anchor-compare',
  branch: 'dm-anchor-branch',
  sync: 'dm-anchor-sync',
  backup: 'dm-anchor-backup',
  system: 'dm-anchor-system',
  logs: 'dm-anchor-logs'
} as const

type DmOverviewSeverity = 'success' | 'warning' | 'danger' | 'info'

type DmOverviewItem = {
  anchor: string
  title: string
  severity: DmOverviewSeverity
  hint: string
}

/** 状态总览：紧凑符号 + tooltip 全文；布局为「状态置顶居中 + 标题 + 说明」 */
function overviewStatusTooltip(severity: DmOverviewSeverity): string {
  if (severity === 'success') return '正常'
  if (severity === 'info') return '待定'
  if (severity === 'warning') return '提醒'
  return '异常'
}

function overviewStatusGlyph(severity: DmOverviewSeverity): string {
  if (severity === 'success') return '✓'
  if (severity === 'info') return '·'
  if (severity === 'warning') return '!'
  return '×'
}

function maxStepSeverity(keys: string[]): 'ok' | 'warn' | 'error' {
  const steps = pipelineSteps.value.filter((s) => keys.includes(s.key))
  if (steps.some((s) => s.status === 'error')) return 'error'
  if (steps.some((s) => s.status === 'warn')) return 'warn'
  return 'ok'
}

function stepSeverityToOverview(s: 'ok' | 'warn' | 'error'): DmOverviewSeverity {
  if (s === 'error') return 'danger'
  if (s === 'warn') return 'warning'
  return 'success'
}

const dmOverviewItems = computed<DmOverviewItem[]>(() => {
  const ls = projectLinkStatus.value
  const su = projectStartupCheck.value
  const items: DmOverviewItem[] = []

  if (recoveryState.value) {
    items.push({
      anchor: DM_ANCHOR.recovery,
      title: '操作恢复',
      severity: 'danger',
      hint: '同步/备份曾失败，需处理'
    })
  }

  if (showModeOnboarding.value) {
    items.push({
      anchor: DM_ANCHOR.mode,
      title: `${dmSectionGlyph('mode')} 模式与路径`,
      severity: 'warning',
      hint: '请确认工作模式'
    })
  } else if (!ls.managementRepoPath) {
    items.push({
      anchor: DM_ANCHOR.mode,
      title: `${dmSectionGlyph('mode')} 模式与路径`,
      severity: 'danger',
      hint: '数据仓路径未配置'
    })
  } else {
    items.push({
      anchor: DM_ANCHOR.mode,
      title: `${dmSectionGlyph('mode')} 模式与路径`,
      severity: 'success',
      hint: '路径已配置'
    })
  }

  {
    const envSev = maxStepSeverity(['delivery_file', 'link', 'api'])
    items.push({
      anchor: DM_ANCHOR.env,
      title: `${dmSectionGlyph('env')} 环境与连接`,
      severity: stepSeverityToOverview(envSev),
      hint: envSev === 'ok' ? '项目文件、双仓关联、接口均正常' : '项目文件、双仓关联或接口需检查'
    })
  }

  if (!ls.linked || !ls.managementRepoPath) {
    items.push({
      anchor: DM_ANCHOR.compare,
      title: `${dmSectionGlyph('compare')} 双仓对照`,
      severity: 'danger',
      hint: '未完成双仓关联'
    })
  } else if (!ls.backupReady) {
    items.push({
      anchor: DM_ANCHOR.compare,
      title: `${dmSectionGlyph('compare')} 双仓对照`,
      severity: 'warning',
      hint: '数据仓未配置远端仓库'
    })
  } else {
    items.push({
      anchor: DM_ANCHOR.compare,
      title: `${dmSectionGlyph('compare')} 双仓对照`,
      severity: 'success',
      hint: '双仓配置与远端已就绪'
    })
  }

  if (ls.workingMode === 'multi_sync') {
    if (!ls.managementRepoPath || !ls.backupReady) {
      items.push({
        anchor: DM_ANCHOR.branch,
        title: `${dmSectionGlyph('branch')} 数据仓分支（PM）`,
        severity: 'info',
        hint: '需先完成双仓关联并配置远端'
      })
    } else if (dataRepoRemoteStatusError.value) {
      items.push({
        anchor: DM_ANCHOR.branch,
        title: `${dmSectionGlyph('branch')} 数据仓分支（PM）`,
        severity: 'danger',
        hint:
          dataRepoRemoteStatusError.value.length > 40
            ? `${dataRepoRemoteStatusError.value.slice(0, 40)}…`
            : dataRepoRemoteStatusError.value
      })
    } else if (dataRepoRemoteStatusLoading.value) {
      items.push({
        anchor: DM_ANCHOR.branch,
        title: `${dmSectionGlyph('branch')} 数据仓分支（PM）`,
        severity: 'info',
        hint: '正在检查远端约定分支…'
      })
    } else if (dataRepoRemoteStatusNeedsInit.value) {
      items.push({
        anchor: DM_ANCHOR.branch,
        title: `${dmSectionGlyph('branch')} 数据仓分支（PM）`,
        severity: 'warning',
        hint: '协作主分支尚未在远端创建，需初始化'
      })
    } else {
      items.push({
        anchor: DM_ANCHOR.branch,
        title: `${dmSectionGlyph('branch')} 数据仓分支（PM）`,
        severity: 'success',
        hint: '远端约定分支已就绪'
      })
    }

    if (syncButtonDisabledReason.value) {
      items.push({
        anchor: DM_ANCHOR.sync,
        title: `${dmSectionGlyph('sync')} 数据同步`,
        severity: 'danger',
        hint: syncButtonDisabledReason.value
      })
    } else if (ls.behind > 0) {
      items.push({
        anchor: DM_ANCHOR.sync,
        title: `${dmSectionGlyph('sync')} 数据同步`,
        severity: 'warning',
        hint: `本地落后远端 ${ls.behind} 次提交`
      })
    } else {
      items.push({
        anchor: DM_ANCHOR.sync,
        title: `${dmSectionGlyph('sync')} 数据同步`,
        severity: 'success',
        hint: '已对齐，可同步'
      })
    }

    if (backupButtonDisabledReason.value) {
      items.push({
        anchor: DM_ANCHOR.backup,
        title: `${dmSectionGlyph('backup')} 备份到 GitHub`,
        severity: 'danger',
        hint: backupButtonDisabledReason.value
      })
    } else if (ls.ahead > 0 || ls.workingTreeDirty) {
      items.push({
        anchor: DM_ANCHOR.backup,
        title: `${dmSectionGlyph('backup')} 备份到 GitHub`,
        severity: 'warning',
        hint: ls.ahead > 0 ? `本地领先 ${ls.ahead} 次，建议推送` : '有未提交改动，建议备份'
      })
    } else {
      items.push({
        anchor: DM_ANCHOR.backup,
        title: `${dmSectionGlyph('backup')} 备份到 GitHub`,
        severity: 'success',
        hint: '暂无待推送内容'
      })
    }
  }

  if (su.severity === 'error') {
    items.push({
      anchor: DM_ANCHOR.system,
      title: `${dmSectionGlyph('system')} 系统状态`,
      severity: 'danger',
      hint: '启动检查发现需先处理的问题'
    })
  } else if (su.severity === 'warning') {
    items.push({
      anchor: DM_ANCHOR.system,
      title: `${dmSectionGlyph('system')} 系统状态`,
      severity: 'warning',
      hint: '启动检查有需关注的提醒'
    })
  } else {
    items.push({
      anchor: DM_ANCHOR.system,
      title: `${dmSectionGlyph('system')} 系统状态`,
      severity: 'success',
      hint: '启动检查通过'
    })
  }

  {
    const inv = processLogInventory.value
    const invLoading = processLogInventoryLoading.value
    if (invLoading && !inv.loaded) {
      items.push({
        anchor: DM_ANCHOR.logs,
        title: `${dmSectionGlyph('logs')} 日志维护`,
        severity: 'info',
        hint: '正在加载日志条数…'
      })
    } else if (!inv.loaded) {
      items.push({
        anchor: DM_ANCHOR.logs,
        title: `${dmSectionGlyph('logs')} 日志维护`,
        severity: 'info',
        hint: '日志条数未加载，可点「刷新全部状态」重试'
      })
    } else {
      const total = inv.bridgeTotal + inv.receiptsTotal
      if (total === 0) {
        items.push({
          anchor: DM_ANCHOR.logs,
          title: `${dmSectionGlyph('logs')} 日志维护`,
          severity: 'success',
          hint: '暂无进程日志'
        })
      } else if (total >= 8000) {
        items.push({
          anchor: DM_ANCHOR.logs,
          title: `${dmSectionGlyph('logs')} 日志维护`,
          severity: 'warning',
          hint: `约 ${total} 条（桥 ${inv.bridgeTotal} + 回执 ${inv.receiptsTotal}），建议择机清理`
        })
      } else if (total >= 800) {
        items.push({
          anchor: DM_ANCHOR.logs,
          title: `${dmSectionGlyph('logs')} 日志维护`,
          severity: 'info',
          hint: `约 ${total} 条，可按日期预览后清理`
        })
      } else {
        items.push({
          anchor: DM_ANCHOR.logs,
          title: `${dmSectionGlyph('logs')} 日志维护`,
          severity: 'success',
          hint: `约 ${total} 条，量较少可暂不必清理`
        })
      }
    }
  }

  return items
})

const dmOverviewAllGreen = computed(() =>
  dmOverviewItems.value.every((i) => i.severity === 'success' || i.severity === 'info')
)

const dmOverviewProblemCount = computed(
  () => dmOverviewItems.value.filter((i) => i.severity === 'warning' || i.severity === 'danger').length
)

const highlightedDmAnchor = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | undefined

/** 进入本页且引导就绪后，自动跑一次与「探测连接」相同的检查，避免每次刷新都停留在「未检测」 */
watch(
  () => projectBootstrapReady.value,
  async (ready) => {
    if (!ready) return
    if (apiHealthSummary.value !== '未检测') return
    try {
      await checkProjectFileApiOnly()
    } catch {
      /* 结果由 apiHealthSummary / apiHealthDetails 反映 */
    }
  },
  { immediate: true }
)

function scrollToDmSection(anchor: string) {
  const el = document.getElementById(anchor)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }
  highlightedDmAnchor.value = anchor
  highlightTimer = setTimeout(() => {
    highlightedDmAnchor.value = null
    highlightTimer = undefined
  }, 2200)
}


watch(
  () => projectLinkStatus.value.integrationBranch,
  (v) => {
    integrationBranchDraft.value = v || 'develop'
  },
  { immediate: true }
)
watch(
  () => projectLinkStatus.value.releaseBranch,
  (v) => {
    releaseBranchDraft.value = v || ''
  },
  { immediate: true }
)

async function loadDataRepoBranchList(fetchRemote: boolean): Promise<void> {
  if (!projectLinkStatus.value.linked || !projectLinkStatus.value.managementRepoPath) {
    dataRepoBranchesList.value = []
    return
  }
  dataRepoBranchListLoading.value = true
  try {
    const r = await fetchDataRepoBranchList({ fetchRemote })
    dataRepoBranchesList.value = r.branches
    const cur = projectLinkStatus.value.managementBranch
    if (r.branches.includes(cur)) {
      dataRepoBranchSelect.value = cur
    } else if (r.current && r.branches.includes(r.current)) {
      dataRepoBranchSelect.value = r.current
    } else if (r.branches.length > 0) {
      dataRepoBranchSelect.value = r.branches[0]
    }
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载分支列表失败')
  } finally {
    dataRepoBranchListLoading.value = false
  }
}

async function loadRemoteBranchStatus(): Promise<void> {
  if (!projectLinkStatus.value.backupReady || !projectLinkStatus.value.managementRepoPath) {
    dataRepoRemoteStatus.value = null
    dataRepoRemoteStatusError.value = ''
    return
  }
  dataRepoRemoteStatusLoading.value = true
  dataRepoRemoteStatusError.value = ''
  try {
    dataRepoRemoteStatus.value = await fetchDataRepoRemoteBranchStatus()
  } catch (e: unknown) {
    dataRepoRemoteStatus.value = null
    dataRepoRemoteStatusError.value = e instanceof Error ? e.message : '检查远端分支失败'
  } finally {
    dataRepoRemoteStatusLoading.value = false
  }
}

async function handleSaveBranchConvention(): Promise<void> {
  const ib = integrationBranchDraft.value.trim()
  if (!ib) {
    ElMessage.warning('请填写协作主分支名')
    return
  }
  dataRepoBranchOpLoading.value = true
  try {
    await saveDataRepoBranchConvention({
      integrationBranch: ib,
      releaseBranch: releaseBranchDraft.value
    })
    await refreshProjectLinkStatus()
    ElMessage.success('分支约定已保存（写入便携中心 project-links.local.json）')
    await loadRemoteBranchStatus()
    if (dataRepoRemoteStatusNeedsInit.value) {
      ElMessage.warning('检测到远端尚未有约定分支，请先「初始化远端分支」后再并入协作主分支。')
    }
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    dataRepoBranchOpLoading.value = false
  }
}

async function handleInitRemoteBranchesConfirm(): Promise<void> {
  let s = dataRepoRemoteStatus.value
  if (!s?.ok) {
    await loadRemoteBranchStatus()
    s = dataRepoRemoteStatus.value
  }
  if (!s) {
    ElMessage.warning(dataRepoRemoteStatusError.value || '请先点击「检查远端分支」')
    return
  }
  if (!dataRepoRemoteStatusNeedsInit.value) {
    ElMessage.success('约定分支已在远端存在')
    return
  }
  try {
    await ElMessageBox.confirm(
      '将在远端创建尚不存在的约定分支：优先从 origin/main、origin/master、origin/develop（若存在）创建；若本地已有同名分支则直接推送；否则基于当前 HEAD。工作区须干净（无未提交改动）。',
      '确认初始化远端分支',
      { type: 'warning', confirmButtonText: '开始初始化', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  dataRepoBranchOpLoading.value = true
  try {
    const rb = (s.releaseBranch || '').trim()
    await initDataRepoRemoteBranches({
      integration: !s.integrationExists,
      release: rb.length > 0 && s.releaseExists === false
    })
    ElMessage.success('远端分支已初始化')
    await loadRemoteBranchStatus()
    await loadDataRepoBranchList(true)
    await refreshProjectLinkStatus()
    await refreshProjectStartupCheck()
    await refreshProjectContext()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '初始化失败')
  } finally {
    dataRepoBranchOpLoading.value = false
  }
}

async function handleCheckoutDataRepoBranch(named?: string): Promise<void> {
  const b = (named ?? dataRepoBranchSelect.value).trim()
  if (!b) {
    ElMessage.warning('请选择要切换的分支')
    return
  }
  dataRepoBranchOpLoading.value = true
  try {
    const r = await checkoutDataRepoBranch(b)
    await refreshProjectLinkStatus()
    await refreshProjectStartupCheck()
    await refreshProjectContext()
    ElMessage.success(r.message)
    await loadDataRepoBranchList(false)
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '切换失败')
  } finally {
    dataRepoBranchOpLoading.value = false
  }
}

async function handleCheckoutIntegrationBranch(): Promise<void> {
  const b = (projectLinkStatus.value.integrationBranch || 'develop').trim()
  dataRepoBranchSelect.value = b
  await handleCheckoutDataRepoBranch(b)
}

async function handlePushDataRepoBranch(): Promise<void> {
  if (!projectLinkStatus.value.backupReady) {
    ElMessage.warning('未配置 origin，无法推送')
    return
  }
  dataRepoBranchOpLoading.value = true
  try {
    const r = await pushDataRepoCurrentBranch()
    await refreshProjectLinkStatus()
    await refreshProjectStartupCheck()
    await refreshProjectContext()
    ElMessage.success(r.message)
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '推送失败')
  } finally {
    dataRepoBranchOpLoading.value = false
  }
}

async function handleMergeToIntegrationBranch(): Promise<void> {
  if (!projectLinkStatus.value.managementRepoPath) {
    ElMessage.warning('请先完成数据仓关联')
    return
  }
  if (!projectLinkStatus.value.backupReady) {
    ElMessage.warning('未配置 origin，无法推送')
    return
  }
  dataRepoBranchOpLoading.value = true
  try {
    const r = await mergeDataRepoToIntegrationBranch()
    await refreshProjectLinkStatus()
    await refreshProjectStartupCheck()
    await refreshProjectContext()
    ElMessage.success(r.message)
    await loadDataRepoBranchList(false)
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    dataRepoBranchOpLoading.value = false
  }
}

watch(
  () =>
    [uiReady.value, projectBootstrapReady.value, projectLinkStatus.value.managementRepoPath, projectLinkStatus.value.backupReady] as const,
  async ([ready, boot, path, backupReady]) => {
    if (ready && boot && path) {
      await loadDataRepoBranchList(false)
      if (backupReady) {
        await loadRemoteBranchStatus()
      } else {
        dataRepoRemoteStatus.value = null
        dataRepoRemoteStatusError.value = ''
      }
    } else {
      dataRepoRemoteStatus.value = null
      dataRepoRemoteStatusError.value = ''
    }
  },
  { immediate: true }
)
let uiReadyTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => projectLinkStatus.value.workingMode,
  (mode) => {
    selectedWorkingMode.value = mode
  },
  { immediate: true }
)

const startupType = computed(() => {
  if (projectStartupCheck.value.severity === 'error') return 'warning'
  return 'info'
})

const startupButtonType = computed<'primary' | 'info'>(() => {
  if (projectStartupCheck.value.severity === 'success') return 'info'
  return 'primary'
})

const apiCheckButtonType = computed<'primary' | 'info'>(() => {
  if (apiHealthSummary.value === '未检测' || apiHealthSummary.value === '全部可用') return 'info'
  return 'primary'
})

const checkAndSyncButtonType = computed<'primary' | 'info'>(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') {
    return projectFileReady.value ? 'info' : 'primary'
  }
  if (!projectFileReady.value) return 'primary'
  if (projectLinkStatus.value.behind > 0) return 'primary'
  if (apiHealthSummary.value !== '未检测' && apiHealthSummary.value !== '全部可用') return 'primary'
  return 'info'
})

const syncButtonType = computed<'primary' | 'info'>(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') return 'info'
  if (projectLinkStatus.value.behind > 0 || !projectLinkStatus.value.backupReady) return 'primary'
  return 'info'
})

const backupButtonType = computed<'primary' | 'info'>(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') return 'info'
  if (projectLinkStatus.value.ahead > 0 || projectLinkStatus.value.workingTreeDirty) return 'primary'
  return 'info'
})

const syncButtonDisabledReason = computed(() => {
  if (!projectLinkStatus.value.linked) return '未完成双仓关联，暂不可同步'
  if (!projectLinkStatus.value.managementRepoPath) return '数据仓路径未配置，暂不可同步'
  if (!projectLinkStatus.value.backupReady) return '数据仓未配置远端仓库，暂不可同步'
  return ''
})

const backupButtonDisabledReason = computed(() => {
  if (!projectLinkStatus.value.linked) return '未完成双仓关联，暂不可备份'
  if (!projectLinkStatus.value.managementRepoPath) return '数据仓路径未配置，暂不可备份'
  if (!projectLinkStatus.value.backupReady) return '数据仓未配置远端仓库，暂不可备份'
  return ''
})

const startupReminderReason = computed(() => {
  if (projectStartupCheck.value.severity === 'error') return '存在错误项，需要你确认后再继续写操作。'
  if (projectStartupCheck.value.severity === 'warning') return '存在告警项，建议先核对环境状态。'
  return '当前状态稳定，按里程碑或问题排查时再检查即可。'
})

const syncReminderReason = computed(() => {
  if (projectLinkStatus.value.workingTreeDirty) {
    return '「同步数据仓」= git 拉取远端，不会提交你本地未保存的改动，所以「未提交」提示不会因此消失。要提交并推送请用⑥备份，或在 PM 数据仓目录里自行 git 操作。'
  }
  if (projectLinkStatus.value.workingMode === 'single_local') return '当前是本地单机模式，远端同步按需执行即可。'
  if (projectLinkStatus.value.behind > 0) return '数据仓落后远端，先同步可避免基于旧数据继续开发。'
  if (!projectLinkStatus.value.backupReady) return '关联状态未就绪，需先同步让本地/远端对齐。'
  return '当前已基本对齐，不必频繁同步。'
})

const checkAndSyncReminderReason = computed(() => {
  if (projectLinkStatus.value.workingTreeDirty) {
    return '本按钮自检的是「项目文件 + 桥接」连接，不会处理数据仓 Git 未提交；数据仓请用「同步数据仓」或⑥备份。'
  }
  if (!projectFileReady.value) return '项目文件连接不可用，建议主动自检并尝试同步恢复。'
  if (projectLinkStatus.value.workingMode !== 'single_local' && projectLinkStatus.value.behind > 0) return '本地落后远端，建议先同步到最新再继续开发。'
  if (apiHealthSummary.value !== '未检测' && apiHealthSummary.value !== '全部可用') {
    return '接口存在异常，建议执行一次自检并同步以修复状态。'
  }
  return '当前状态稳定，按需触发即可。'
})

const backupReminderReason = computed(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') return '当前是本地单机模式，远端备份不是必须，建议阶段收尾再执行。'
  if (projectLinkStatus.value.ahead > 0) return '本地提交领先远端，建议推送备份避免单机风险。'
  if (projectLinkStatus.value.workingTreeDirty) return '有未提交改动，建议整理后备份到远端。'
  return '当前没有待备份改动，可在阶段完成时再备份。'
})

const currentWorkingModeDesc = computed(() =>
  selectedWorkingMode.value === 'single_local'
    ? '单机模式：减少远端备份提醒，适合单设备本地开发。'
    : '多设备模式：会提示同步与备份建议，适合跨设备协作。'
)

const showModeOnboarding = computed(() => {
  return projectLinkStatus.value.needsModeConfirmation || !projectLinkStatus.value.modeConfirmed
})

type FailureAction = 'sync' | 'backup' | 'check_and_sync'
type RecoveryState = {
  action: FailureAction
  kind: FailureKind
  reason: string
  updatedAt: number
}

const statusDecisionUpdatedAt = ref(Date.now())
const recoveryState = ref<RecoveryState | null>(null)

watch(
  [
    () => projectStartupCheck.value.checkedAt,
    () => projectLinkStatus.value.ahead,
    () => projectLinkStatus.value.behind,
    () => projectLinkStatus.value.workingTreeDirty,
    () => projectFileReady.value,
    () => apiHealthSummary.value
  ],
  () => {
    statusDecisionUpdatedAt.value = Date.now()
  },
  { immediate: true }
)

const statusDecisionUpdatedAtText = computed(() =>
  new Date(statusDecisionUpdatedAt.value).toLocaleString('zh-CN', { hour12: false })
)

const startupSeverityLabel = computed(() => {
  const s = projectStartupCheck.value.severity
  if (s === 'success') return 'success（正常）'
  if (s === 'error') return 'error（阻塞）'
  return 'warning（提醒）'
})

const startupCheckedAtText = computed(() =>
  projectStartupCheck.value.checkedAt
    ? formatDateTime(projectStartupCheck.value.checkedAt)
    : '尚未写入或读取失败'
)

type PipelineStepStatus = 'ok' | 'warn' | 'error'

const pipelineSteps = computed(() => {
  const ls = projectLinkStatus.value
  const su = projectStartupCheck.value
  const steps: { key: string; label: string; status: PipelineStepStatus; detail: string }[] = []

  steps.push({
    key: 'delivery_file',
    label: '交付数据文件',
    status: projectFileReady.value ? 'ok' : 'error',
    detail: projectFileReady.value ? '页面可读写项目内交付数据' : 'dev/preview 未就绪或读写出错'
  })

  steps.push({
    key: 'link',
    label: '双仓映射',
    status: ls.linked && Boolean(ls.managementRepoPath) ? 'ok' : 'error',
    detail: ls.linked ? '业务仓 ↔ 数据仓路径已配置' : '需在便携中心完成 project-links 映射'
  })

  steps.push({
    key: 'origin',
    label: '数据仓远端',
    status: ls.backupReady ? 'ok' : 'error',
    detail: ls.backupReady ? '已配置 origin，可 pull/push' : '未配置 origin，无法与 GitHub 对齐'
  })

  steps.push({
    key: 'data_git',
    label: '数据仓 Git 状态',
    status: !ls.backupReady ? 'error' : ls.behind > 0 || ls.workingTreeDirty ? 'warn' : 'ok',
    detail: !ls.backupReady
      ? '跳过：无远端'
      : ls.behind > 0 && ls.workingTreeDirty
        ? `落后远端 ${ls.behind} 提交，且工作区有未提交改动（先点同步，再备份或手动提交）`
        : ls.behind > 0
          ? `落后远端 ${ls.behind} 提交，建议先同步`
          : ls.workingTreeDirty
            ? '有未提交改动：「同步数据仓」只拉远端，不会替你提交；要消掉本提示请用⑥备份，或在数据仓内手动 commit / 丢弃'
            : `领先 ${ls.ahead} / 落后 ${ls.behind}，工作区干净`
  })

  steps.push({
    key: 'biz_git',
    label: '业务仓 Git 状态',
    status: su.businessRepo.behind > 0 ? 'warn' : 'ok',
    detail:
      su.businessRepo.behind > 0
        ? `业务代码落后远端 ${su.businessRepo.behind} 提交（与数据兼容性相关）`
        : '未落后远端（或无可比对上游）'
  })

  const api = apiHealthSummary.value
  const apiOk = api === '全部可用'
  const apiUnknown = api === '未检测'
  const apiChecking = apiHealthChecking.value
  steps.push({
    key: 'api',
    label: '本地开发 API',
    status: apiOk ? 'ok' : apiChecking ? 'ok' : apiUnknown ? 'warn' : 'warn',
    detail: apiOk
      ? 'items / bridge / receipts 均可达'
      : apiChecking
        ? '正在探测本地 API…'
        : apiUnknown
          ? '本页加载后会自动探测；仍异常时可手动点「探测连接」'
          : `异常摘要：${api}`
  })

  return steps
})

const pipelineEnvSteps = computed(() =>
  pipelineSteps.value.filter((s) => ['delivery_file', 'link', 'api'].includes(s.key))
)
const pipelineSyncSteps = computed(() =>
  pipelineSteps.value.filter((s) => ['origin', 'data_git'].includes(s.key))
)
const pipelineBizStep = computed(() => pipelineSteps.value.find((s) => s.key === 'biz_git') ?? null)

const consoleHealthBadge = computed(() => {
  if (projectStartupCheck.value.severity === 'error') return { type: 'danger' as const, text: '阻塞 · 需先处理数据仓' }
  if (pipelineSteps.value.some((s) => s.status === 'error')) return { type: 'danger' as const, text: '关键链路未就绪' }
  if (projectStartupCheck.value.severity === 'warning' || pipelineSteps.value.some((s) => s.status === 'warn'))
    return { type: 'warning' as const, text: '可用 · 有提醒项' }
  return { type: 'success' as const, text: '就绪 · 可继续开发' }
})

const showConsoleTechnical = ref(false)
const consoleRefreshing = ref(false)

const recoveryStatusText = computed(() => {
  if (!recoveryState.value) return ''
  const actionLabel =
    recoveryState.value.action === 'backup'
      ? '备份到GitHub'
      : recoveryState.value.action === 'sync'
        ? '同步数据仓'
        : '自检并同步最新'
  return `最近失败：${actionLabel} · ${failureKindLabel(recoveryState.value.kind)}`
})

const recoveryReasonText = computed(() => {
  if (!recoveryState.value) return ''
  return recoveryState.value.reason
})

const recoveryUpdatedAtText = computed(() => {
  if (!recoveryState.value) return ''
  return new Date(recoveryState.value.updatedAt).toLocaleString('zh-CN', { hour12: false })
})

const startupSummaryTitle = computed(() => {
  if (projectStartupCheck.value.severity === 'error') return '当前环境存在阻塞项，建议先处理后再继续开发'
  if (projectStartupCheck.value.severity === 'warning') return '当前环境有提醒项，建议先确认关键状态'
  return '当前环境可正常开发'
})

const startupSummaryTip = computed(() => projectStartupCheck.value.messages[0] || '暂无附加说明')

const nextStepHint = computed(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') {
    if (!projectFileReady.value) {
      return '你当前是单机模式，但项目文件连接异常，建议先点“自检并同步最新”恢复连接。'
    }
    return '你当前是单机模式：可直接继续开发，远端同步/备份按阶段需要再处理。'
  }
  if (projectLinkStatus.value.behind > 0) {
    return '建议先点“同步数据仓（建议）”，把本地更新到远端最新状态。'
  }
  if (projectLinkStatus.value.ahead > 0 || projectLinkStatus.value.workingTreeDirty) {
    return '建议在阶段完成后点“备份到GitHub（建议）”，避免本地数据风险。'
  }
  if (!projectFileReady.value) {
    return '建议点“自检并同步最新（建议）”，尝试恢复项目文件连接。'
  }
  return '当前无需额外运维操作，可继续按计划开发。'
})

const syncStatusText = computed(() => {
  if (projectLinkStatus.value.behind > 0) return `本地落后远端 ${projectLinkStatus.value.behind} 次提交（建议先同步）`
  if (projectLinkStatus.value.workingTreeDirty) {
    return '工作区有未提交改动（同步不会清除；需⑥备份或手动 commit）'
  }
  if (projectLinkStatus.value.ahead > 0) return `本地领先远端 ${projectLinkStatus.value.ahead} 次提交（建议备份）`
  return '本地与远端提交已对齐'
})

function endpointShortLabel(endpoint: 'items' | 'bridge' | 'receipts'): string {
  if (endpoint === 'items') return '交付'
  if (endpoint === 'bridge') return '桥接'
  return '回执'
}

type FailureKind = 'conflict' | 'auth' | 'network' | 'config' | 'unknown'

function failureKindLabel(kind: FailureKind): string {
  if (kind === 'conflict') return '冲突类问题'
  if (kind === 'auth') return '鉴权类问题'
  if (kind === 'network') return '网络类问题'
  if (kind === 'config') return '配置类问题'
  return '待排查问题'
}

function detectFailureKind(reason: string): FailureKind {
  const text = reason.toLowerCase()
  if (text.includes('冲突') || text.includes('conflict') || text.includes('rebase')) return 'conflict'
  if (text.includes('鉴权') || text.includes('permission') || text.includes('token') || text.includes('ssh')) return 'auth'
  if (text.includes('网络') || text.includes('connect') || text.includes('timeout') || text.includes('host')) return 'network'
  if (text.includes('未配置') || text.includes('路径') || text.includes('关联')) return 'config'
  return 'unknown'
}

function buildFailureSteps(actionName: string, kind: FailureKind): string[] {
  if (kind === 'conflict') {
    return [
      `1) 先点“同步数据仓（建议）”拉取远端最新状态`,
      '2) 若仍提示冲突，请让 AI 辅助解决冲突文件',
      `3) 再次点击“${actionName}”完成操作`
    ]
  }
  if (kind === 'auth') {
    return [
      '1) 确认 GitHub 登录/Token/SSH 权限有效',
      '2) 重新执行一次同步验证连接',
      `3) 再次点击“${actionName}”`
    ]
  }
  if (kind === 'network') {
    return [
      '1) 检查网络、代理或 VPN 状态',
      '2) 稍后重试同步操作',
      `3) 再次点击“${actionName}”`
    ]
  }
  if (kind === 'config') {
    return [
      '1) 先完成业务仓与数据仓关联配置',
      '2) 确认数据仓已配置 origin 远端',
      `3) 再次点击“${actionName}”`
    ]
  }
  return [
    '1) 先执行一次“检查连接是否正常”',
    '2) 若异常继续，执行“同步数据仓（建议）”',
    `3) 再次点击“${actionName}”`
  ]
}

function buildOpsFailureAiPrompt(actionName: string, reason: string): string {
  return [
    `请帮我排查“${actionName}失败”的问题，并给出可执行修复步骤。`,
    '',
    `失败提示：${reason}`,
    `项目：${projectName}`,
    `业务分支：${projectBranch.value}`,
    `当前提交：${projectCommit.value}`,
    `本地领先 ahead：${projectLinkStatus.value.ahead}`,
    `本地落后 behind：${projectLinkStatus.value.behind}`,
    `是否有未提交改动：${projectLinkStatus.value.workingTreeDirty ? '是' : '否'}`,
    `数据仓路径：${projectLinkStatus.value.managementRepoPath || '未配置'}`,
    '',
    '请按下面格式返回：',
    '1) 根因判断（网络/鉴权/冲突/分支状态/配置）',
    '2) 最小风险修复步骤（每一步命令 + 预期输出）',
    '3) 修复后如何验证操作成功',
    '4) 如果修复失败，下一步兜底方案'
  ].join('\n')
}

function buildBackupFailureAiPrompt(reason: string): string {
  return buildOpsFailureAiPrompt('数据仓备份到GitHub', reason)
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    return false
  } catch {
    return false
  }
}

async function handleBackupFailureRecovery(reason: string) {
  const kind = detectFailureKind(reason)
  recoveryState.value = {
    action: 'backup',
    kind,
    reason,
    updatedAt: Date.now()
  }
  const steps = buildFailureSteps('备份到GitHub', kind)
  const aiPrompt = buildBackupFailureAiPrompt(reason)
  try {
    await ElMessageBox.confirm(
      [
        `备份失败原因：${reason}`,
        `建议处理路径：${kind === 'conflict' ? '冲突修复' : kind === 'auth' ? '鉴权修复' : kind === 'network' ? '网络修复' : kind === 'config' ? '配置修复' : '通用排查'}`,
        ...steps,
        '',
        '你可以选择：',
        '1) 一键复制排障信息给AI（推荐）',
        '2) 自动尝试修复并重试（会先同步再重试备份）'
      ].join('\n'),
      '备份失败处理建议',
      {
        confirmButtonText: '复制给AI',
        cancelButtonText: '自动修复并重试',
        distinguishCancelAndClose: true,
        type: 'error'
      }
    )
    const copied = await copyTextToClipboard(aiPrompt)
    if (copied) {
      ElMessage.success('已复制排障信息，可直接粘贴给AI处理')
    } else {
      ElMessage.warning('复制失败，请手动复制弹窗内容给AI')
    }
  } catch (action) {
    if (action !== 'cancel') return
    ElMessage.info('开始自动修复：先同步数据仓，再重试备份')
    const syncResult = await syncDataRepoByUi()
    if (!syncResult.ok) {
      ElMessage.error(`自动修复失败（同步未成功）：${syncResult.message}`)
      return
    }
    const retryResult = await backupDataRepoByUi()
    if (retryResult.ok) {
      ElMessage.success(`自动修复后备份成功：${retryResult.message}`)
      return
    }
    ElMessage.error(`自动修复后仍失败：${retryResult.message}（建议复制给AI继续排查）`)
  }
}

async function handleSyncFailureRecovery(reason: string) {
  const kind = detectFailureKind(reason)
  recoveryState.value = {
    action: 'sync',
    kind,
    reason,
    updatedAt: Date.now()
  }
  const steps = buildFailureSteps('同步数据仓', kind)
  const aiPrompt = buildOpsFailureAiPrompt('同步数据仓', reason)
  try {
    await ElMessageBox.confirm(
      [
        `同步失败原因：${reason}`,
        `建议处理路径：${kind === 'conflict' ? '冲突修复' : kind === 'auth' ? '鉴权修复' : kind === 'network' ? '网络修复' : kind === 'config' ? '配置修复' : '通用排查'}`,
        ...steps,
        '',
        '你可以选择：',
        '1) 一键复制排障信息给AI',
        '2) 自动再试一次同步'
      ].join('\n'),
      '同步失败处理建议',
      {
        confirmButtonText: '复制给AI',
        cancelButtonText: '自动重试同步',
        distinguishCancelAndClose: true,
        type: 'error'
      }
    )
    const copied = await copyTextToClipboard(aiPrompt)
    ElMessage[copied ? 'success' : 'warning'](copied ? '已复制排障信息，可直接粘贴给AI处理' : '复制失败，请手动复制弹窗内容给AI')
  } catch (action) {
    if (action !== 'cancel') return
    const retry = await syncDataRepoByUi()
    if (retry.ok) {
      ElMessage.success(`自动重试同步成功：${retry.message}`)
      return
    }
    ElMessage.error(`自动重试后仍失败：${retry.message}`)
  }
}

async function handleCheckAndSyncFailureRecovery(reason: string) {
  const kind = detectFailureKind(reason)
  recoveryState.value = {
    action: 'check_and_sync',
    kind,
    reason,
    updatedAt: Date.now()
  }
  const steps = buildFailureSteps('自检并同步最新', kind)
  const aiPrompt = buildOpsFailureAiPrompt('自检并同步最新', reason)
  try {
    await ElMessageBox.confirm(
      [
        `自检并同步失败原因：${reason}`,
        ...steps,
        '',
        '你可以选择：',
        '1) 一键复制排障信息给AI',
        '2) 自动再试一次“自检并同步”'
      ].join('\n'),
      '自检并同步失败处理建议',
      {
        confirmButtonText: '复制给AI',
        cancelButtonText: '自动重试',
        distinguishCancelAndClose: true,
        type: 'error'
      }
    )
    const copied = await copyTextToClipboard(aiPrompt)
    ElMessage[copied ? 'success' : 'warning'](copied ? '已复制排障信息，可直接粘贴给AI处理' : '复制失败，请手动复制弹窗内容给AI')
  } catch (action) {
    if (action !== 'cancel') return
    const retry = await checkProjectFileApiHealth()
    if (retry.kind === 'error') {
      ElMessage.error(`自动重试后仍失败：${retry.message}`)
      return
    }
    ElMessage.success('自动重试成功，状态已刷新')
  }
}

async function handleRunRecommendedRecoveryFlow() {
  if (syncButtonDisabledReason.value) {
    ElMessage.warning(`当前无法执行推荐流程：${syncButtonDisabledReason.value}`)
    return
  }
  ElMessage.info('开始执行推荐流程：先同步数据仓，再尝试备份')
  const syncResult = await syncDataRepoByUi()
  if (!syncResult.ok) {
    await handleSyncFailureRecovery(syncResult.message)
    return
  }
  ElMessage.success(`第1步完成：${syncResult.message}`)

  if (backupButtonDisabledReason.value) {
    ElMessage.info('同步已完成。当前备份按钮不可用，可先处理页面提示后再备份。')
    return
  }
  const backupResult = await backupDataRepoByUi()
  if (backupResult.ok) {
    recoveryState.value = null
    ElMessage.success(`推荐流程完成：${backupResult.message}`)
    return
  }
  await handleBackupFailureRecovery(backupResult.message)
}

const cleanupButtonType = computed<'danger' | 'warning'>(() => {
  if (logCleanupPreview.value.bridgeRemovable > 0 || logCleanupPreview.value.receiptsRemovable > 0) {
    return 'danger'
  }
  return 'warning'
})

const processLogInventoryAdviceText = computed(() => {
  const inv = processLogInventory.value
  if (!inv.loaded) return ''
  const t = inv.bridgeTotal + inv.receiptsTotal
  if (t === 0) return '暂无进程日志，无需清理。'
  if (t >= 8000) return '日志量较大，建议选截止日期后点「预览」确认再清理。'
  if (t >= 800) return '日志量中等，可按需定期清理较早记录。'
  return '当前量较少，可暂不处理。'
})

/** 状态看板「总计」：优先用全量拉取；未加载时退回预览结果（预览前为 0） */
const displayLogBridgeTotal = computed(() =>
  processLogInventory.value.loaded ? processLogInventory.value.bridgeTotal : logCleanupPreview.value.bridgeTotal
)
const displayLogReceiptsTotal = computed(() =>
  processLogInventory.value.loaded ? processLogInventory.value.receiptsTotal : logCleanupPreview.value.receiptsTotal
)

const isHealthy = computed(() => {
  return (
    projectStartupCheck.value.severity === 'success' &&
    projectLinkStatus.value.backupReady &&
    projectLinkStatus.value.ahead === 0 &&
    projectLinkStatus.value.behind === 0 &&
    !projectLinkStatus.value.workingTreeDirty
  )
})

function formatDateTime(ts: number): string {
  if (!ts) return '未知'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

async function handleWorkingModeChange(mode: 'single_local' | 'multi_sync') {
  const serverModeBefore = projectLinkStatus.value.workingMode
  selectedWorkingMode.value = mode
  const result = await updateProjectWorkingModeByUi(mode)
  if (result.ok) {
    ElMessage.success(result.message)
    window.setTimeout(() => {
      window.location.reload()
    }, 400)
    return
  }
  ElMessage.error(result.message)
  // 失败时未刷新 link 状态，仍以当前内存中的 serverMode 为准，避免分段控件与真实模式不一致
  selectedWorkingMode.value = serverModeBefore
}

function handleModeSegmentChange(value: unknown) {
  if (value === 'single_local' || value === 'multi_sync') {
    void handleWorkingModeChange(value)
  }
}

async function promptWorkingModeIfNeeded() {
  if (!projectLinkStatus.value.needsModeConfirmation) return
  try {
    await ElMessageBox.confirm(
      [
        projectLinkStatus.value.modePromptReason || '检测到远程仓库配置，请确认工作模式。',
        '',
        '单机模式：默认低打扰，不强调远端备份。',
        '多设备模式：启用同步/备份建议，适合跨设备协作。'
      ].join('\n'),
      '确认工作模式',
      {
        confirmButtonText: '使用多设备模式',
        cancelButtonText: '使用本地单机模式',
        distinguishCancelAndClose: true,
        type: 'warning'
      }
    )
    await handleWorkingModeChange('multi_sync')
  } catch (action) {
    if (action !== 'cancel') return
    await handleWorkingModeChange('single_local')
  }
}

async function handleConsoleRefreshAll() {
  if (consoleRefreshing.value || projectControlLoading.value || apiHealthChecking.value) return
  consoleRefreshing.value = true
  try {
    const r = await runProjectControl('startup_check')
    const api = await checkProjectFileApiOnly()
    if (r.ok && api.ok) ElMessage.success('控制台已刷新：启动检查与连接探测已更新')
    else
      ElMessage.warning(
        [r.ok ? '' : r.message, api.ok ? '' : api.message].filter(Boolean).join(' · ') || '部分检查未通过'
      )
  } catch {
    ElMessage.error('刷新失败，请确认 dev 服务已启动')
  } finally {
    consoleRefreshing.value = false
  }
  void refreshProcessLogInventory()
}

async function copyConsolePath(path: string) {
  const ok = await copyTextToClipboard(path)
  ElMessage[ok ? 'success' : 'warning'](ok ? '已复制到剪贴板' : '复制失败，请手动复制路径')
}

async function handleStartupCheck() {
  const result = await runProjectControl('startup_check')
  const line = projectStartupCheck.value.messages[0] || result.message
  if (!result.ok) {
    ElMessage.warning(line)
    return
  }
  if (projectStartupCheck.value.severity === 'success') ElMessage.success(line)
  else if (projectStartupCheck.value.severity === 'error') ElMessage.error(line)
  else ElMessage.warning(line)
}

async function handleCheckProjectApi() {
  const result = await checkProjectFileApiOnly()
  if (result.ok) {
    ElMessage.success(result.message)
    return
  }
  ElMessage.warning(result.message)
}

async function handleCheckAndSyncProjectApi() {
  const outcome = await checkProjectFileApiHealth()
  if (outcome.kind === 'updated_latest') {
    recoveryState.value = null
    ElMessage.success(outcome.message)
    return
  }
  if (outcome.kind === 'no_update') {
    recoveryState.value = null
    ElMessage.info(outcome.message)
    return
  }
  await handleCheckAndSyncFailureRecovery(outcome.message)
}

async function handleSyncDataRepo() {
  const result = await syncDataRepoByUi()
  if (result.ok) {
    recoveryState.value = null
    ElMessage.success(result.message)
  }
  else await handleSyncFailureRecovery(result.message)
}

async function handleBackupDataRepo() {
  try {
    await ElMessageBox.confirm('将提交并推送数据仓到 GitHub，是否继续？', '备份确认', {
      confirmButtonText: '确认备份',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  const result = await backupDataRepoByUi()
  if (result.ok) {
    recoveryState.value = null
    ElMessage.success(result.message)
  }
  else await handleBackupFailureRecovery(result.message)
}

async function handlePreviewLogCleanup() {
  if (!logCleanupDate.value) {
    ElMessage.warning('请先选择清理日期')
    return
  }
  const ok = await previewLogCleanup()
  if (!ok) {
    ElMessage.error('日志清理预览失败')
    return
  }
  ElMessage.info(
    `待清理：桥接 ${logCleanupPreview.value.bridgeRemovable} 条，回执 ${logCleanupPreview.value.receiptsRemovable} 条`
  )
}

async function handleCleanupProcessLogs() {
  if (!logCleanupDate.value) {
    ElMessage.warning('请先选择清理日期')
    return
  }
  const previewOk = await previewLogCleanup()
  if (!previewOk) {
    ElMessage.error('清理前预览失败，请稍后重试')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将清理 ${logCleanupDate.value} 之前日志（桥接 ${logCleanupPreview.value.bridgeRemovable} 条，回执 ${logCleanupPreview.value.receiptsRemovable} 条），是否继续？`,
      '清理确认',
      {
        confirmButtonText: '确认清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  const result = await runLogCleanupWithConfirm()
  if (!result.ok) {
    ElMessage.error('日志清理失败')
    return
  }
  ElMessage.success(`已清理：桥接 ${result.bridgeRemoved} 条，回执 ${result.receiptsRemoved} 条`)
}

onMounted(() => {
  const stop = watch(
    () => projectBootstrapReady.value,
    (ready) => {
      if (!ready) return
      if (uiReadyTimer) {
        clearTimeout(uiReadyTimer)
      }
      uiReadyTimer = setTimeout(() => {
        uiReady.value = true
      }, 300)
      void promptWorkingModeIfNeeded()
      stop()
    },
    { immediate: true }
  )
})

onBeforeUnmount(() => {
  if (uiReadyTimer) {
    clearTimeout(uiReadyTimer)
  }
  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }
})
</script>

<template>
  <div class="page">
    <el-card v-if="!projectBootstrapReady || !uiReady" shadow="never">
      <template #header>正在加载数据管理状态</template>
      <el-skeleton :rows="5" animated />
      <div class="detail">首次加载中，稍后会一次性展示状态与操作建议。</div>
    </el-card>

    <template v-else>
    <el-card shadow="always" class="dm-overview-card-wrap dm-overview-card-wrap--main">
      <div class="dm-page-header dm-page-header--embedded">
        <h2 class="dm-page-header-title page-title">数据管理（{{ projectName }}）</h2>
        <div class="dm-page-header-lead-wrap">
          <el-icon class="dm-page-header-lead-ico" :size="16"><InfoFilled /></el-icon>
          <p class="dm-page-header-lead">
            日常开发多数情况不必打开本页。它的价值在于：<strong>换机、重装或在新目录接入工程</strong>时，集中核对数据仓与工程连接是否就绪；在多设备协作或出现同步、备份、分支与环境异常时，也可在此一站式排查与处理。
          </p>
        </div>
      </div>
      <div class="dm-overview-section">
        <div class="dm-overview-header">
          <span class="dm-overview-title">状态总览</span>
          <el-tag v-if="dmOverviewAllGreen" type="success" size="default" effect="plain">全部正常</el-tag>
          <el-tag v-else type="warning" size="default" effect="plain">{{ dmOverviewProblemCount }} 项需关注</el-tag>
        </div>
        <p class="dm-overview-lead">
          {{
            dmOverviewAllGreen
              ? '当前无需逐项排查；需要时再展开下方卡片即可。'
              : '有问题项已标黄/红，点击对应卡片可跳转到详情区块。'
          }}
        </p>
        <p v-if="!showMultiDeviceDmPanels" class="dm-overview-mode-note">
          当前为本地单机：多设备相关的「④ 分支 / ⑤ 同步 / ⑥ 备份」已从总览与详情区折叠；切换到「多设备同步」即可重新显示（不丢配置）。
        </p>
        <div class="dm-overview-grid" role="list">
          <button
            v-for="item in dmOverviewItems"
            :key="`${item.anchor}-${item.title}`"
            type="button"
            class="dm-overview-tile dm-overview-tile--layout-d"
            :class="`dm-overview-tile--${item.severity}`"
            @click="scrollToDmSection(item.anchor)"
          >
            <el-tooltip :content="overviewStatusTooltip(item.severity)" placement="top">
              <span class="dm-overview-pill dm-overview-pill--corner" :class="`dm-overview-pill--${item.severity}`">
                {{ overviewStatusGlyph(item.severity) }}
              </span>
            </el-tooltip>
            <span class="dm-overview-l-d-name">{{ item.title }}</span>
            <p class="dm-overview-l-d-hint">{{ item.hint }}</p>
          </button>
        </div>
        <div class="dm-overview-strip">
          <div class="dm-strip-row">
            <div class="dm-strip-badges">
              <span
                class="dm-strip-status"
                :class="`dm-strip-status--${consoleHealthBadge.type}`"
                role="status"
              >
                {{ consoleHealthBadge.text }}
              </span>
              <el-button
                type="primary"
                plain
                :loading="consoleRefreshing || projectControlLoading || apiHealthChecking"
                @click="handleConsoleRefreshAll"
              >
                刷新全部状态
              </el-button>
              <span class="dm-strip-meta">判定 {{ statusDecisionUpdatedAtText }} · 启动检查 {{ startupSeverityLabel }} · {{ startupCheckedAtText }}</span>
            </div>
          </div>
          <p class="dm-strip-hint">{{ nextStepHint }}</p>
        </div>
      </div>
    </el-card>

    <el-alert
      v-if="showModeOnboarding"
      type="warning"
      :closable="false"
      show-icon
      class="dm-banner"
      title="请确认工作模式"
    >
      <template #default>
        <div class="dm-banner-actions">
          <el-button size="small" type="primary" @click="handleWorkingModeChange('single_local')">本地单机</el-button>
          <el-button size="small" plain @click="handleWorkingModeChange('multi_sync')">多设备同步</el-button>
        </div>
      </template>
    </el-alert>

    <el-alert
      v-if="recoveryState"
      id="dm-anchor-recovery"
      type="error"
      :closable="false"
      show-icon
      class="dm-banner"
      :class="{ 'dm-anchor-highlight': highlightedDmAnchor === DM_ANCHOR.recovery }"
      :title="recoveryStatusText"
    >
      <template #default>
        <p v-if="recoveryReasonText" class="dm-banner-msg">{{ recoveryReasonText }}</p>
        <p v-if="recoveryUpdatedAtText" class="dm-banner-time">{{ recoveryUpdatedAtText }}</p>
        <div class="dm-banner-actions">
          <el-button
            size="small"
            type="danger"
            :loading="dataRepoSyncing || dataRepoBackingUp"
            :disabled="Boolean(syncButtonDisabledReason)"
            @click="handleRunRecommendedRecoveryFlow"
          >
            一键恢复
          </el-button>
          <el-button size="small" plain :loading="dataRepoSyncing" :disabled="Boolean(syncButtonDisabledReason)" @click="handleSyncDataRepo">同步</el-button>
          <el-button size="small" plain :loading="dataRepoBackingUp" :disabled="Boolean(backupButtonDisabledReason)" @click="handleBackupDataRepo">备份</el-button>
        </div>
      </template>
    </el-alert>

    <div class="dm-modules">
      <el-card
        shadow="never"
        class="dm-module"
        :id="DM_ANCHOR.mode"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.mode }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('mode') }} 模式与路径</span>
          <span class="dm-module-sub">提醒策略与数据仓目录（仅本地配置）</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">切换工作模式（与提醒策略相关）</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <el-segmented
                v-model="selectedWorkingMode"
                size="small"
                :options="[
                  { label: '本地单机', value: 'single_local' },
                  { label: '多设备同步', value: 'multi_sync' }
                ]"
                @change="handleModeSegmentChange"
              />
              <p class="dm-pane-aside">{{ currentWorkingModeDesc }}</p>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">只影响提醒强弱；路径可复制</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="dm-path-row">
                <code class="console-path">{{ projectLinkStatus.managementRepoPath || '未配置' }}</code>
                <el-button v-if="projectLinkStatus.managementRepoPath" size="small" link type="primary" @click="copyConsolePath(projectLinkStatus.managementRepoPath)">复制路径</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="never"
        class="dm-module"
        :id="DM_ANCHOR.env"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.env }"
      >
        <template #header>
          <span class="dm-module-head"><el-icon><Monitor /></el-icon> {{ dmSectionGlyph('env') }} 环境与连接</span>
          <span class="dm-module-sub">本页能否读写数据、是否连上开发服务</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">触发检查，不直接改业务代码</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="dm-btn-row">
                <el-tooltip :content="startupReminderReason" placement="top">
                  <el-button :icon="Refresh" :loading="projectControlLoading" :type="startupButtonType" @click="handleStartupCheck">检查环境</el-button>
                </el-tooltip>
                <el-tooltip content="仅探测本页与本地开发 API" placement="top">
                  <el-button :icon="DataAnalysis" :loading="apiHealthChecking" :type="apiCheckButtonType" @click="handleCheckProjectApi">探测连接</el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">链路灯 + 三个接口是否通（绿/红）</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="pipeline pipeline--compact">
                <div v-for="(step, idx) in pipelineEnvSteps" :key="step.key" class="pipeline-item">
                  <div v-if="idx > 0" class="pipeline-connector" aria-hidden="true" />
                  <div
                    class="pipeline-step"
                    :class="{
                      'pipeline-step--ok': step.status === 'ok',
                      'pipeline-step--warn': step.status === 'warn',
                      'pipeline-step--err': step.status === 'error'
                    }"
                  >
                    <span class="pipeline-step-label">{{ step.label }}</span>
                    <span class="pipeline-step-detail">{{ step.detail }}</span>
                  </div>
                </div>
              </div>
              <div class="api-pipe api-pipe--row api-pipe--tight">
                <el-tooltip
                  v-for="item in apiHealthDetails"
                  :key="item.endpoint"
                  placement="top"
                  :content="item.ok ? '连接正常' : item.message"
                >
                  <el-tag
                    :type="item.ok ? 'success' : 'danger'"
                    size="small"
                    effect="plain"
                    class="api-pipe-inline-tag"
                  >
                    {{ endpointShortLabel(item.endpoint) }}·{{ item.ok ? 'OK' : '异常' }}
                  </el-tag>
                </el-tooltip>
                <div v-if="apiHealthDetails.length === 0" class="dm-board-empty">
                  {{ apiHealthChecking ? '正在探测…' : '暂无探测结果（进入本页会自动探测一次）' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="never"
        class="dm-module dm-module--span-2"
        :id="DM_ANCHOR.compare"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.compare }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('compare') }} 双仓对照</span>
          <span class="dm-module-sub"
            >业务仓放本仓库代码；PM 数据仓单独放交付与进度等管理数据，并可与远端同步备份。下表对比两仓分支、与远端差、工作区是否干净。</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><InfoFilled /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">说明</span>
                <span class="dm-pane-desc">{{
                  showMultiDeviceDmPanels
                    ? '两仓职责不同；数据仓分支切换见下方卡片'
                    : '两仓职责不同；分支与远端同步相关操作在「多设备同步」模式下显示于下方'
                }}</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <p class="dm-pane-aside">
                二者是<strong>两个独立 Git</strong>，分支名不必一致；同步/备份只针对 PM 数据仓，业务仓需在本仓库里自行维护。
              </p>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">本地路径 · 分支 · 与远端差 · 工作区</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="compare-grid compare-grid--full compare-grid--in-pane">
                <div class="compare-card">
                  <div class="compare-title">业务仓库</div>
                  <div class="compare-row">
                    <span class="compare-k">本地路径</span>
                    <span class="compare-v compare-v--path">
                      <code class="console-path">{{ projectLinkStatus.businessRepoPath || '未配置' }}</code>
                      <el-button
                        v-if="projectLinkStatus.businessRepoPath"
                        size="small"
                        link
                        type="primary"
                        @click="copyConsolePath(projectLinkStatus.businessRepoPath)"
                      >
                        复制
                      </el-button>
                    </span>
                  </div>
                  <div class="compare-row">
                    <span class="compare-k">分支</span><span class="compare-v">{{ projectBranch }}</span>
                  </div>
                  <div class="compare-row">
                    <span class="compare-k">相对远端</span>
                    <span class="compare-v">
                      <el-tag v-if="projectStartupCheck.businessRepo.behind > 0" type="warning" size="small">落后 {{ projectStartupCheck.businessRepo.behind }}</el-tag>
                      <el-tag v-else type="success" size="small">未落后</el-tag>
                    </span>
                  </div>
                  <div class="compare-row">
                    <span class="compare-k">工作区</span><span class="compare-v">{{ projectStartupCheck.businessRepo.dirty ? '有未提交' : '干净' }}</span>
                  </div>
                </div>
                <div class="compare-card">
                  <div class="compare-title">数据仓库（PM）</div>
                  <div class="compare-row">
                    <span class="compare-k">本地路径</span>
                    <span class="compare-v compare-v--path">
                      <code class="console-path">{{ projectLinkStatus.managementRepoPath || '未配置' }}</code>
                      <el-button
                        v-if="projectLinkStatus.managementRepoPath"
                        size="small"
                        link
                        type="primary"
                        @click="copyConsolePath(projectLinkStatus.managementRepoPath)"
                      >
                        复制
                      </el-button>
                    </span>
                  </div>
                  <div class="compare-row">
                    <span class="compare-k">分支</span><span class="compare-v">{{ projectLinkStatus.managementBranch }}</span>
                  </div>
                  <div class="compare-row">
                    <span class="compare-k">相对远端</span>
                    <span class="compare-v">领先 {{ projectLinkStatus.ahead }} / 落后 {{ projectLinkStatus.behind }}</span>
                  </div>
                  <div class="compare-row">
                    <span class="compare-k">origin</span><span class="compare-v">{{ projectLinkStatus.backupReady ? '已配置' : '未配置' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-show="showMultiDeviceDmPanels"
        shadow="never"
        class="dm-module dm-module--span-2 dm-module--branch"
        :id="DM_ANCHOR.branch"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.branch }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('branch') }} 数据仓分支（PM）</span>
          <span class="dm-module-sub"
            >左侧主操作为合并并推送；右侧可检查远端、仅切换协作主分支或仅推送。有未提交改动时，「并入」与「仅切」都会先在当前分支自动 chore 提交（与实现一致）。</span>
        </template>
        <div class="dm-branch-layout">
          <div class="dm-branch-col dm-branch-col--primary">
            <p class="dm-branch-lead">
              当前检出 <strong>{{ projectLinkStatus.managementBranch }}</strong>
              · 协作主分支
              <strong>{{ projectLinkStatus.integrationBranch || 'develop' }}</strong>
            </p>
            <el-button
              type="primary"
              :loading="dataRepoBranchOpLoading"
              :disabled="!projectLinkStatus.managementRepoPath || !projectLinkStatus.backupReady"
              @click="handleMergeToIntegrationBranch"
            >
              并入协作主分支并推送
            </el-button>
            <p class="dm-branch-sub">
              若工作区有未提交改动，会先在<strong>当前分支</strong>自动提交（chore 说明），再合并进协作主分支并推送到远端。并入前要求远端已存在
              <code>origin/{{ projectLinkStatus.integrationBranch || 'develop' }}</code>；若尚未建立，请先「检查远端分支」并在提示下「初始化远端分支」（不会悄悄改用 main/master 代替约定）。
            </p>
          </div>
          <div class="dm-branch-col dm-branch-col--side">
            <div
              v-if="projectLinkStatus.backupReady && projectLinkStatus.managementRepoPath"
              class="dm-branch-remote"
            >
              <div class="dm-branch-action-line">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :loading="dataRepoRemoteStatusLoading"
                  @click="loadRemoteBranchStatus"
                >
                  检查远端分支
                </el-button>
                <span class="dm-branch-action-desc">先 fetch，再对照本地约定：远端是否已有协作主分支等；用于判断要不要「初始化远端分支」。</span>
              </div>
              <el-alert
                v-if="dataRepoRemoteStatus && dataRepoRemoteStatusNeedsInit"
                type="warning"
                show-icon
                :closable="false"
                class="dm-branch-remote-alert"
              >
                <template #title>远端尚未有约定分支</template>
                <p class="dm-branch-remote-lines">
                  协作主分支 <code>{{ dataRepoRemoteStatus.integrationBranch }}</code>：{{
                    dataRepoRemoteStatus.integrationExists ? '已存在' : '缺失'
                  }}
                  <template v-if="(dataRepoRemoteStatus.releaseBranch || '').trim()">
                    · 发布分支 <code>{{ (dataRepoRemoteStatus.releaseBranch || '').trim() }}</code>：{{
                      dataRepoRemoteStatus.releaseExists === null
                        ? '未配置'
                        : dataRepoRemoteStatus.releaseExists
                          ? '已存在'
                          : '缺失'
                    }}
                  </template>
                </p>
                <el-button
                  type="warning"
                  size="small"
                  :loading="dataRepoBranchOpLoading"
                  @click="handleInitRemoteBranchesConfirm"
                >
                  初始化远端分支
                </el-button>
              </el-alert>
              <p v-if="dataRepoRemoteStatusError" class="dm-branch-hint dm-branch-hint--muted">{{ dataRepoRemoteStatusError }}</p>
            </div>
            <div v-else class="dm-branch-side-placeholder">
              <p class="dm-branch-hint dm-branch-hint--muted">
                检查远端约定分支需已完成双仓关联，且数据仓已配置远端仓库（origin）。
              </p>
            </div>
            <div class="dm-branch-secondary">
              <div class="dm-branch-action-line">
                <el-button
                  size="small"
                  type="warning"
                  plain
                  :loading="dataRepoBranchOpLoading"
                  :disabled="!projectLinkStatus.managementRepoPath"
                  @click="handleCheckoutIntegrationBranch"
                >
                  仅切到协作主分支
                </el-button>
                <span class="dm-branch-action-desc">将数据仓检出到配置的协作主分支（名称见上方「协作主分支」）；不合并其它分支、不向远端推送。若工作区有未提交改动，会先在<strong>当前分支</strong>自动提交（chore 说明）再切换，规则与左侧「并入协作主分支」一致；若仍无法切换（如冲突），请用「备份到 GitHub」或在数据仓目录手动处理。</span>
              </div>
              <div class="dm-branch-action-line">
                <el-tooltip content="仅 push，不合并到协作主分支" placement="top">
                  <el-button
                    size="small"
                    :icon="Share"
                    :loading="dataRepoBranchOpLoading"
                    :disabled="!projectLinkStatus.backupReady"
                    @click="handlePushDataRepoBranch"
                  >
                    仅推送当前分支
                  </el-button>
                </el-tooltip>
                <span class="dm-branch-action-desc">把当前所在分支推到远端；不并入协作主分支，适合已在本分支提交完、只需同步远端的场景。</span>
              </div>
            </div>
            <el-collapse class="dm-branch-collapse">
              <el-collapse-item title="更多：分支列表、切换与约定" name="more">
                <div class="dm-branch-advanced">
                  <div class="dm-field">
                    <span class="dm-field-label">协作主分支名（保存后写入本地配置）</span>
                    <el-input v-model="integrationBranchDraft" size="small" placeholder="默认 develop" clearable />
                  </div>
                  <div class="dm-field">
                    <span class="dm-field-label">发布分支（可选）</span>
                    <el-input v-model="releaseBranchDraft" size="small" placeholder="可留空" clearable />
                  </div>
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    :loading="dataRepoBranchOpLoading"
                    :disabled="!projectLinkStatus.managementRepoPath"
                    @click="handleSaveBranchConvention"
                  >
                    保存约定
                  </el-button>
                  <div class="dm-branch-toolbar dm-branch-toolbar--mt">
                    <el-select
                      v-model="dataRepoBranchSelect"
                      filterable
                      placeholder="选择分支"
                      class="dm-branch-select"
                      :loading="dataRepoBranchListLoading"
                    >
                      <el-option v-for="b in dataRepoBranchesList" :key="b" :label="b" :value="b" />
                    </el-select>
                    <div class="dm-branch-toolbar-ops">
                      <el-button size="small" :icon="Refresh" :loading="dataRepoBranchListLoading" @click="loadDataRepoBranchList(false)">
                        刷新
                      </el-button>
                      <el-button
                        size="small"
                        :loading="dataRepoBranchListLoading"
                        :disabled="!projectLinkStatus.backupReady"
                        @click="loadDataRepoBranchList(true)"
                      >
                        拉取远端
                      </el-button>
                    </div>
                  </div>
                  <p class="dm-branch-hint dm-branch-hint--muted">切换分支需工作区干净；若需保留未提交改动请先使用「备份」或主按钮并入。</p>
                  <el-button
                    size="small"
                    :loading="dataRepoBranchOpLoading"
                    :disabled="!projectLinkStatus.managementRepoPath"
                    @click="handleCheckoutDataRepoBranch"
                  >
                    切换到所选分支
                  </el-button>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </el-card>

      <el-card
        v-show="showMultiDeviceDmPanels"
        shadow="never"
        class="dm-module"
        :id="DM_ANCHOR.sync"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.sync }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('sync') }} 数据同步</span>
          <span class="dm-module-sub">交付数据与数据仓、远端对齐</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">自检项目文件 + 拉数据仓；或只拉数据仓</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="dm-btn-row">
                <el-tooltip :content="checkAndSyncReminderReason" placement="top">
                  <el-button :icon="Refresh" :loading="apiHealthChecking" :type="checkAndSyncButtonType" @click="handleCheckAndSyncProjectApi">自检并同步</el-button>
                </el-tooltip>
                <el-tooltip :content="syncButtonDisabledReason || syncReminderReason" placement="top">
                  <el-button
                    :icon="Warning"
                    :loading="dataRepoSyncing"
                    :type="syncButtonType"
                    :disabled="Boolean(syncButtonDisabledReason)"
                    @click="handleSyncDataRepo"
                  >
                    同步数据仓
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">origin + 数据仓与远端差量（悬停按钮可看详情）</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="dm-board-strip">
                <el-tag size="small" type="info" effect="plain">{{ syncStatusText }}</el-tag>
              </div>
              <div class="pipeline pipeline--compact">
                <div v-for="(step, idx) in pipelineSyncSteps" :key="step.key" class="pipeline-item">
                  <div v-if="idx > 0" class="pipeline-connector" aria-hidden="true" />
                  <div
                    class="pipeline-step"
                    :class="{
                      'pipeline-step--ok': step.status === 'ok',
                      'pipeline-step--warn': step.status === 'warn',
                      'pipeline-step--err': step.status === 'error'
                    }"
                  >
                    <span class="pipeline-step-label">{{ step.label }}</span>
                    <span class="pipeline-step-detail">{{ step.detail }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-show="showMultiDeviceDmPanels"
        shadow="never"
        class="dm-module"
        :id="DM_ANCHOR.backup"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.backup }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('backup') }} 备份到 GitHub</span>
          <span class="dm-module-sub">把数据仓提交并推到远端当前分支</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">一键备份（会先与远端对齐）</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <el-tooltip :content="backupButtonDisabledReason || backupReminderReason" placement="top">
                <el-button
                  :icon="UploadFilled"
                  :loading="dataRepoBackingUp"
                  :type="backupButtonType"
                  :disabled="Boolean(backupButtonDisabledReason)"
                  @click="handleBackupDataRepo"
                >
                  备份到 GitHub
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">数字一眼能读完；业务仓仅作兼容提示</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="dm-stat-chips">
                <div class="dm-stat-chip">
                  <span class="dm-stat-num">{{ projectLinkStatus.ahead }}</span>
                  <span class="dm-stat-label">领先</span>
                </div>
                <div class="dm-stat-chip">
                  <span class="dm-stat-num">{{ projectLinkStatus.behind }}</span>
                  <span class="dm-stat-label">落后</span>
                </div>
                <div class="dm-stat-chip" :class="{ 'dm-stat-chip--warn': projectLinkStatus.workingTreeDirty }">
                  <span class="dm-stat-num">{{ projectLinkStatus.workingTreeDirty ? '有' : '无' }}</span>
                  <span class="dm-stat-label">未提交</span>
                </div>
              </div>
              <p v-if="pipelineBizStep" class="dm-board-note">{{ pipelineBizStep.detail }}</p>
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="never"
        class="dm-module"
        :id="DM_ANCHOR.system"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.system }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('system') }} 系统状态与记录</span>
          <span class="dm-module-sub">汇总判定、文件与最近一次控制面操作</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">只读刷新；含交付文件时间与路径，不跑检查脚本</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <el-button :icon="Refresh" :loading="summaryRefreshLoading" @click="refreshDataSummary">刷新摘要</el-button>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">色块 + 标签，一眼扫完</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <el-alert :type="startupType" :closable="false" show-icon :title="startupSummaryTitle" class="console-inline-alert" />
              <p class="dm-panel-text dm-panel-text--tight">提示：{{ startupSummaryTip }}</p>
              <p v-if="isHealthy" class="doc-p doc-p-muted dm-doc-p--tight">当前状态健康。</p>
              <div class="console-tag-row">
                <el-tag size="small" type="info">数据文件 {{ projectFileReady ? '已连接' : '异常' }}</el-tag>
                <el-tag size="small" type="info">仓库 {{ projectLinkStatus.backupReady ? '已就绪' : '待处理' }}</el-tag>
                <el-tag size="small" type="info">接口 {{ apiHealthSummary }}</el-tag>
              </div>
              <p class="dm-panel-text dm-panel-text--tight">
                数据更新时间：{{ formatDateTime(projectItemsUpdatedAt) }} · 交付文件 {{ projectItemsFilePath || '未知' }}
              </p>
              <p class="dm-panel-text dm-panel-text--tight"><strong>最近执行</strong>：{{ projectControlMessage }}</p>
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="never"
        class="dm-module dm-module--log"
        :id="DM_ANCHOR.logs"
        :class="{ 'dm-module--highlight': highlightedDmAnchor === DM_ANCHOR.logs }"
      >
        <template #header>
          <span class="dm-module-head">{{ dmSectionGlyph('logs') }} 日志维护（高级）</span>
          <span class="dm-module-sub">按日期裁剪进程日志；先预览再确认</span>
        </template>
        <div v-if="processLogInventory.loaded" class="dm-log-inventory-banner">
          <p class="dm-log-inventory-line">
            当前约 <strong>{{ processLogInventory.bridgeTotal + processLogInventory.receiptsTotal }}</strong> 条进程日志（桥接 {{ processLogInventory.bridgeTotal }} · 回执 {{ processLogInventory.receiptsTotal }}）。
            {{ processLogInventoryAdviceText }}
          </p>
        </div>
        <div v-else-if="processLogInventoryLoading" class="dm-log-inventory-banner">
          <p class="dm-log-inventory-line dm-log-inventory-line--muted">正在加载日志条数…</p>
        </div>
        <div v-else class="dm-log-inventory-banner">
          <p class="dm-log-inventory-line dm-log-inventory-line--muted">日志条数未加载；可点「刷新全部状态」或下方「刷新摘要」重试。</p>
        </div>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">选截止日期 → 预览 → 确认</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="console-log-actions">
                <el-date-picker v-model="logCleanupDate" value-format="YYYY-MM-DD" type="date" placeholder="清理此日期之前" style="width: 160px" />
                <el-button :icon="Refresh" :loading="logCleanupLoading" size="small" type="info" @click="handlePreviewLogCleanup">预览</el-button>
                <el-button :icon="Check" :loading="logCleanupLoading" size="small" :type="cleanupButtonType" @click="handleCleanupProcessLogs">确认清理</el-button>
              </div>
            </div>
          </div>
          <div class="dm-pane dm-pane--board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><DataBoard /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">状态看板</span>
                <span class="dm-pane-desc">将删须先预览；总计为库内条数</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <div class="dm-stat-chips">
                <div class="dm-stat-chip">
                  <span class="dm-stat-num">{{ logCleanupPreview.bridgeRemovable }}</span>
                  <span class="dm-stat-label">桥接将删</span>
                </div>
                <div class="dm-stat-chip dm-stat-chip--muted">
                  <span class="dm-stat-num">{{ displayLogBridgeTotal }}</span>
                  <span class="dm-stat-label">桥接总计</span>
                </div>
                <div class="dm-stat-chip">
                  <span class="dm-stat-num">{{ logCleanupPreview.receiptsRemovable }}</span>
                  <span class="dm-stat-label">回执将删</span>
                </div>
                <div class="dm-stat-chip dm-stat-chip--muted">
                  <span class="dm-stat-num">{{ displayLogReceiptsTotal }}</span>
                  <span class="dm-stat-label">回执总计</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="dm-module dm-module--tech dm-module--span-2">
        <template #header>
          <span class="dm-module-head">技术细节</span>
          <span class="dm-module-sub">JSON、六环与规则说明（默认收起）</span>
        </template>
        <div class="dm-split">
          <div class="dm-pane dm-pane--action">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--action"><Operation /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">操作</span>
                <span class="dm-pane-desc">展开后右侧可滚动</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <el-switch v-model="showConsoleTechnical" active-text="显示 JSON / 规则 / 六环" />
            </div>
          </div>
          <div class="dm-pane dm-pane--board dm-pane--tech-board">
            <div class="dm-pane-header">
              <el-icon class="dm-pane-ico dm-pane-ico--board"><Reading /></el-icon>
              <div class="dm-pane-head-text">
                <span class="dm-pane-title">内容</span>
                <span class="dm-pane-desc">与上方卡片同源，便于复制排查</span>
              </div>
            </div>
            <div class="dm-pane-body">
              <p v-show="!showConsoleTechnical" class="dm-board-empty">关闭时可减少干扰；需要时再打开。</p>
              <div v-show="showConsoleTechnical" class="console-tech">
                <section class="doc-section">
                  <h4 class="doc-h4 doc-h4-inline">
                    <el-icon><Reading /></el-icon>
                    规则摘要
                  </h4>
                  <ul class="doc-ul">
                    <li>启动检查：<code>scripts/pm/pm-startup-check.mjs</code> → <code>.pm-center/startup-check.json</code></li>
                    <li><strong>error / warning / success</strong> 含义见脚本判定。</li>
                    <li>文档：<code>docs/pm/pm-linking.md</code></li>
                  </ul>
                </section>
                <section class="doc-section">
                  <h4 class="doc-h4">完整链路（六环）</h4>
                  <div class="pipeline">
                    <div v-for="(step, idx) in pipelineSteps" :key="step.key" class="pipeline-item">
                      <div v-if="idx > 0" class="pipeline-connector" aria-hidden="true" />
                      <div
                        class="pipeline-step"
                        :class="{
                          'pipeline-step--ok': step.status === 'ok',
                          'pipeline-step--warn': step.status === 'warn',
                          'pipeline-step--err': step.status === 'error'
                        }"
                      >
                        <span class="pipeline-step-label">{{ step.label }}</span>
                        <span class="pipeline-step-detail">{{ step.detail }}</span>
                      </div>
                    </div>
                  </div>
                </section>
                <section class="doc-section">
                  <h4 class="doc-h4">原始状态（JSON）</h4>
                  <pre class="console-json">{{ JSON.stringify(projectStartupCheck, null, 2) }}</pre>
                  <pre class="console-json">{{ JSON.stringify(projectLinkStatus, null, 2) }}</pre>
                </section>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dm-overview-card-wrap {
  border: 1px solid #e4e7ed;
  background: #fff;
}
.dm-overview-card-wrap--main {
  border-color: #dcdfe6;
}
.dm-overview-card-wrap--main :deep(.el-card__body) {
  padding: 18px 20px 22px;
}
.dm-page-header--embedded {
  margin-bottom: 4px;
}
.dm-overview-section {
  margin-top: 16px;
  padding-top: 18px;
  border-top: 1px solid #ebeef5;
}
.dm-overview-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.dm-overview-title {
  font-weight: 600;
  font-size: 18px;
  color: #303133;
  letter-spacing: 0.02em;
}
.dm-overview-card-wrap--main .dm-overview-title {
  font-size: 20px;
}
.dm-overview-lead {
  margin: 0 0 14px;
  font-size: 14px;
  color: #606266;
  line-height: 1.55;
}
.dm-overview-mode-note {
  margin: -6px 0 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.5;
}
.dm-overview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-content: flex-start;
}
.dm-overview-tile {
  position: relative;
  margin: 0;
  padding: 12px 14px;
  flex: 0 0 200px;
  width: 200px;
  max-width: 100%;
  box-sizing: border-box;
  text-align: left;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  background: #fafafa;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-height: 102px;
}
.dm-overview-tile:hover {
  border-color: #c6e2ff;
  background: #f5faff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.dm-overview-tile:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}
.dm-overview-tile--success {
  border-color: #e1f3d8;
  background: #f6fff2;
}
.dm-overview-tile--info {
  border-color: #e9e9eb;
  background: #fafafa;
}
.dm-overview-tile--warning {
  border-color: #f5dab1;
  background: #fffbf0;
}
.dm-overview-tile--danger {
  border-color: #fbc4c4;
  background: #fff5f5;
}

/* 状态总览：方案 D — 状态符号右上角；标题与说明左对齐 */
.dm-overview-tile--layout-d {
  gap: 8px;
  padding: 12px 44px 12px 14px;
}
.dm-overview-pill--corner {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}
.dm-overview-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 5px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  border-radius: 4px;
  border: 1px solid transparent;
  box-sizing: border-box;
  cursor: inherit;
}
.dm-overview-pill--success {
  color: #529b2e;
  background: #eef8e8;
  border-color: #c2e7b0;
}
.dm-overview-pill--info {
  color: #73767a;
  background: #f4f4f5;
  border-color: #dcdfe6;
}
.dm-overview-pill--warning {
  color: #b88230;
  background: #fdf6ec;
  border-color: #f5dab1;
}
.dm-overview-pill--danger {
  color: #c45656;
  background: #fef0f0;
  border-color: #fab6b6;
}
.dm-overview-l-d-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  line-height: 1.35;
  word-break: break-word;
}
.dm-overview-l-d-hint {
  margin: 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.45;
}
.dm-overview-strip {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed #ebeef5;
}
.dm-module--highlight {
  animation: dm-section-pulse 1.6s ease;
}
.dm-anchor-highlight {
  animation: dm-section-pulse 1.6s ease;
}
@keyframes dm-section-pulse {
  0%,
  100% {
    box-shadow: inset 0 0 0 0 transparent;
  }
  15%,
  40% {
    box-shadow: inset 0 0 0 2px rgba(64, 158, 255, 0.55);
  }
}
.dm-strip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}
.dm-strip-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
}
.dm-strip-status {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  color: #606266;
}
.dm-strip-status::before {
  content: '';
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
}
.dm-strip-status--success {
  color: #529b2e;
}
.dm-strip-status--warning {
  color: #b88230;
}
.dm-strip-status--danger {
  color: #c45656;
}
.dm-strip-meta {
  flex: 1 1 100%;
  min-width: 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}
.dm-strip-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.45;
}
#dm-anchor-recovery {
  scroll-margin-top: 12px;
}
.dm-banner {
  margin-top: 0;
}
.dm-banner-msg {
  margin: 0 0 6px;
  font-size: 12px;
  color: #606266;
}
.dm-banner-time {
  margin: 0 0 8px;
  font-size: 11px;
  color: #909399;
}
.dm-banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dm-modules {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}
.dm-modules > .dm-module {
  min-width: 0;
  scroll-margin-top: 12px;
}
.dm-module--span-2 {
  grid-column: 1 / -1;
}
.dm-module :deep(.el-card__header) {
  padding: 8px 12px;
}
.dm-module :deep(.el-card__body) {
  padding: 10px 12px;
}
.dm-module-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.dm-module-sub {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.dm-split {
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}
.dm-pane {
  min-width: 0;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: #fafbfc;
  overflow: hidden;
}
.dm-pane--action {
  background: linear-gradient(180deg, #fafcff 0%, #f6f8fb 100%);
}
.dm-pane--board {
  background: #fff;
}
.dm-pane-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
  background: rgba(255, 255, 255, 0.65);
}
.dm-pane-ico {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
.dm-pane-ico--action {
  color: #409eff;
}
.dm-pane-ico--board {
  color: #67c23a;
}
.dm-pane-head-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dm-pane-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.dm-pane-desc {
  font-size: 11px;
  line-height: 1.35;
  color: #909399;
}
.dm-pane-body {
  padding: 10px;
}
.dm-pane-aside {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.45;
}
.dm-board-empty {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.dm-board-strip {
  margin-bottom: 10px;
}
.dm-board-note {
  margin: 10px 0 0;
  font-size: 11px;
  color: #909399;
  line-height: 1.45;
}
.dm-stat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dm-stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  background: #fff;
}
.dm-stat-chip--warn {
  border-color: #f5dab1;
  background: #fdf6ec;
}
.dm-stat-chip--muted {
  opacity: 0.92;
  background: #f4f4f5;
}
.dm-stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.dm-stat-label {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}
.dm-kv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dm-kv-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 12px;
  line-height: 1.45;
}
.dm-kv-k {
  flex-shrink: 0;
  min-width: 76px;
  color: #909399;
}
.dm-kv-v {
  flex: 1;
  min-width: 0;
  color: #606266;
  word-break: break-word;
}
.dm-kv-v--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}
.dm-panel-text--tight {
  margin-bottom: 6px;
}
.dm-panel-text--tight:last-child {
  margin-bottom: 0;
}
.dm-doc-p--tight {
  margin-top: 0;
  margin-bottom: 6px;
}
.compare-grid--in-pane {
  margin-top: 0;
}
.dm-pane--tech-board .console-tech {
  max-height: min(42vh, 360px);
}
.dm-module-grid {
  display: grid;
  grid-template-columns: minmax(140px, 220px) minmax(0, 1fr);
  gap: 10px 12px;
  align-items: start;
}
.dm-module-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dm-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dm-module-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.45;
}
.dm-module-panel {
  min-width: 0;
}
.dm-panel-text {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.55;
  color: #606266;
}
.dm-panel-foot {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}
.dm-path-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.dm-module--tech {
  border-style: dashed;
}
.dm-module--tech :deep(.el-card__body) {
  padding-top: 10px;
}
.dm-module--tech .console-tech {
  overflow: auto;
  padding-right: 4px;
}
.pipeline--compact .pipeline-step {
  padding: 6px 8px;
}
.pipeline--compact .pipeline-connector {
  height: 6px;
  margin-left: 8px;
}
.api-pipe--tight {
  margin-top: 10px;
}
.compare-grid--full {
  margin-top: 0;
}
@media (max-width: 1024px) {
  .dm-modules {
    grid-template-columns: 1fr;
  }
  .dm-module--span-2 {
    grid-column: auto;
  }
}
@media (max-width: 900px) {
  .dm-split {
    grid-template-columns: 1fr;
  }
  .dm-module-grid {
    grid-template-columns: 1fr;
  }
}
.pipeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.pipeline-item {
  display: flex;
  flex-direction: column;
}
.pipeline-connector {
  width: 2px;
  height: 8px;
  margin-left: 10px;
  background: #dcdfe6;
}
.pipeline-step {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  font-size: 12px;
  line-height: 1.45;
}
.pipeline-step-label {
  display: block;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.pipeline-step-detail {
  color: #606266;
  font-size: 11px;
}
.pipeline-step--ok {
  border-color: #c2e7b0;
  background: #f0f9eb;
}
.pipeline-step--warn {
  border-color: #f5dab1;
  background: #fdf6ec;
}
.pipeline-step--err {
  border-color: #fab6b6;
  background: #fef0f0;
}
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 1100px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }
}
.compare-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  background: #fff;
  font-size: 12px;
}
.compare-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #ebeef5;
}
.dm-module--branch :deep(.el-card__body) {
  padding-top: 10px;
}
.dm-branch-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 28px;
  align-items: start;
}
.dm-branch-col {
  min-width: 0;
}
.dm-branch-col--primary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.dm-branch-col--side {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  min-width: 0;
}
@media (min-width: 901px) {
  .dm-branch-col--primary {
    border-right: 1px solid #ebeef5;
    padding-right: 20px;
  }
}
@media (max-width: 900px) {
  .dm-branch-layout {
    grid-template-columns: 1fr;
  }
}
.dm-branch-side-placeholder .dm-branch-hint {
  margin-bottom: 0;
}
.dm-branch-lead {
  margin: 0 0 12px;
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}
.dm-branch-sub {
  margin: 10px 0 14px;
  font-size: 12px;
  color: #909399;
  line-height: 1.45;
}
.dm-branch-remote {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.dm-branch-remote > .el-button:first-of-type {
  flex-shrink: 0;
}
.dm-branch-remote-alert {
  width: 100%;
  margin: 0;
}
.dm-branch-remote-alert :deep(.el-alert__content) {
  width: 100%;
}
.dm-branch-remote-alert :deep(.el-button) {
  margin-left: 0;
}
.dm-branch-remote-lines {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
}
.dm-branch-action-line {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px 12px;
  width: 100%;
}
.dm-branch-action-line .el-button,
.dm-branch-action-line .el-tooltip {
  flex-shrink: 0;
}
.dm-branch-action-desc {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.45;
  color: #909399;
  padding-top: 2px;
}
.dm-branch-secondary {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
.dm-branch-secondary .el-button {
  margin-left: 0;
}
.dm-branch-collapse {
  border: none;
  --el-collapse-header-height: 40px;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fafbfc;
}
.dm-branch-collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
  color: #606266;
  justify-content: flex-start;
  padding-left: 12px;
  padding-right: 12px;
  background: #fff;
}
.dm-branch-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.dm-branch-collapse :deep(.el-collapse-item__content) {
  padding: 0 12px 12px;
  background: #fff;
}
.dm-branch-advanced {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
.dm-branch-advanced .dm-field {
  margin-bottom: 0;
  width: 100%;
}
.dm-branch-advanced .el-button {
  align-self: flex-start;
}
.dm-field-label {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}
.dm-branch-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #606266;
  line-height: 1.45;
}
.dm-branch-hint--muted {
  color: #909399;
  font-size: 11px;
}
.dm-branch-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  margin-bottom: 0;
}
.dm-branch-toolbar--mt {
  margin-top: 4px;
}
.dm-branch-toolbar-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.dm-branch-select {
  width: 100%;
  min-width: 0;
}
.compare-row {
  display: grid;
  grid-template-columns: 5.5em minmax(0, 1fr);
  gap: 0 10px;
  margin-top: 6px;
  line-height: 1.5;
  align-items: baseline;
}
.compare-row:first-of-type {
  margin-top: 0;
}
.compare-k {
  color: #909399;
  white-space: nowrap;
  flex-shrink: 0;
}
.compare-v {
  text-align: left;
  word-break: break-word;
  color: #606266;
  min-width: 0;
}
.compare-v--path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}
.compare-v--path .console-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.api-pipe {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.api-pipe--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}
.api-pipe-inline-tag {
  cursor: default;
}
.console-path {
  display: inline-block;
  max-width: 100%;
  font-size: 11px;
  word-break: break-all;
  padding: 4px 8px;
  background: #f4f4f5;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
}
.console-tech {
  padding-bottom: 8px;
}
.console-json {
  margin: 0 0 8px;
  padding: 8px;
  font-size: 10px;
  line-height: 1.35;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  overflow: auto;
  max-height: 160px;
}
.doc-h4-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.console-inline-alert {
  margin-bottom: 10px;
}
.console-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}
.dm-log-inventory-banner {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  box-sizing: border-box;
}
.dm-log-inventory-line {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #303133;
}
.dm-log-inventory-line--muted {
  color: #909399;
}
.console-log-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.doc-section {
  margin-bottom: 12px;
}
.doc-section:last-child {
  margin-bottom: 4px;
}
.doc-h4 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.doc-p {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.55;
  color: #606266;
}
.doc-p-muted {
  color: #909399;
  font-size: 12px;
}
.doc-ul {
  margin: 0 0 8px;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.55;
  color: #606266;
}
.doc-dl {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
}
.doc-dl dt {
  margin-top: 8px;
  font-weight: 600;
  color: #303133;
}
.doc-dl dt:first-child {
  margin-top: 0;
}
.doc-dl dd {
  margin: 4px 0 0;
  padding-left: 0;
  word-break: break-all;
}
.doc-p code,
.doc-ul code {
  font-size: 11px;
  padding: 0 4px;
  background: #f0f2f5;
  border-radius: 3px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.section-actions {
  margin-top: 10px;
}
.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dm-page-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 20px;
  row-gap: 10px;
  align-items: center;
}
.dm-page-header-title {
  min-width: 0;
}
.dm-page-header-lead-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border-left: 3px solid var(--el-color-info-light-5);
  box-sizing: border-box;
}
.dm-page-header-lead-ico {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-info);
}
.dm-page-header-lead {
  margin: 0;
  min-width: 0;
  flex: 1;
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
}
@media (max-width: 640px) {
  .dm-page-header {
    grid-template-columns: 1fr;
  }
}
.page-title {
  margin: 0;
}
.detail {
  font-size: 13px;
  color: #606266;
  margin-top: 8px;
}
.tags {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.status-updated-at {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.status-row + .status-row {
  margin-top: 8px;
}
.status-reason {
  font-size: 13px;
  color: #606266;
}
.status-note {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}
.advanced-card {
  margin-top: 10px;
}
</style>
