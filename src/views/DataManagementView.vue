<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, DataAnalysis, Refresh, Setting, UploadFilled, Warning } from '@element-plus/icons-vue'
import { useProjectManagement } from '../modules/project-management'

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
  logCleanupDate,
  logCleanupPreview,
  logCleanupLoading,
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
const uiReady = ref(false)
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
  if (!projectLinkStatus.value.linked) return '未完成业务仓与数据仓关联，暂不可同步'
  if (!projectLinkStatus.value.managementRepoPath) return '数据仓路径缺失，暂不可同步'
  if (!projectLinkStatus.value.backupReady) return '数据仓未配置 origin，暂不可同步'
  return ''
})

const backupButtonDisabledReason = computed(() => {
  if (!projectLinkStatus.value.linked) return '未完成业务仓与数据仓关联，暂不可备份'
  if (!projectLinkStatus.value.managementRepoPath) return '数据仓路径缺失，暂不可备份'
  if (!projectLinkStatus.value.backupReady) return '数据仓未配置 origin，暂不可备份'
  return ''
})

const startupButtonText = computed(() => {
  if (projectStartupCheck.value.severity === 'success') return '检查环境是否能继续开发（可选）'
  return '检查环境是否能继续开发（建议）'
})

const syncButtonText = computed(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') return '同步数据仓（单机可选）'
  if (projectLinkStatus.value.behind > 0 || !projectLinkStatus.value.backupReady) return '同步数据仓（建议）'
  return '同步数据仓（可选）'
})

const apiCheckButtonText = computed(() => {
  if (apiHealthSummary.value === '全部可用') return '检查连接是否正常（可选）'
  return '检查连接是否正常（建议）'
})

const checkAndSyncButtonText = computed(() => {
  if (projectLinkStatus.value.workingMode === 'single_local' && projectFileReady.value) return '自检并同步最新（单机可选）'
  if (!projectFileReady.value) return '自检并同步最新（建议）'
  if (projectLinkStatus.value.behind > 0) return '自检并同步最新（建议）'
  if (apiHealthSummary.value !== '未检测' && apiHealthSummary.value !== '全部可用') return '自检并同步最新（建议）'
  return '自检并同步最新（可选）'
})

const backupButtonText = computed(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') return '备份到GitHub（单机可选）'
  if (projectLinkStatus.value.ahead > 0 || projectLinkStatus.value.workingTreeDirty) return '备份到GitHub（建议）'
  return '备份到GitHub（可选）'
})

const startupReminderReason = computed(() => {
  if (projectStartupCheck.value.severity === 'error') return '存在错误项，需要你确认后再继续写操作。'
  if (projectStartupCheck.value.severity === 'warning') return '存在告警项，建议先核对环境状态。'
  return '当前状态稳定，按里程碑或问题排查时再检查即可。'
})

const startupUsageHint = computed(() => {
  if (projectStartupCheck.value.severity === 'success') return '什么时候点：开始一天工作前，或遇到异常时。'
  return '什么时候点：出现告警/报错时先点它，确认还能不能继续开发。'
})

const syncReminderReason = computed(() => {
  if (projectLinkStatus.value.workingMode === 'single_local') return '当前是本地单机模式，远端同步按需执行即可。'
  if (projectLinkStatus.value.behind > 0) return '数据仓落后远端，先同步可避免基于旧数据继续开发。'
  if (!projectLinkStatus.value.backupReady) return '关联状态未就绪，需先同步让本地/远端对齐。'
  return '当前已基本对齐，不必频繁同步。'
})

