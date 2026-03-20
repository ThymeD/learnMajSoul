<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed } from 'vue'
import { Check, DataAnalysis, Refresh, UploadFilled, Warning } from '@element-plus/icons-vue'
import { useProjectManagement } from '../modules/project-management'
import { projectManagementConfig } from '../config/project-management'

type ProjectManagementUiControls = {
  dataRepoSyncing?: { value: boolean }
  dataRepoBackingUp?: { value: boolean }
  syncDataRepoByUi?: () => Promise<{ ok: boolean; message: string }>
  backupDataRepoByUi?: () => Promise<{ ok: boolean; message: string }>
}

const {
  projectName,
  projectFileSyncMessage,
  projectFileReady,
  projectBranch,
  projectCommit,
  projectItemsUpdatedAt,
  projectItemsFilePath,
  projectLinkStatus,
  projectLinkStatusMessage,
  projectStartupCheck,
  apiHealthChecking,
  apiHealthSummary,
  apiHealthDetails,
  projectControlLoading,
  projectControlMessage,
  runProjectControl,
  checkProjectFileApiHealth,
  logCleanupDate,
  logCleanupPreview,
  logCleanupLoading,
  previewLogCleanup,
  runLogCleanupWithConfirm,
  dataRepoSyncing: rawDataRepoSyncing,
  dataRepoBackingUp: rawDataRepoBackingUp,
  syncDataRepoByUi: rawSyncDataRepoByUi,
  backupDataRepoByUi: rawBackupDataRepoByUi
} = useProjectManagement() as ReturnType<typeof useProjectManagement> & ProjectManagementUiControls

const dataRepoSyncing = rawDataRepoSyncing ?? projectControlLoading
const dataRepoBackingUp = rawDataRepoBackingUp ?? projectControlLoading
const syncDataRepoByUi = rawSyncDataRepoByUi ?? (async () => runProjectControl('sync_data_repo'))
const backupDataRepoByUi = rawBackupDataRepoByUi ?? (async () => runProjectControl('backup_data_repo'))
const buttonLegend = projectManagementConfig.buttonSemantics.legend

const startupType = computed(() => {
  if (projectStartupCheck.value.severity === 'success') return 'success'
  if (projectStartupCheck.value.severity === 'error') return 'danger'
  return 'warning'
})

const startupButtonType = computed<'danger' | 'warning' | 'success'>(() => {
  if (projectStartupCheck.value.severity === 'error') return 'danger'
  if (projectStartupCheck.value.severity === 'warning') return 'warning'
  return 'success'
})

const apiCheckButtonType = computed<'warning' | 'success'>(() => {
  return apiHealthSummary.value === '全部可用' ? 'success' : 'warning'
})

const syncButtonType = computed<'danger' | 'warning'>(() => {
  if (projectLinkStatus.value.behind > 0 || !projectLinkStatus.value.backupReady) return 'danger'
  return 'warning'
})

const backupButtonType = computed<'danger' | 'success'>(() => {
  if (projectLinkStatus.value.ahead > 0 || projectLinkStatus.value.workingTreeDirty) return 'danger'
  return 'success'
})

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

async function handleStartupCheck() {
  const result = await runProjectControl('startup_check')
  if (result.ok) ElMessage.success(result.message)
  else ElMessage.warning(result.message)
}

async function handleCheckProjectApi() {
  const outcome = await checkProjectFileApiHealth()
  if (outcome.kind === 'updated_latest') {
    ElMessage.success(outcome.message)
    return
  }
  if (outcome.kind === 'no_update') {
    ElMessage.info(outcome.message)
    return
  }
  ElMessage.error(outcome.message)
}

async function handleSyncDataRepo() {
  const result = await syncDataRepoByUi()
  if (result.ok) ElMessage.success(result.message)
  else ElMessage.error(result.message)
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
  if (result.ok) ElMessage.success(result.message)
  else ElMessage.error(result.message)
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
</script>

<template>
  <div class="page">
    <div class="header">
      <h2>数据管理（{{ projectName }}）</h2>
      <div class="actions">
        <el-button :icon="Refresh" :loading="projectControlLoading" :type="startupButtonType" @click="handleStartupCheck">
          重新执行启动校验
        </el-button>
        <el-button :icon="DataAnalysis" :loading="apiHealthChecking" :type="apiCheckButtonType" @click="handleCheckProjectApi">
          连接自检
        </el-button>
        <el-button :icon="Warning" :loading="dataRepoSyncing" :type="syncButtonType" @click="handleSyncDataRepo">
          同步数据仓
        </el-button>
        <el-button :icon="UploadFilled" :loading="dataRepoBackingUp" :type="backupButtonType" @click="handleBackupDataRepo">
          备份到GitHub
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <div class="row">
        <el-tag v-for="item in buttonLegend" :key="item.type" :type="item.type">{{ item.text }}</el-tag>
      </div>
    </el-card>

    <el-alert
      :type="startupType"
      :closable="false"
      show-icon
      :title="`启动校验：${projectStartupCheck.messages[0] || '无'}`"
    />
    <el-alert v-if="isHealthy" type="success" :closable="false" show-icon title="当前状态健康，无需额外运维操作。" />

    <el-card shadow="never">
      <div class="row">
        <el-tag size="small" :type="projectFileReady ? 'success' : 'warning'">
          文件存储：{{ projectFileSyncMessage }}
        </el-tag>
        <el-tag size="small" :type="projectLinkStatus.backupReady ? 'success' : 'warning'">
          关联状态：{{ projectLinkStatusMessage }}
        </el-tag>
        <el-tag size="small" :type="apiHealthSummary === '全部可用' ? 'success' : 'info'">
          自检：{{ apiHealthSummary }}
        </el-tag>
      </div>
      <div class="detail">业务分支：{{ projectBranch }} · 提交：{{ projectCommit }}</div>
      <div class="detail">数据仓：{{ projectLinkStatus.managementRepoPath || '未配置' }}</div>
      <div class="detail">数据文件：{{ projectItemsFilePath || '未知' }}</div>
      <div class="detail">最近更新时间：{{ formatDateTime(projectItemsUpdatedAt) }}</div>
      <div class="detail">
        数据仓同步：ahead {{ projectLinkStatus.ahead }} / behind {{ projectLinkStatus.behind }}
        <span v-if="projectLinkStatus.workingTreeDirty">（含未提交变更）</span>
      </div>
      <div class="detail">执行结果：{{ projectControlMessage }}</div>
      <div class="detail">不会命令行？直接点击上方按钮即可完成数据管控。</div>
      <div class="tags">
        <el-tag
          v-for="item in apiHealthDetails"
          :key="item.endpoint"
          size="small"
          :type="item.ok ? 'success' : 'danger'"
        >
          {{ item.endpoint }}: {{ item.message }}
        </el-tag>
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>过程日志清理</template>
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
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.header h2 {
  margin: 0;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
</style>
