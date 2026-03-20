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
    },
    {
      id: 'delivery-data-page-hardening',
      name: '交付与数据页优化跟踪',
      description: '用于跟踪交付管理页、数据管理页的体验与稳定性优化',
      items: [
        {
          title: '修复桥接事件误消费（失败事件不可直接标记已处理）',
          domain: 'management',
          kind: 'defect',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P0',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '仅成功应用的桥接事件才能写入 appliedIds；失败事件进入可重试队列并可见',
          evidence: '',
          risk: '桥接数据可能遗漏，导致任务状态与真实执行不一致',
          impact: '交付状态可信度下降，影响后续排期与决策',
          rollback: '保留旧逻辑开关，异常时切回旧路径'
        },
        {
          title: '删除交付项增加二次确认与短时撤销',
          domain: 'management',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P0',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '删除前确认“是否删除”，删除后提示“已删除，可在N秒内撤销”',
          evidence: '',
          risk: '误删后恢复成本高',
          impact: '用户信任和操作安全性下降',
          rollback: '仅保留二次确认，暂不启用撤销'
        },
        {
          title: '日志清理前强制预览并校验预览时效',
          domain: 'management',
          kind: 'defect',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P0',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '确认清理前自动触发预览；若预览过旧或条件变化则要求重新预览',
          evidence: '',
          risk: '清理数量与用户预期不一致，存在误清理',
          impact: '可追溯日志受损，排障成本上升',
          rollback: '仅做强制预览，不做时效校验'
        },
        {
          title: '降低轮询开销（可见性暂停 + 退避策略）',
          domain: 'management',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '页面隐藏时暂停轮询；连续无更新按 5s/15s/30s 退避；用户操作后立即刷新',
          evidence: '',
          risk: '频繁轮询导致性能消耗和日志噪音',
          impact: '页面卡顿、资源浪费、告警噪声增多',
          rollback: '保留固定轮询间隔作为兜底'
        },
        {
          title: '拆分“连接自检”与“自检并同步”操作语义',
          domain: 'management',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '按钮命名与行为一致，避免“只想检查却触发写操作”',
          evidence: '',
          risk: '用户误触导致状态变化不可预期',
          impact: '学习成本和误操作成本上升',
          rollback: '保留单按钮，但补充明确提示'
        },
        {
          title: '状态流转可解释化（不可达状态说明）',
          domain: 'management',
          kind: 'todo',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '状态下拉中对不可流转路径展示原因提示，降低试错',
          evidence: '',
          risk: '用户不清楚为什么不能改状态',
          impact: '效率下降，沟通成本上升',
          rollback: '先在文案中补充流转规则说明'
        },
        {
          title: '交付列表支持批量操作（批量改状态/指派）',
          domain: 'management',
          kind: 'requirement',
          mode: 'both',
          status: 'pending_ai',
          priority: 'P1',
          handler: 'ai',
          decisionOwner: '',
          dueDate: '',
          note: '支持多选后批量执行常见动作，减少重复点击',
          evidence: '',
          risk: '单条操作在任务量大时效率低',
          impact: '迭代执行速度慢，易出错',
          rollback: '先补批量状态修改，后续再加批量指派'
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
