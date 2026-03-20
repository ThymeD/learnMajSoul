export type ProjectMode = 'sanma' | 'yonma' | 'both'
export type ProjectItemKind = 'requirement' | 'defect' | 'todo'
export type ProjectItemStatus =
  | 'pending_ai'
  | 'ai_in_progress'
  | 'pending_user_confirm'
  | 'confirmed_done'
  | 'blocked'
export type ProjectItemPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type ProjectHandler = 'ai' | 'user' | 'collab'
export type ProjectDomain = 'management' | 'product'

export interface ProjectStatusHistoryEntry {
  fromStatus: ProjectItemStatus | 'init'
  toStatus: ProjectItemStatus
  actor: string
  note: string
  changedAt: number
}

export interface ProjectItem {
  id: string
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
  statusHistory: ProjectStatusHistoryEntry[]
  createdAt: number
  updatedAt: number
}

export interface CreateProjectItemInput {
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
