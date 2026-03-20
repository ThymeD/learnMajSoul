#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const rootDir = resolve(scriptDir, '..')
const projectKey = process.env.PM_PROJECT_KEY || 'learnMajSoul'
const portableRootDir = resolve(rootDir, '..', '.pm-center')
const defaultDataDir = resolve(portableRootDir, 'data')
const newLinkConfig = resolve(portableRootDir, 'project-links.local.json')
const legacyLinkConfig = resolve(rootDir, '.project-management', 'project-links.local.json')
const collaborationPath = resolve(rootDir, 'collaboration.md')
const sourcesConfigNew = resolve(portableRootDir, 'business-sources.local.json')
const sourcesConfigLegacy = resolve(rootDir, '.project-management', 'business-sources.local.json')

function run(command, cwd = rootDir) {
  return execSync(command, { cwd, encoding: 'utf-8' }).trim()
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

function loadJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback
    return JSON.parse(readFileSync(path, 'utf-8') || '{}')
  } catch {
    return fallback
  }
}

function saveJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf-8')
}

function getDataDir() {
  const activeConfigPath = existsSync(newLinkConfig) ? newLinkConfig : legacyLinkConfig
  const config = loadJson(activeConfigPath, { version: 1, projects: {} })
  const entry = config.projects?.[projectKey]
  if (entry?.managementRepoPath) {
    const subdir = entry.managementDataSubdir || 'data'
    const target = resolve(entry.managementRepoPath, subdir)
    ensureDir(target)
    return target
  }
  ensureDir(defaultDataDir)
  return defaultDataDir
}

function now() {
  return Date.now()
}

function createItem(title, status, kind, priority, note, domain = 'product', mode = 'both') {
  const ts = now()
  return {
    id: `${projectKey}-${Math.random().toString(36).slice(2, 10)}-${ts}`,
    title,
    domain,
    kind,
    mode,
    status,
    priority,
    handler: 'ai',
    decisionOwner: '',
    dueDate: '',
    note,
    evidence: '',
    risk: '',
    impact: '',
    rollback: '',
    createdAt: ts,
    updatedAt: ts,
    statusHistory: [
      {
        from: 'init',
        to: status,
        actor: 'system-importer',
        note: 'auto import current project progress',
        changedAt: ts
      }
    ]
  }
}

function parseCollaborationItems() {
  const text = existsSync(collaborationPath) ? readFileSync(collaborationPath, 'utf-8') : ''
  const lines = text.split(/\r?\n/)
  const result = []

  // 重构任务池
  for (const line of lines) {
    const m = line.match(/^\|\s*(RF-\d+)\s*\|\s*([^|]+)\|\s*(P\d)\s*\|\s*([^|]+)\|/)
    if (!m) continue
    const id = m[1]
    const title = m[2].trim()
    const priority = m[3]
    const statusText = m[4].trim()
    const status =
      statusText.includes('已完成')
        ? 'confirmed_done'
        : statusText.includes('待')
          ? 'pending_ai'
          : 'ai_in_progress'
    const domain = title.includes('交付管理') || title.includes('看板') ? 'management' : 'product'
    result.push(
      createItem(
        `${id} ${title}`,
        status,
        'todo',
        priority,
        `[auto-import:collab:${id}] 来自 collaboration.md 重构任务池`,
        domain
      )
    )
  }

  // 修复进度
  for (const line of lines) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|/)
    if (!m) continue
    const id = m[1]
    const title = m[2].trim()
    const statusText = m[3].trim()
    if (!title || title === '问题') continue
    const status = statusText.includes('✅') ? 'confirmed_done' : 'ai_in_progress'
    result.push(
      createItem(
        `BUG-${id} ${title}`,
        status,
        'defect',
        status === 'confirmed_done' ? 'P2' : 'P1',
        `[auto-import:collab:bug-${id}] 来自 collaboration.md 修复进度`
      )
    )
  }
  return result
}

function parseGitProgressItem() {
  let changed = 0
  try {
    const status = run('git status --short')
    changed = status ? status.split(/\r?\n/).filter(Boolean).length : 0
  } catch {
    changed = 0
  }
  if (changed === 0) return []
  return [
    createItem(
      `当前开发中：检测到 ${changed} 个文件有本地变更`,
      'ai_in_progress',
      'todo',
      'P1',
      '[auto-import:git] 来自 git status',
      'product'
    )
  ]
}

function loadSourcesConfig() {
  const activePath = existsSync(sourcesConfigNew) ? sourcesConfigNew : sourcesConfigLegacy
  const fallback = {
    version: 1,
    sources: [
      { type: 'collaboration_md', enabled: true },
      { type: 'git_status', enabled: true }
    ]
  }
  const config = loadJson(activePath, fallback)
  if (!Array.isArray(config.sources)) return fallback
  return config
}

function upsertByNote(existing, incoming) {
  const byNote = new Map()
  existing.forEach((item, idx) => {
    if (typeof item.note === 'string' && item.note.includes('[auto-import:')) {
      byNote.set(item.note, idx)
    }
  })
  const merged = [...existing]
  for (const item of incoming) {
    const idx = byNote.get(item.note)
    if (typeof idx === 'number') {
      const current = merged[idx]
      merged[idx] = {
        ...current,
        title: item.title,
        status: item.status,
        priority: item.priority,
        updatedAt: now()
      }
    } else {
      merged.unshift(item)
    }
  }
  return merged
}

function main() {
  const dataDir = getDataDir()
  const targetPath = resolve(dataDir, `${projectKey}-items.json`)
  const base = loadJson(targetPath, { version: 1, revision: 0, updatedAt: 0, items: [] })
  const currentItems = Array.isArray(base.items) ? base.items : []
  const sources = loadSourcesConfig().sources
  const importItems = []
  for (const source of sources) {
    if (!source?.enabled) continue
    if (source.type === 'collaboration_md') importItems.push(...parseCollaborationItems())
    if (source.type === 'git_status') importItems.push(...parseGitProgressItem())
  }
  const mergedItems = upsertByNote(currentItems, importItems)
  const nextRevision = (typeof base.revision === 'number' ? base.revision : 0) + 1
  saveJson(targetPath, {
    version: 1,
    revision: nextRevision,
    updatedAt: now(),
    items: mergedItems
  })
  console.log(`[PM Import] imported=${importItems.length}, total=${mergedItems.length}, rev=${nextRevision}`)
  console.log(`[PM Import] file=${targetPath}`)
}

main()
