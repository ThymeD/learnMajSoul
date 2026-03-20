import { loadNormalizedObjectMap, saveNormalizedObjectMap } from '../../utils/storage-map'
import type { CreateProjectItemInput, ProjectItem, ProjectStatusHistoryEntry } from './types'

function normalizeProjectItemId(id: string): string {
  return id
}

function buildStorageKey(projectKey: string): string {
  return `${projectKey}-delivery-items-v1`
}

function normalizeStatus(status: string | undefined): ProjectItem['status'] {
  if (status === 'pending' || status === 'pending_ai') return 'pending_ai'
  if (status === 'in_progress' || status === 'ai_in_progress') return 'ai_in_progress'
  if (status === 'review' || status === 'pending_user_confirm') return 'pending_user_confirm'
  if (status === 'done' || status === 'confirmed_done') return 'confirmed_done'
  if (status === 'blocked') return 'blocked'
  return 'pending_ai'
}

function normalizeDomain(domain: string | undefined): ProjectItem['domain'] {
  if (domain === 'management' || domain === 'product') return domain
  return 'product'
}

function normalizeItem(item: ProjectItem & { owner?: string }): ProjectItem {
  const history = Array.isArray(item.statusHistory) ? item.statusHistory : []
  const normalizedHistory = history
    .map((entry) => ({
      ...entry,
      fromStatus:
        entry.fromStatus === 'init' ? 'init' : normalizeStatus(entry.fromStatus as unknown as string),
      toStatus: normalizeStatus(entry.toStatus as unknown as string)
    }))
    .sort((a, b) => a.changedAt - b.changedAt)

  return {
    ...item,
    domain: normalizeDomain((item as unknown as { domain?: string }).domain),
    status: normalizeStatus(item.status as unknown as string),
    handler: item.handler || 'ai',
    decisionOwner: item.decisionOwner || item.owner || '',
    evidence: item.evidence || '',
    risk: item.risk || '',
    impact: item.impact || '',
    rollback: item.rollback || '',
    statusHistory: normalizedHistory
  } as ProjectItem
}

export function createProjectManagementRepository(projectKey: string) {
  const storageKey = buildStorageKey(projectKey)

  return {
    load(): ProjectItem[] {
      try {
        const map = loadNormalizedObjectMap<ProjectItem>(storageKey, normalizeProjectItemId)
        const normalizedItems = Object.values(map).map(normalizeItem)
        this.save(normalizedItems)
        return normalizedItems.sort((a, b) => b.updatedAt - a.updatedAt)
      } catch {
        return []
      }
    },
    save(items: ProjectItem[]): void {
      const map: Record<string, ProjectItem> = {}
      items.forEach((item) => {
        map[item.id] = item
      })
      saveNormalizedObjectMap(storageKey, map, normalizeProjectItemId)
    },
    create(partial: CreateProjectItemInput): ProjectItem {
      const now = Date.now()
      const id = `pm-${now}-${Math.random().toString(36).slice(2, 7)}`
      const initHistory: ProjectStatusHistoryEntry = {
        fromStatus: 'init',
        toStatus: partial.status,
        actor: 'system',
        note: '创建条目',
        changedAt: now
      }
      return {
        id,
        createdAt: now,
        updatedAt: now,
        statusHistory: [initHistory],
        ...partial
      }
    }
  }
}
