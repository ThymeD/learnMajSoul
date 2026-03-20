<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { onBeforeUnmount, ref } from 'vue'
import { DataAnalysis, Download, FolderChecked, Switch, Tools } from '@element-plus/icons-vue'
import { projectManagementConfig } from '../config/project-management'
import type {
  DeliveryDomain,
  DeliveryHandler,
  DeliveryItem,
  DeliveryKind,
  DeliveryMode,
  DeliveryPriority,
  DeliveryStatus
} from '../data/delivery'
import { useProjectManagement } from '../modules/project-management'

const router = useRouter()
const showMoreHeaderActions = ref(false)
const buttonLegend = projectManagementConfig.buttonSemantics.legend

const {
  projectName,
  labels,
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
  bridgeSyncing,
  bridgeFailedEvents,
  writeLockReason,
  writeLockRequired,
  writeLockActive,
  timelineActors,
  searchText,
  viewMode,
  items,
  kanbanStatuses,
  handlerOptions,
  templates,
  selectedTemplateId,
  draft,
  filteredItems,
  timelineEntries,
  filteredTimelineEntries,
  stats,
  pendingUserConfirmItems,
  addItem,
  updateStatus,
  submitByAiForUserConfirm,
  userConfirmDelivery,
  userRejectDelivery,
  getAvailableStatuses,
  removeItem,
  restoreItem,
  groupedItemsByStatus,
  importAcceptedRuleReviewItems,
  importTemplateItems,
  exportSnapshot,
  exportTimeline,
  syncBridgeEventsNow,
  unlockWriteWithRiskAck,
  relockWrites,
} = useProjectManagement()

const recentlyRemovedItem = ref<DeliveryItem | null>(null)
const recentlyRemovedIndex = ref(0)
let removeUndoTimer: ReturnType<typeof setTimeout> | undefined

function onCardDragStart(event: DragEvent, itemId: string) {
  event.dataTransfer?.setData('text/plain', itemId)
  event.dataTransfer?.setData('source', 'delivery-kanban')
}

function onKanbanDrop(event: DragEvent, status: DeliveryStatus) {
  if (!assertWriteAllowed('拖拽更新状态')) return
  event.preventDefault()
  const source = event.dataTransfer?.getData('source')
  if (source !== 'delivery-kanban') return
  const itemId = event.dataTransfer?.getData('text/plain')
  if (!itemId) return
  const item = items.value.find((i) => i.id === itemId)
  if (!item) return
  const fromStatus = item.status
  const result = updateStatus(item, status)
  if (!result.ok) {
    ElMessage.warning(`不支持从「${statusLabel(fromStatus)}」拖拽到「${statusLabel(status)}」`)
  }
}

function handleImportAcceptedRuleReviewItems() {
  if (!assertWriteAllowed('导入复核项')) return
  const created = importAcceptedRuleReviewItems()
  ElMessage.success(created > 0 ? `已导入 ${created} 条复核任务` : '没有可导入的新条目')
}

function handleImportTemplateItems() {
  if (!assertWriteAllowed('导入模板')) return
  const { count, name } = importTemplateItems()
  if (count === 0) {
    ElMessage.info('模板条目已存在，未重复导入')
    return
  }
  ElMessage.success(`已导入模板：${name}（${count}条）`)
}

function handleAddItem() {
  if (!assertWriteAllowed('新增交付项')) return
  const result = addItem()
  if (!result.ok) {
    ElMessage.warning('请先填写标题')
    return
  }
  ElMessage.success('已新增交付项')
  if (result.warning) {
    ElMessage.warning(result.warning)
  }
}

function handleExportSnapshot() {
  exportSnapshot()
  ElMessage.success('已导出交付快照')
}

function handleExportTimeline(format: 'json' | 'csv') {
  exportTimeline(format)
  ElMessage.success(`已导出时间轴（${format.toUpperCase()}）`)
}

