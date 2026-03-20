#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const rootDir = resolve(scriptDir, '..')
const portableRootDir = resolve(rootDir, '..', '.pm-center')
const outputPath = resolve(portableRootDir, 'startup-check.json')
const linkConfigPath = resolve(portableRootDir, 'project-links.local.json')
const projectKey = process.env.PM_PROJECT_KEY || 'learnMajSoul'

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

function run(command, cwd) {
  return execSync(command, { cwd, encoding: 'utf-8' }).trim()
}

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback
    return JSON.parse(readFileSync(path, 'utf-8') || '{}')
  } catch {
    return fallback
  }
}

function getRepoStatus(repoPath) {
  if (!repoPath || !existsSync(repoPath)) {
    return {
      exists: false,
      branch: 'unknown',
      commit: 'unknown',
      remoteUrl: '',
      dirty: false,
      ahead: 0,
      behind: 0
    }
  }
  let branch = 'unknown'
  let commit = 'unknown'
  let remoteUrl = ''
  let dirty = false
  let ahead = 0
  let behind = 0

  try {
    branch = run('git branch --show-current', repoPath) || 'unknown'
  } catch {
    branch = 'unknown'
  }
  try {
    commit = run('git rev-parse --short HEAD', repoPath) || 'unknown'
  } catch {
    commit = 'unknown'
  }
  try {
    remoteUrl = run('git remote get-url origin', repoPath)
  } catch {
    remoteUrl = ''
  }
  try {
    dirty = Boolean(run('git status --porcelain', repoPath))
  } catch {
    dirty = false
  }
  if (remoteUrl) {
    try {
      const upstream = run('git rev-parse --abbrev-ref --symbolic-full-name @{u}', repoPath)
      const counts = run(`git rev-list --left-right --count HEAD...${upstream}`, repoPath).split(/\s+/)
      ahead = Number(counts[0] || 0)
      behind = Number(counts[1] || 0)
    } catch {
      ahead = 0
      behind = 0
    }
  }

  return { exists: true, branch, commit, remoteUrl, dirty, ahead, behind }
}

function summarizeSeverity(check) {
  if (!check.dataRepo.exists) return 'error'
  if (!check.dataRepo.remoteUrl) return 'warning'
  if (check.dataRepo.behind > 0 || check.dataRepo.dirty) return 'warning'
  if (check.businessRepo.behind > 0) return 'warning'
  return 'success'
}

function main() {
  ensureDir(portableRootDir)
  const config = readJson(linkConfigPath, { projects: {} })
  const projectEntry = config.projects?.[projectKey] || {}
  const managementRepoPath = projectEntry.managementRepoPath
    ? resolve(projectEntry.managementRepoPath)
    : resolve(rootDir, '..', 'learnMajSoul-pm-data')

  const result = {
    projectKey,
    checkedAt: Date.now(),
    businessRepo: getRepoStatus(rootDir),
    dataRepo: getRepoStatus(managementRepoPath),
    messages: []
  }

  if (!result.dataRepo.exists) {
    result.messages.push('数据仓不存在，请先初始化管理数据仓')
  } else if (!result.dataRepo.remoteUrl) {
    result.messages.push('数据仓未配置 origin，暂时无法多设备自动同步')
  } else if (result.dataRepo.behind > 0) {
    result.messages.push(`数据仓本地落后远端 ${result.dataRepo.behind} 提交，请先同步`)
  } else if (result.dataRepo.ahead > 0) {
    result.messages.push(`数据仓本地领先远端 ${result.dataRepo.ahead} 提交，请尽快推送`)
  }

  if (result.dataRepo.dirty) {
    result.messages.push('数据仓存在未提交变更，建议先提交避免跨设备不一致')
  }
  if (result.businessRepo.behind > 0) {
    result.messages.push(`业务代码仓落后远端 ${result.businessRepo.behind} 提交，可能出现数据与代码兼容差异`)
  }
  if (result.messages.length === 0) {
    result.messages.push('启动检查通过：业务仓与数据仓状态正常')
  }

  const severity = summarizeSeverity(result)
  const output = { ...result, severity }
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`[PM Startup Check] ${severity} -> ${output.messages[0]}`)
}

main()