const checkAndSyncReminderReason = computed(() => {
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

const checkAndSyncStatusLine = computed(() => {
  const suggested = checkAndSyncButtonType.value === 'primary'
  return {
    tagType: 'info' as const,
    text: `自检并同步：${suggested ? '建议现在执行' : '当前可选'}`
  }
})

const backupStatusLine = computed(() => {
  const suggested = backupButtonType.value === 'primary'
  return {
    tagType: 'info' as const,
    text: `备份到 GitHub：${suggested ? '建议现在执行' : '当前可选'}`
  }
})

const currentWorkingModeLabel = computed(() =>
  selectedWorkingMode.value === 'single_local' ? '本地单机' : '多设备同步'
)

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
  if (projectLinkStatus.value.ahead > 0) return `本地领先远端 ${projectLinkStatus.value.ahead} 次提交（建议备份）`
  return '本地与远端提交已对齐'
})

function endpointLabel(endpoint: 'items' | 'bridge' | 'receipts'): string {
  if (endpoint === 'items') return '交付数据接口'
  if (endpoint === 'bridge') return '桥接事件接口'
  return '回执日志接口'
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
  selectedWorkingMode.value = mode
  const result = await updateProjectWorkingModeByUi(mode)
  if (result.ok) {
    ElMessage.success(result.message)
    return
  }
  ElMessage.error(result.message)
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

async function handleStartupCheck() {
  const result = await runProjectControl('startup_check')
  if (result.ok) ElMessage.success(result.message)
  else ElMessage.warning(result.message)
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
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="title-row">
        <div>
          <h2 class="page-title">数据管理（{{ projectName }}）</h2>
          <div class="page-subtitle">这是“数据同步与备份”页面，不是业务功能页面。先看建议，再决定是否操作。</div>
        </div>
        <el-popover placement="bottom-end" trigger="click" :width="360">
          <template #reference>
            <el-button :icon="Setting" plain>工作模式设置</el-button>
          </template>
          <div class="detail">用于控制提醒策略，不影响业务数据本身。</div>
          <div class="mode-row">
            <span class="mode-label">当前模式：</span>
            <el-segmented
              v-model="selectedWorkingMode"
              :options="[
                { label: '本地单机', value: 'single_local' },
                { label: '多设备同步', value: 'multi_sync' }
              ]"
              @change="handleModeSegmentChange"
            />
          </div>
          <div class="detail">{{ currentWorkingModeDesc }}</div>
        </el-popover>
      </div>
    </el-card>

    <el-card v-if="!projectBootstrapReady || !uiReady" shadow="never">
      <template #header>正在加载数据管理状态</template>
      <el-skeleton :rows="5" animated />
      <div class="detail">首次加载中，稍后会一次性展示状态与操作建议。</div>
    </el-card>

    <template v-else>
    <el-card shadow="never">
      <template #header>现在该做什么</template>
      <div class="status-updated-at">判定时间：{{ statusDecisionUpdatedAtText }}</div>
      <div class="detail">{{ nextStepHint }}</div>
      <el-alert
        v-if="showModeOnboarding"
        type="warning"
        :closable="false"
        show-icon
        title="请先确认工作模式（建议只需设置一次）"
      >
        <template #default>
          <div class="detail">{{ projectLinkStatus.modePromptReason || '选择后会保存为项目设置，后续不再反复打扰。' }}</div>
          <div class="actions section-actions">
            <el-button size="small" type="primary" @click="handleWorkingModeChange('single_local')">
              设为本地单机
            </el-button>
            <el-button size="small" type="warning" plain @click="handleWorkingModeChange('multi_sync')">
              设为多设备同步
            </el-button>
          </div>
        </template>
      </el-alert>
      <div class="detail">当前工作模式：{{ currentWorkingModeLabel }}（可在右上角“工作模式设置”中修改）</div>
      <div class="detail">{{ currentWorkingModeDesc }}</div>
      <el-alert
        v-if="recoveryState"
        type="error"
        :closable="false"
        show-icon
        :title="recoveryStatusText"
      >
        <template #default>
          <div class="detail">原因：{{ recoveryReasonText }}</div>
          <div class="detail">记录时间：{{ recoveryUpdatedAtText }}</div>
          <div class="actions section-actions">
            <el-button
              size="small"
              type="danger"
              :loading="dataRepoSyncing || dataRepoBackingUp"
              :disabled="Boolean(syncButtonDisabledReason)"
              @click="handleRunRecommendedRecoveryFlow"
            >
              一键执行推荐流程（同步 -> 备份）
            </el-button>
            <el-button
              size="small"
              type="primary"
              plain
              :loading="dataRepoSyncing"
              :disabled="Boolean(syncButtonDisabledReason)"
              @click="handleSyncDataRepo"
            >
              先执行同步数据仓
            </el-button>
            <el-button
              size="small"
              type="warning"
              plain
              :loading="dataRepoBackingUp"
              :disabled="Boolean(backupButtonDisabledReason)"
              @click="handleBackupDataRepo"
            >
              再尝试备份到GitHub
            </el-button>
          </div>
        </template>
      </el-alert>
      <div class="status-row">
        <el-tag size="small" :type="checkAndSyncStatusLine.tagType">{{ checkAndSyncStatusLine.text }}</el-tag>
        <span class="status-reason">{{ checkAndSyncReminderReason }}</span>
      </div>
      <div class="status-row">
        <el-tag size="small" :type="backupStatusLine.tagType">{{ backupStatusLine.text }}</el-tag>
        <span class="status-reason">{{ backupReminderReason }}</span>
      </div>
      <div class="actions section-actions">
        <el-tooltip placement="top">
          <template #content>
            <div>作用：自检后拉取最新项目数据并同步桥接事件。</div>
            <div>变化：可能更新交付项、上下文与同步状态。</div>
            <div>提醒原因：{{ checkAndSyncReminderReason }}</div>
          </template>
          <el-button :icon="Refresh" :loading="apiHealthChecking" :type="checkAndSyncButtonType" plain @click="handleCheckAndSyncProjectApi">
            {{ checkAndSyncButtonText }}
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top">
          <template #content>
            <div>作用：将本地数据仓与远端对齐。</div>
            <div>变化：ahead/behind 计数、关联状态和最新提交信息会变化。</div>
            <div>提醒原因：{{ syncReminderReason }}</div>
            <div v-if="syncButtonDisabledReason">当前不可用：{{ syncButtonDisabledReason }}</div>
          </template>
          <el-button
            :icon="Warning"
            :loading="dataRepoSyncing"
            :type="syncButtonType"
            plain
            :disabled="Boolean(syncButtonDisabledReason)"
            @click="handleSyncDataRepo"
          >
            {{ syncButtonText }}
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top">
          <template #content>
            <div>作用：把数据仓改动提交并推送到 GitHub。</div>
            <div>变化：产生新提交并影响远端备份状态。</div>
            <div>提醒原因：{{ backupReminderReason }}</div>
            <div v-if="backupButtonDisabledReason">当前不可用：{{ backupButtonDisabledReason }}</div>
          </template>
          <el-button
            :icon="UploadFilled"
            :loading="dataRepoBackingUp"
            :type="backupButtonType"
            plain
            :disabled="Boolean(backupButtonDisabledReason)"
            @click="handleBackupDataRepo"
          >
            {{ backupButtonText }}
          </el-button>
        </el-tooltip>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>常用检查</template>
      <div class="detail">这两项是“先确认环境和连接是否正常”，不会直接改你的业务功能。</div>
      <div class="actions">
        <el-tooltip placement="top">
          <template #content>
            <div>作用：检查“现在还能不能继续开发”。</div>
            <div>变化：更新环境判定结果，不会改业务数据。</div>
            <div>{{ startupUsageHint }}</div>
            <div>提醒原因：{{ startupReminderReason }}</div>
          </template>
          <el-button :icon="Refresh" :loading="projectControlLoading" :type="startupButtonType" plain @click="handleStartupCheck">
            {{ startupButtonText }}
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top">
          <template #content>
            <div>作用：只检查“页面连接通不通”。</div>
            <div>变化：仅刷新连接状态，不会同步数据、不写入远端。</div>
            <div>什么时候点：按钮报异常、页面数据疑似没刷新时。</div>
          </template>
          <el-button :icon="DataAnalysis" :loading="apiHealthChecking" :type="apiCheckButtonType" plain @click="handleCheckProjectApi">
            {{ apiCheckButtonText }}
          </el-button>
        </el-tooltip>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>当前系统状态</template>
      <el-alert :type="startupType" :closable="false" show-icon :title="startupSummaryTitle" />
      <div class="status-note">提示：{{ startupSummaryTip }}</div>
      <div v-if="isHealthy" class="status-note">当前状态健康，无需额外运维操作。</div>
      <div class="row">
        <el-tag size="small" type="info">
          数据文件状态：{{ projectFileReady ? '已连接' : '连接异常' }}
        </el-tag>
        <el-tag size="small" type="info">
          仓库关系：{{ projectLinkStatus.backupReady ? '已就绪' : '待处理' }}
        </el-tag>
        <el-tag size="small" type="info">
          接口健康：{{ apiHealthSummary }}
        </el-tag>
      </div>
      <div class="detail">同步状态：{{ syncStatusText }}</div>
      <div class="detail">最近一次数据更新时间：{{ formatDateTime(projectItemsUpdatedAt) }}</div>
      <div class="detail">
        Git状态：本地领先 {{ projectLinkStatus.ahead }} / 本地落后 {{ projectLinkStatus.behind }}
        <span v-if="projectLinkStatus.workingTreeDirty">（还有未提交改动）</span>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>最近执行结果</template>
      <div class="detail">{{ projectControlMessage }}</div>
      <div class="detail">不会命令行也没关系：按上方“建议”按钮操作即可。</div>
    </el-card>

    <el-collapse>
      <el-collapse-item title="高级诊断（可选）" name="advanced">
        <el-card shadow="never">
          <div class="detail">当前工作分支：{{ projectBranch }}（提交：{{ projectCommit }}）</div>
          <div class="detail">数据仓位置：{{ projectLinkStatus.managementRepoPath || '未配置' }}</div>
          <div class="detail">交付数据文件：{{ projectItemsFilePath || '未知' }}</div>
          <div class="tags">
            <el-tag
              v-for="item in apiHealthDetails"
              :key="item.endpoint"
              size="small"
              :type="item.ok ? 'success' : 'danger'"
            >
              {{ endpointLabel(item.endpoint) }}：{{ item.message }}
            </el-tag>
          </div>
        </el-card>

        <el-card shadow="hover" class="advanced-card">
          <template #header>日志维护（高级）</template>
          <div class="detail">适用场景：日志积累很多、需要归档清理。非日常操作，建议在阶段结束后进行。</div>
          <div class="actions">
            <el-date-picker
              v-model="logCleanupDate"
              value-format="YYYY-MM-DD"
              type="date"
              placeholder="清理此日期之前日志"
              style="width: 190px"
            />
            <el-button :icon="Refresh" :loading="logCleanupLoading" type="info" @click="handlePreviewLogCleanup">预览清理</el-button>
            <el-button :icon="Check" :loading="logCleanupLoading" :type="cleanupButtonType" @click="handleCleanupProcessLogs">
              确认清理日志
            </el-button>
          </div>
          <div class="detail">
            预览结果：桥接 {{ logCleanupPreview.bridgeRemovable }}/{{ logCleanupPreview.bridgeTotal }}，回执
            {{ logCleanupPreview.receiptsRemovable }}/{{ logCleanupPreview.receiptsTotal }}
          </div>
        </el-card>
      </el-collapse-item>
    </el-collapse>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
.page-title {
  margin: 0;
}
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.page-subtitle {
  margin-top: 6px;
  color: #606266;
  font-size: 13px;
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