async function handleSyncBridgeEvents() {
  const result = await syncBridgeEventsNow()
  if (result.failed > 0) {
    ElMessage.warning(`桥接同步完成：成功 ${result.applied} 条，失败 ${result.failed} 条，请处理失败记录`)
    return
  }
  if (result.applied > 0) {
    ElMessage.success(`已同步 ${result.applied} 条AI桥接事件`)
  } else {
    ElMessage.info('桥接同步完成（无新事件）')
  }
}

function handleStatusChange(row: DeliveryItem, status: DeliveryStatus) {
  if (!assertWriteAllowed('修改状态')) return
  const fromStatus = row.status
  const result = updateStatus(row, status)
  if (!result.ok) {
    ElMessage.warning(`不支持从「${statusLabel(fromStatus)}」切换到「${statusLabel(status)}」`)
    return
  }
  ElMessage.success(`已变更：${statusLabel(fromStatus)} -> ${statusLabel(status)}`)
}

function handleStatusSelect(row: DeliveryItem, value: unknown) {
  handleStatusChange(row, value as DeliveryStatus)
}

async function handleRemoveItem(id: string) {
  if (!assertWriteAllowed('删除条目')) return
  const index = items.value.findIndex((item) => item.id === id)
  const target = index >= 0 ? items.value[index] : null
  if (!target) return
  try {
    await ElMessageBox.confirm(`将删除「${target.title}」，是否继续？`, '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  removeItem(id)
  if (removeUndoTimer) {
    clearTimeout(removeUndoTimer)
  }
  recentlyRemovedItem.value = target
  recentlyRemovedIndex.value = index
  removeUndoTimer = setTimeout(() => {
    recentlyRemovedItem.value = null
  }, 10000)
  ElMessage.success('已删除交付项，可在10秒内撤销')
}

function handleUndoRemove() {
  if (!recentlyRemovedItem.value) return
  restoreItem(recentlyRemovedItem.value, recentlyRemovedIndex.value)
  recentlyRemovedItem.value = null
  if (removeUndoTimer) {
    clearTimeout(removeUndoTimer)
  }
  ElMessage.success('已撤销删除')
}

async function handleRetryBridgeFailures() {
  const result = await syncBridgeEventsNow()
  if (result.failed > 0) {
    ElMessage.warning(`重试完成：仍有 ${result.failed} 条失败，请检查条目是否存在或状态是否合法`)
    return
  }
  ElMessage.success('桥接失败项已重试完成')
}

function handleSubmitByAiForUserConfirm(item: DeliveryItem) {
  if (!assertWriteAllowed('提交用户确认')) return
  const result = submitByAiForUserConfirm(item, 'AI提交用户确认')
  if (!result.ok) {
    ElMessage.warning(result.message || '当前状态不允许提交用户确认')
    return
  }
  ElMessage.success('已提交用户确认')
}

function handleUserConfirm(item: DeliveryItem) {
  if (!assertWriteAllowed('用户确认完成')) return
  const note = bridgeReviewNote.value.trim() || '用户确认通过'
  const result = userConfirmDelivery(item, note)
  if (!result.ok) {
    ElMessage.warning(result.message || '当前状态不允许确认完成')
    return
  }
  bridgeReviewNote.value = ''
  ElMessage.success('已确认交付完成')
}

function handleUserReject(item: DeliveryItem) {
  if (!assertWriteAllowed('打回AI')) return
  const note = bridgeReviewNote.value.trim() || '用户打回AI继续处理'
  const result = userRejectDelivery(item, note)
  if (!result.ok) {
    ElMessage.warning(result.message || '当前状态不允许打回AI')
    return
  }
  bridgeReviewNote.value = ''
  ElMessage.success('已打回AI继续处理')
}

function clearTimelineFilters() {
  timelineActorFilter.value = 'all'
  timelineStatusFilter.value = 'all'
  timelineStartDate.value = ''
  timelineEndDate.value = ''
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function assertWriteAllowed(action: string): boolean {
  if (!writeLockActive.value) return true
  ElMessage.warning(`${action}已被锁定：${writeLockReason.value}。如需继续，请先手动解锁。`)
  return false
}

function handleUnlockWriteLock() {
  unlockWriteWithRiskAck()
  ElMessage.warning('已按你的确认临时解锁写操作，请谨慎修改并尽快同步仓库状态。')
}

function handleRelockWriteLock() {
  relockWrites()
  ElMessage.info('已重新启用写操作锁。')
}

function handleGoDataManagement() {
  void router.push('/data-management')
}

function toggleMoreHeaderActions() {
  showMoreHeaderActions.value = !showMoreHeaderActions.value
}

function latestStatusHistory(item: DeliveryItem): string {
  const last = item.statusHistory[item.statusHistory.length - 1]
  if (!last) return '无'
  const base = `${formatDateTime(last.changedAt)} ${last.actor}`
  return last.note ? `${base}：${last.note}` : base
}

function kindLabel(kind: DeliveryKind): string {
  return labels.kind[kind]
}

function domainLabel(domain: DeliveryDomain): string {
  return labels.domain[domain]
}

function modeLabel(mode: DeliveryMode): string {
  return labels.mode[mode]
}

function statusLabel(status: DeliveryStatus): string {
  return labels.status[status]
}

function statusOrInitLabel(status: DeliveryStatus | 'init'): string {
  if (status === 'init') return '创建'
  return statusLabel(status)
}

function priorityLabel(priority: DeliveryPriority): string {
  return labels.priority[priority]
}

function handlerLabel(handler: DeliveryHandler): string {
  return labels.handler[handler]
}

function statusTagType(status: DeliveryStatus): 'info' | 'warning' | 'danger' | 'success' | 'primary' {
  if (status === 'pending_ai') return 'info'
  if (status === 'ai_in_progress') return 'warning'
  if (status === 'blocked') return 'danger'
  if (status === 'pending_user_confirm') return 'primary'
  return 'success'
}

const priorityOptions: DeliveryPriority[] = ['P0', 'P1', 'P2', 'P3']

onBeforeUnmount(() => {
  if (removeUndoTimer) {
    clearTimeout(removeUndoTimer)
  }
})
</script>

<template>
  <div class="delivery-page">
    <div class="header">
      <h2>{{ labels.pageTitle }}（{{ projectName }}）</h2>
      <div class="header-actions">
        <el-segmented
          v-model="viewMode"
          :options="[
            { label: '列表视图', value: 'table' },
            { label: '看板视图', value: 'kanban' }
          ]"
        />
        <el-button :icon="Switch" :loading="bridgeSyncing" type="warning" plain @click="handleSyncBridgeEvents">
          同步AI桥接
        </el-button>
        <el-button :icon="DataAnalysis" plain @click="handleGoDataManagement">前往数据管理</el-button>
        <el-button :icon="Tools" link type="primary" @click="toggleMoreHeaderActions">
          {{ showMoreHeaderActions ? '收起操作' : '更多操作' }}
        </el-button>
        <template v-if="showMoreHeaderActions">
          <el-button
            :icon="FolderChecked"
            type="primary"
            plain
            :disabled="writeLockActive"
            @click="handleImportAcceptedRuleReviewItems"
          >
            导入复核已确认项
          </el-button>
          <el-button :icon="Download" type="success" plain @click="handleExportSnapshot">导出快照</el-button>
          <el-tag type="info">上线前可通过 feature flag 隐藏入口</el-tag>
        </template>
      </div>
    </div>

    <el-card shadow="never">
      <div class="header-actions">
        <el-tag v-for="item in buttonLegend" :key="item.type" :type="item.type">{{ item.text }}</el-tag>
      </div>
    </el-card>

    <el-alert
      v-if="writeLockRequired"
      :type="writeLockActive ? 'error' : 'warning'"
      :closable="false"
      show-icon
      :title="writeLockActive ? `写操作已锁定：${writeLockReason}` : '写操作锁已手动解锁（风险模式）'"
    >
      <template #default>
        <div class="lock-alert-actions">
          <el-button v-if="writeLockActive" size="small" type="danger" plain @click="handleUnlockWriteLock">
            我已知晓风险，手动解锁
          </el-button>
          <el-button v-else size="small" type="warning" plain @click="handleRelockWriteLock">
            重新上锁
          </el-button>
        </div>
      </template>
    </el-alert>

    <el-alert
      v-if="recentlyRemovedItem"
      type="warning"
      :closable="false"
      show-icon
      title="条目已删除，可在10秒内撤销"
    >
      <template #default>
        <div class="lock-alert-actions">
          <span>{{ recentlyRemovedItem.title }}</span>
          <el-button size="small" type="warning" plain @click="handleUndoRemove">撤销删除</el-button>
        </div>
      </template>
    </el-alert>

    <el-card shadow="hover">
      <template #header>交付桥接面板（AI -> 用户）</template>
      <el-alert
        v-if="bridgeFailedEvents.length > 0"
        type="error"
        :closable="false"
        show-icon
        :title="`桥接失败 ${bridgeFailedEvents.length} 条，请处理后重试`"
      >
        <template #default>
          <div class="bridge-failure-list">
            <div v-for="event in bridgeFailedEvents.slice(0, 5)" :key="event.id" class="timeline-sub">
              {{ event.action }} · {{ event.itemId }} · {{ event.reason }}（重试 {{ event.retryCount }} 次）
            </div>
            <el-button size="small" type="danger" plain :loading="bridgeSyncing" @click="handleRetryBridgeFailures">
              重试失败项
            </el-button>
          </div>
        </template>
      </el-alert>
      <div v-if="pendingUserConfirmItems.length === 0" class="timeline-empty">当前没有待用户确认项</div>
      <div v-else class="timeline-list">
        <div v-for="item in pendingUserConfirmItems" :key="item.id" class="timeline-item">
          <div class="timeline-main">{{ item.title }}</div>
          <div class="timeline-sub">
            {{ domainLabel(item.domain) }} / {{ kindLabel(item.kind) }} / {{ modeLabel(item.mode) }} / {{ priorityLabel(item.priority) }}
          </div>
          <div class="timeline-sub">AI证据：{{ item.evidence || '未填写' }}</div>
          <div class="timeline-sub">补充：{{ item.note || '无' }}</div>
          <div class="bridge-actions">
            <el-button size="small" type="success" plain :disabled="writeLockActive" @click="handleUserConfirm(item)">用户通过</el-button>
            <el-button size="small" type="warning" plain :disabled="writeLockActive" @click="handleUserReject(item)">打回AI</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <div class="stats-grid">
      <el-card shadow="hover"><div>总项：{{ stats.total }}</div></el-card>
      <el-card shadow="hover"><div>AI执行中：{{ stats.inProgress }}</div></el-card>
      <el-card shadow="hover"><div>阻塞：{{ stats.blocked }}</div></el-card>
      <el-card shadow="hover"><div>待用户确认：{{ stats.waitingUserConfirm }}</div></el-card>
      <el-card shadow="hover"><div>完成率：{{ stats.completion }}%</div></el-card>
    </div>

    <el-card shadow="hover">
      <template #header>新增交付项</template>
      <div class="form-row">
        <el-input v-model="draft.title" placeholder="标题（必填）" />
        <el-select v-model="draft.domain" style="width: 140px">
          <el-option :label="labels.domain.management" value="management" />
          <el-option :label="labels.domain.product" value="product" />
        </el-select>
        <el-select v-model="draft.kind" style="width: 120px">
          <el-option :label="labels.kind.requirement" value="requirement" />
          <el-option :label="labels.kind.defect" value="defect" />
          <el-option :label="labels.kind.todo" value="todo" />
        </el-select>
        <el-select v-model="draft.mode" style="width: 130px">
          <el-option :label="labels.mode.both" value="both" />
          <el-option :label="labels.mode.sanma" value="sanma" />
          <el-option :label="labels.mode.yonma" value="yonma" />
        </el-select>
        <el-select v-model="draft.priority" style="width: 190px">
          <el-option v-for="p in priorityOptions" :key="p" :label="priorityLabel(p)" :value="p" />
        </el-select>
        <el-select v-model="draft.handler" style="width: 130px">
          <el-option v-for="h in handlerOptions" :key="h" :label="handlerLabel(h)" :value="h" />
        </el-select>
        <el-input
          v-if="labels.visibility.decisionOwner"
          v-model="draft.decisionOwner"
          :placeholder="labels.fields.decisionOwner"
          style="width: 140px"
        />
        <el-date-picker v-model="draft.dueDate" value-format="YYYY-MM-DD" type="date" placeholder="截止日期" style="width: 150px" />
        <el-button type="primary" :disabled="writeLockActive" @click="handleAddItem">新增</el-button>
      </div>
      <el-input v-model="draft.note" type="textarea" :rows="2" placeholder="补充信息入口：背景、风险、参考链接等" />
      <div class="form-row">
        <el-input v-model="draft.evidence" :placeholder="labels.fields.evidence" />
        <el-input v-model="draft.impact" :placeholder="labels.fields.impact" />
      </div>
      <div v-if="labels.visibility.riskAndRollback" class="form-row">
        <el-input v-model="draft.risk" :placeholder="labels.fields.risk" />
        <el-input v-model="draft.rollback" :placeholder="labels.fields.rollback" />
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>筛选与进度列表</template>
      <div class="form-row">
        <el-select v-model="selectedTemplateId" style="width: 200px">
          <el-option v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id" />
        </el-select>
        <el-button type="primary" plain :disabled="writeLockActive" @click="handleImportTemplateItems">导入模板</el-button>
        <el-select v-model="domainFilter" style="width: 140px">
          <el-option :label="labels.domain.all" value="all" />
          <el-option :label="labels.domain.management" value="management" />
          <el-option :label="labels.domain.product" value="product" />
        </el-select>
        <el-select v-model="modeFilter" style="width: 140px">
          <el-option :label="labels.mode.all" value="all" />
          <el-option :label="labels.mode.both" value="both" />
          <el-option :label="labels.mode.sanma" value="sanma" />
          <el-option :label="labels.mode.yonma" value="yonma" />
        </el-select>
        <el-select v-model="kindFilter" style="width: 120px">
          <el-option :label="labels.kind.all" value="all" />
          <el-option :label="labels.kind.requirement" value="requirement" />
          <el-option :label="labels.kind.defect" value="defect" />
          <el-option :label="labels.kind.todo" value="todo" />
        </el-select>
        <el-select v-model="statusFilter" style="width: 140px">
          <el-option :label="labels.status.all" value="all" />
          <el-option :label="labels.status.pending_ai" value="pending_ai" />
          <el-option :label="labels.status.ai_in_progress" value="ai_in_progress" />
          <el-option :label="labels.status.blocked" value="blocked" />
          <el-option :label="labels.status.pending_user_confirm" value="pending_user_confirm" />
          <el-option :label="labels.status.confirmed_done" value="confirmed_done" />
        </el-select>
        <el-input v-model="statusChangeActor" placeholder="状态操作人（默认用户）" style="width: 170px" />
        <el-input v-model="statusChangeNote" placeholder="状态变更备注（可选）" style="width: 220px" clearable />
        <el-input v-model="searchText" placeholder="搜索标题/备注/确认人/证据" clearable />
      </div>

      <div class="bridge-toolbar">
        <el-input
          v-model="bridgeReviewNote"
          placeholder="桥接备注（用于用户确认/打回，留空将使用默认文案）"
          clearable
        />
      </div>

      <el-table v-if="viewMode === 'table'" :data="filteredItems" size="small" style="width: 100%">
        <el-table-column prop="title" :label="labels.fields.title" min-width="220" />
        <el-table-column :label="labels.fields.domain" width="120">
          <template #default="{ row }">{{ domainLabel(row.domain) }}</template>
        </el-table-column>
        <el-table-column :label="labels.fields.kind" width="80">
          <template #default="{ row }">{{ kindLabel(row.kind) }}</template>
        </el-table-column>
        <el-table-column :label="labels.fields.mode" width="100">
          <template #default="{ row }">{{ modeLabel(row.mode) }}</template>
        </el-table-column>
        <el-table-column :label="labels.fields.priority" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ priorityLabel(row.priority) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.fields.handler" width="100">
          <template #default="{ row }">{{ handlerLabel(row.handler) }}</template>
        </el-table-column>
        <el-table-column v-if="labels.visibility.decisionOwner" prop="decisionOwner" :label="labels.fields.decisionOwner" width="100" />
        <el-table-column prop="dueDate" :label="labels.fields.dueDate" width="110" />
        <el-table-column :label="labels.fields.status" width="160">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              style="width: 120px"
              :disabled="writeLockActive"
              @change="handleStatusSelect(row, $event)"
            >
              <el-option
                v-for="s in getAvailableStatuses(row.status)"
                :key="s"
                :label="statusLabel(s)"
                :value="s"
              />
            </el-select>
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="桥接动作" width="180">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'ai_in_progress'"
              size="small"
              type="primary"
              plain
                :disabled="writeLockActive"
              @click="handleSubmitByAiForUserConfirm(row)"
            >
              AI提交确认
            </el-button>
            <el-space v-else-if="row.status === 'pending_user_confirm'">
              <el-button size="small" type="success" plain :disabled="writeLockActive" @click="handleUserConfirm(row)">用户通过</el-button>
              <el-button size="small" type="warning" plain :disabled="writeLockActive" @click="handleUserReject(row)">打回AI</el-button>
            </el-space>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" :label="labels.fields.note" min-width="240" />
        <el-table-column prop="evidence" :label="labels.fields.evidence" min-width="180" show-overflow-tooltip />
        <el-table-column prop="impact" :label="labels.fields.impact" min-width="160" show-overflow-tooltip />
        <el-table-column
          v-if="labels.visibility.riskAndRollback"
          prop="risk"
          :label="labels.fields.risk"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="labels.visibility.riskAndRollback"
          prop="rollback"
          :label="labels.fields.rollback"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="状态日志" min-width="220">
          <template #default="{ row }">
            <el-popover trigger="hover" placement="left" width="420">
              <template #reference>
                <span class="history-preview">{{ latestStatusHistory(row) }}</span>
              </template>
              <div class="history-list">
                <div v-for="(entry, idx) in row.statusHistory" :key="idx" class="history-item">
                  <div>
                    {{ formatDateTime(entry.changedAt) }} · {{ entry.actor }} ·
                    {{ entry.fromStatus === 'init' ? '创建' : statusLabel(entry.fromStatus) }} -> {{ statusLabel(entry.toStatus) }}
                  </div>
                  <div class="history-note">{{ entry.note || '无备注' }}</div>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column :label="labels.fields.actions" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" :disabled="writeLockActive" @click="handleRemoveItem(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="kanban-board">
        <div
          v-for="status in kanbanStatuses"
          :key="status"
          class="kanban-column"
          @dragover.prevent
          @drop="(e) => onKanbanDrop(e, status)"
        >
          <div class="kanban-title">
            {{ statusLabel(status) }}（{{ groupedItemsByStatus(status).length }}）
          </div>
          <div class="kanban-list">
            <div
              v-for="item in groupedItemsByStatus(status)"
              :key="item.id"
              class="kanban-card"
              draggable="true"
              @dragstart="(e) => onCardDragStart(e, item.id)"
            >
              <div class="kanban-card-title">{{ item.title }}</div>
              <div class="kanban-meta">
                <el-tag size="small" type="primary">{{ domainLabel(item.domain) }}</el-tag>
                <el-tag size="small">{{ kindLabel(item.kind) }}</el-tag>
                <el-tag size="small" type="warning">{{ priorityLabel(item.priority) }}</el-tag>
                <el-tag size="small" type="info">{{ modeLabel(item.mode) }}</el-tag>
                <el-tag size="small">{{ handlerLabel(item.handler) }}</el-tag>
              </div>
              <div class="kanban-note">{{ item.note || '无补充信息' }}</div>
              <div class="kanban-note">证据：{{ item.evidence || '无' }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>状态变更时间轴（只读）</template>
      <div class="form-row">
        <el-select v-model="timelineActorFilter" style="width: 160px">
          <el-option label="全部操作者" value="all" />
          <el-option v-for="actor in timelineActors" :key="actor" :label="actor" :value="actor" />
        </el-select>
        <el-select v-model="timelineStatusFilter" style="width: 160px">
          <el-option label="全部目标状态" value="all" />
          <el-option :label="labels.status.pending_ai" value="pending_ai" />
          <el-option :label="labels.status.ai_in_progress" value="ai_in_progress" />
          <el-option :label="labels.status.blocked" value="blocked" />
          <el-option :label="labels.status.pending_user_confirm" value="pending_user_confirm" />
          <el-option :label="labels.status.confirmed_done" value="confirmed_done" />
        </el-select>
        <el-date-picker
          v-model="timelineStartDate"
          value-format="YYYY-MM-DD"
          type="date"
          placeholder="开始日期"
          style="width: 140px"
        />
        <el-date-picker
          v-model="timelineEndDate"
          value-format="YYYY-MM-DD"
          type="date"
          placeholder="结束日期"
          style="width: 140px"
        />
        <el-button plain @click="clearTimelineFilters">重置筛选</el-button>
        <el-button type="primary" plain @click="handleExportTimeline('json')">导出JSON</el-button>
        <el-button type="success" plain @click="handleExportTimeline('csv')">导出CSV</el-button>
      </div>
      <div class="timeline-tip">共 {{ filteredTimelineEntries.length }} 条（总 {{ timelineEntries.length }} 条）</div>
      <div v-if="timelineEntries.length === 0" class="timeline-empty">暂无状态变更记录</div>
      <div v-else-if="filteredTimelineEntries.length === 0" class="timeline-empty">当前筛选条件下无记录</div>
      <div v-else class="timeline-list">
        <div
          v-for="entry in filteredTimelineEntries"
          :key="`${entry.itemId}-${entry.changedAt}-${entry.toStatus}`"
          class="timeline-item"
        >
          <div class="timeline-main">
            {{ formatDateTime(entry.changedAt) }} · {{ entry.actor }} · {{ entry.title }}
          </div>
          <div class="timeline-sub">
            {{ domainLabel(entry.domain) }} / {{ kindLabel(entry.kind) }} / {{ modeLabel(entry.mode) }} ·
            {{ statusOrInitLabel(entry.fromStatus) }} -> {{ statusLabel(entry.toStatus) }}
          </div>
          <div class="timeline-sub">备注：{{ entry.note || '无' }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.delivery-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.header h2 {
  margin: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.kanban-column {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f8f9fb;
  min-height: 360px;
  padding: 8px;
}

.kanban-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 600;
}

.kanban-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  border: 1px solid #e4e7ed;
  background: #fff;
  border-radius: 6px;
  padding: 8px;
  cursor: grab;
}

.kanban-card-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.kanban-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.kanban-note {
  font-size: 12px;
  color: #909399;
  white-space: pre-wrap;
}

.history-preview {
  font-size: 12px;
  color: #606266;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow: auto;
}

.history-item {
  border-bottom: 1px dashed #ebeef5;
  padding-bottom: 6px;
}

.history-note {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.timeline-empty {
  font-size: 13px;
  color: #909399;
}

.timeline-tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}

.timeline-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px;
  background: #fafafa;
}

.timeline-main {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}

.timeline-sub {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.bridge-toolbar {
  margin-bottom: 8px;
}

.bridge-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.bridge-failure-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.muted-text {
  color: #c0c4cc;
  font-size: 12px;
}

.api-health {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-strip {
  border: 1px solid #ebeef5;
}

.status-strip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lock-alert-actions {
  margin-top: 8px;
}
</style>
