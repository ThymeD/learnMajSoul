<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { featureFlags } from '../config/features'
import { loadProjectLinkStatus } from '../pm/api/delivery'
import type { ProjectLinkStatus } from '../pm/api/delivery'

const router = useRouter()
const route = useRoute()

watch(
  () => route.path,
  () => {
    void refreshLinkStatus()
  }
)

const baseMenuItems = [
  { path: '/yaku', label: '役种一览', icon: 'List' },
  { path: '/rule-review', label: '规则复核', icon: 'DocumentChecked' },
  { path: '/delivery', label: '项目交付管理', icon: 'DataAnalysis', feature: 'deliveryManagement' },
  { path: '/data-management', label: '数据管理', icon: 'Setting', feature: 'deliveryManagement' },
  { path: '/home', label: '首页', icon: 'House' },
  { path: '/hand', label: '手牌分析', icon: 'Grid' },
  { path: '/tiles', label: '素材验证', icon: 'Picture' },
  { path: '/draft', label: '草稿区', icon: 'Edit' },
  { path: '/strategy', label: '策略指南', icon: 'Reading' }
]

const menuItems = baseMenuItems.filter((item) => {
  if (!('feature' in item)) return true
  return featureFlags[item.feature as keyof typeof featureFlags]
})

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const linkStatus = ref<ProjectLinkStatus | null>(null)
let statusTimer: number | undefined

type GlobalHint = {
  key: string
  type: 'info' | 'warning'
  title: string
  required: boolean
}

async function refreshLinkStatus() {
  if (!featureFlags.deliveryManagement) return
  try {
    linkStatus.value = await loadProjectLinkStatus()
  } catch {
    // ignore global reminder read failure
  }
}

const globalHint = computed(() => {
  const status = linkStatus.value
  const previewQuery = route.query.showGlobalHint
  const previewEnabled =
    previewQuery === '1' || (Array.isArray(previewQuery) && previewQuery.includes('1'))
  if (previewEnabled) {
    return {
      key: 'preview',
      type: 'info' as const,
      title:
        '全局提醒预览：未确认工作模式、或多设备模式下的同步/备份等会在此提示；点「去数据管理处理」进入数据管理页。',
      required: false
    }
  }
  if (!status) return null
  if (route.path === '/data-management') return null
  if (status.needsModeConfirmation) {
    return {
      key: 'mode-confirmation',
      type: 'warning' as const,
      title: status.modePromptReason || '检测到远程仓配置变化，请到数据管理确认工作模式。',
      required: true
    }
  }
  if (status.workingMode === 'multi_sync' && status.behind > 0) {
    return {
      key: `behind-${status.behind}`,
      type: 'warning' as const,
      title: `多设备模式提醒：本地落后远端 ${status.behind} 次提交，建议先同步数据仓。`,
      required: false
    }
  }
  if (status.workingMode === 'multi_sync' && status.ahead > 0) {
    return {
      key: `ahead-${status.ahead}`,
      type: 'info' as const,
      title: `多设备模式提醒：本地领先远端 ${status.ahead} 次提交，可在收尾时备份到 GitHub。`,
      required: false
    }
  }
  return null
})

function getHintSnoozeUntil(key: string): number {
  const raw = localStorage.getItem(`pm-global-hint-snooze:${key}`)
  const ts = Number(raw || 0)
  return Number.isFinite(ts) ? ts : 0
}

const visibleGlobalHint = computed<GlobalHint | null>(() => {
  const hint = globalHint.value as GlobalHint | null
  if (!hint) return null
  if (hint.required) return hint
  const snoozeUntil = getHintSnoozeUntil(hint.key)
  return Date.now() < snoozeUntil ? null : hint
})

const globalHintActionButtonType = computed<'primary' | 'warning'>(() => {
  return visibleGlobalHint.value?.type === 'warning' ? 'warning' : 'primary'
})

function goDataManagement() {
  void router.push('/data-management')
}

function snoozeGlobalHint(hours: number) {
  const hint = visibleGlobalHint.value
  if (!hint || hint.required) return
  const until = Date.now() + hours * 60 * 60 * 1000
  localStorage.setItem(`pm-global-hint-snooze:${hint.key}`, String(until))
}

function snoozeGlobalHintToday() {
  const hint = visibleGlobalHint.value
  if (!hint || hint.required) return
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
  localStorage.setItem(`pm-global-hint-snooze:${hint.key}`, String(endOfDay))
}

onMounted(() => {
  void refreshLinkStatus()
  statusTimer = window.setInterval(() => {
    void refreshLinkStatus()
  }, 15000)
})

onBeforeUnmount(() => {
  if (statusTimer !== undefined) {
    window.clearInterval(statusTimer)
  }
})
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="fixed-aside">
      <div class="logo">
        <h1>雀魂攻略</h1>
      </div>
      <el-menu :default-active="route.path" class="menu" @select="handleMenuSelect">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="main-content">
      <el-alert
        v-if="visibleGlobalHint"
        class="global-hint"
        :type="visibleGlobalHint.type"
        :title="visibleGlobalHint.title"
        :closable="false"
        show-icon
      >
        <template #default>
          <el-button
            class="global-hint-action-btn"
            :type="globalHintActionButtonType"
            @click="goDataManagement"
          >
            去数据管理处理
          </el-button>
          <el-button
            v-if="!visibleGlobalHint.required"
            class="global-hint-secondary-btn"
            text
            type="info"
            @click="snoozeGlobalHint(2)"
          >
            2小时后提醒
          </el-button>
          <el-button
            v-if="!visibleGlobalHint.required"
            class="global-hint-secondary-btn"
            text
            type="info"
            @click="snoozeGlobalHintToday"
          >
            今日不再提醒
          </el-button>
        </template>
      </el-alert>
      <RouterView />
    </el-main>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.fixed-aside {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.main-content {
  margin-left: 220px;
  padding: 16px;
  background: #fafafa;
  min-height: 100vh;
}
.global-hint {
  margin-bottom: 10px;
  border-radius: 10px;
  border-width: 1px;
  --el-alert-padding: 10px 14px;
}
.global-hint.el-alert--info {
  --el-alert-bg-color: #f4f9ff;
  --el-alert-border-color: #d9ecff;
  --el-alert-title-color: #2f5f9b;
  --el-alert-description-color: #2f5f9b;
  --el-color-info: #3b82f6;
}
.global-hint.el-alert--warning {
  --el-alert-bg-color: #fffaf2;
  --el-alert-border-color: #fde3b0;
  --el-alert-title-color: #8a5a00;
  --el-alert-description-color: #8a5a00;
  --el-color-warning: #d08a00;
}
.global-hint-action-btn {
  min-height: 34px;
  padding: 0 14px;
  font-weight: 600;
}
.global-hint-secondary-btn {
  min-height: 32px;
}

.logo {
  padding: 24px 16px;
  border-bottom: 1px solid #ebeef5;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.menu {
  border-right: none;
}

.menu :deep(.el-menu-item) {
  color: #606266;
}

.menu :deep(.el-menu-item:hover) {
  background: #f5f7fa;
  color: #409eff;
}

.menu :deep(.el-menu-item.is-active) {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
</style>
