import { createDefaultProjectTemplates, type ProjectTemplate } from './core'
import type {
  ProjectDomain,
  ProjectHandler,
  ProjectItemKind,
  ProjectItemPriority,
  ProjectItemStatus,
  ProjectMode
} from './core'

interface LabelMap {
  pageTitle: string
  domain: Record<'all' | ProjectDomain, string>
  mode: Record<'all' | ProjectMode, string>
  kind: Record<'all' | ProjectItemKind, string>
  status: Record<'all' | ProjectItemStatus, string>
  handler: Record<ProjectHandler, string>
  priority: Record<ProjectItemPriority, string>
  fields: {
    title: string
    domain: string
    kind: string
    mode: string
    priority: string
    handler: string
    decisionOwner: string
    dueDate: string
    status: string
    note: string
    evidence: string
    risk: string
    impact: string
    rollback: string
    actions: string
  }
  visibility: {
    decisionOwner: boolean
    riskAndRollback: boolean
  }
}

export interface ProjectManagementConfig {
  projectKey: string
  projectName: string
  templates: ProjectTemplate[]
  labels: LabelMap
  buttonSemantics: {
    scopedRoutes: string[]
    legend: { type: 'danger' | 'warning' | 'success' | 'primary'; text: string }[]
  }
}

export const projectManagementConfig: ProjectManagementConfig = {
  projectKey: 'learnMajSoul',
  projectName: '雀魂麻将游戏攻略',
  templates: createDefaultProjectTemplates(),
  buttonSemantics: {
    scopedRoutes: ['/delivery', '/data-management'],
    legend: [
      { type: 'danger', text: '红：紧急且需用户立即处理' },
      { type: 'warning', text: '黄：建议用户处理' },
      { type: 'success', text: '绿：状态正常' },
      { type: 'primary', text: '蓝：业务功能操作' }
    ]
  },
  labels: {
    pageTitle: '交付管理',
    domain: {
      all: '全部对象',
      management: '项目管理优化',
      product: '项目业务需求'
    },
    mode: {
      all: '全部模式',
      both: '三麻/四麻',
      sanma: '三麻',
      yonma: '四麻'
    },
    kind: {
      all: '全部类型',
      requirement: '需求',
      defect: '缺陷',
      todo: '待办'
    },
    status: {
      all: '全部状态',
      pending_ai: '待AI执行',
      ai_in_progress: 'AI执行中',
      blocked: '阻塞',
      pending_user_confirm: '待用户确认',
      confirmed_done: '已确认完成'
    },
    handler: {
      ai: 'AI',
      user: '用户',
      collab: 'AI+用户'
    },
    priority: {
      P0: '紧急（马上处理）',
      P1: '高优先（本迭代）',
      P2: '中优先（排期中）',
      P3: '低优先（可延后）'
    },
    fields: {
      title: '标题',
      domain: '目标对象',
      kind: '类型',
      mode: '模式',
      priority: '优先级',
      handler: '处理方',
      decisionOwner: '确认人',
      dueDate: '截止日期',
      status: '状态',
      note: '补充信息',
      evidence: '执行证据',
      risk: '风险',
      impact: '影响面',
      rollback: '回滚方案',
      actions: '操作'
    },
    visibility: {
      decisionOwner: true,
      riskAndRollback: true
    }
  }
}
