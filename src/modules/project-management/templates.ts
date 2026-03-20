import type {
  ProjectDomain,
  ProjectHandler,
  ProjectItem,
  ProjectItemKind,
  ProjectItemPriority,
  ProjectItemStatus,
  ProjectMode
} from './types'

export interface ProjectItemDraft {
  title: string
  domain: ProjectDomain
  kind: ProjectItemKind
  mode: ProjectMode
  status: ProjectItemStatus
  priority: ProjectItemPriority
  handler: ProjectHandler
  decisionOwner: string
  dueDate: string
  note: string
  evidence: string
  risk: string
  impact: string
  rollback: string
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  items: ProjectItemDraft[]
}

export function createDefaultProjectTemplates(): ProjectTemplate[] {
  return [
    {
      id: 'feature-iteration',
      name: '特性迭代模板',
      description: '适合新增功能从需求到验收的标准流程',
      items: [
        {
          title: '梳理需求边界与验收标准',
          domain: 'product',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '补充需求文档、边界条件、验收清单',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '实现核心功能',
          domain: 'product',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '按模块拆解实现，避免单文件过重',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '回归测试与风险复核',
          domain: 'product',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '补充自动化测试并验证关键流程',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        }
      ]
    },
    {
      id: 'bugfix-iteration',
      name: '缺陷修复模板',
      description: '适合线上问题修复闭环',
      items: [
        {
          title: '登记缺陷复现步骤与影响范围',
          domain: 'product',
          kind: 'defect',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P0',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '记录期望/实际、复现步骤、影响范围',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '定位根因并修复',
          domain: 'product',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P0',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '优先修复根因，避免症状修补',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '补充回归用例并关闭缺陷',
          domain: 'product',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '补回归测试，更新缺陷状态和证据',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        }
      ]
    },
    {
      id: 'rule-review-iteration',
      name: '规则优化模板',
      description: '适合麻将规则复核与实现对齐',
      items: [
        {
          title: '规则复核决策整理',
          domain: 'product',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '按三麻/四麻分离规则并记录决策',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '实现规则引擎修正（非时序役）',
          domain: 'product',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '时序役延后到人机对局阶段',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '规则与UI展示一致性验证',
          domain: 'product',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P2',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '确保界面中文展示与代码规范ID映射一致',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        }
      ]
    },
    {
      id: 'management-optimization',
      name: '项目管理优化模板',
      description: '适合优化AI与用户协作、流程与可视化机制',
      items: [
        {
          title: '梳理当前交付流程痛点',
          domain: 'management',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '明确是流程、看板、日志还是协作机制问题',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '实现流程/看板优化',
          domain: 'management',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '优先优化用户与AI交付桥接路径',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        },
        {
          title: '验证协作链路与日志可追溯',
          domain: 'management',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P2',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '确认用户可快速通过/打回并留痕',
          evidence: '',
          risk: '',
          impact: '',
          rollback: ''
        }
      ]
    }
  ]
}

export function materializeTemplateItems(
  drafts: ProjectItemDraft[],
  createItem: (draft: ProjectItemDraft) => ProjectItem
): ProjectItem[] {
  return drafts.map((draft) => createItem(draft))
}
