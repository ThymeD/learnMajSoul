#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const rootDir = resolve(scriptDir, '..')
const portableRootDir = resolve(rootDir, '..', '.pm-center')
const configPath = resolve(portableRootDir, 'project-links.local.json')
const legacyConfigPath = resolve(rootDir, '.project-management', 'project-links.local.json')
const sourcesConfigPath = resolve(portableRootDir, 'business-sources.local.json')
const projectKey = process.env.PM_PROJECT_KEY || 'learnMajSoul'
const command = process.argv[2] || 'status'

function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
}

function run(commandText, cwd) {
  return execSync(commandText, { cwd, encoding: 'utf-8' }).trim()
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

function initPortableCenter() {
  ensureDir(portableRootDir)
  ensureDir(resolve(portableRootDir, 'data'))
  if (!existsSync(configPath) && existsSync(legacyConfigPath)) {
    copyFileSync(legacyConfigPath, configPath)
  }
  if (!existsSync(configPath)) {
    const defaultConfig = {
      version: 1,
      projects: {
        [projectKey]: {
          businessRepoPath: rootDir.replace(/\\/g, '/'),
          managementRepoPath: resolve(rootDir, '..', 'learnMajSoul-pm-data').replace(/\\/g, '/'),
          managementDataSubdir: 'data'
        }
      }
    }
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8')
  }
  if (!existsSync(sourcesConfigPath)) {
    const defaultSources = {
      version: 1,
      sources: [
        { type: 'collaboration_md', enabled: true },
        { type: 'git_status', enabled: true }
      ]
    }
    writeFileSync(sourcesConfigPath, JSON.stringify(defaultSources, null, 2), 'utf-8')
  }
  console.log(`[PM Link] 初始化完成：${portableRootDir}`)
  console.log(`[PM Link] 配置文件：${configPath}`)
  console.log(`[PM Link] 导入源配置：${sourcesConfigPath}`)
}

function loadConfig() {
  const activePath = existsSync(configPath) ? configPath : legacyConfigPath
  if (!existsSync(activePath)) {
    throw new Error(`未找到配置文件：${configPath}（可先执行 npm run pm:init）`)
  }
  const parsed = JSON.parse(readFileSync(activePath, 'utf-8') || '{}')
  const projects = parsed.projects && typeof parsed.projects === 'object' ? parsed.projects : {}
  const entry = projects[projectKey]
  if (!entry) {
    throw new Error(`未找到项目映射：${projectKey}`)
  }
  return entry
}

function readStatus() {
  const entry = loadConfig()
  const businessRepoPath = resolve(entry.businessRepoPath || rootDir)
  const managementRepoPath = resolve(entry.managementRepoPath || '')
  const managementDataSubdir = entry.managementDataSubdir || 'data'
  const managementDataDir = resolve(managementRepoPath, managementDataSubdir)

  const businessMatches = normalizePath(businessRepoPath) === normalizePath(rootDir)
  const managementExists = !!managementRepoPath && existsSync(managementRepoPath)
  let remoteUrl = ''
  let branch = 'unknown'
  let commit = 'unknown'
  if (managementExists) {
    try {
      remoteUrl = run('git remote get-url origin', managementRepoPath)
    } catch {
      remoteUrl = ''
    }
    try {
      branch = run('git branch --show-current', managementRepoPath)
    } catch {
      branch = 'unknown'
    }
    try {
      commit = run('git rev-parse --short HEAD', managementRepoPath)
    } catch {
      commit = 'unknown'
    }
  }
  return {
    businessRepoPath,
    managementRepoPath,
    managementDataDir,
    businessMatches,
    managementExists,
    remoteUrl,
    branch,
    commit
  }
}

function printStatus() {
  const status = readStatus()
  console.log(`[PM Link] projectKey=${projectKey}`)
  console.log(`- businessRepoPath: ${status.businessRepoPath}`)
  console.log(`- managementRepoPath: ${status.managementRepoPath || '(empty)'}`)
  console.log(`- managementDataDir: ${status.managementDataDir}`)
  console.log(`- businessPathMatch: ${status.businessMatches ? 'yes' : 'no'}`)
  console.log(`- managementPathExists: ${status.managementExists ? 'yes' : 'no'}`)
  console.log(`- origin: ${status.remoteUrl || '(missing)'}`)
  console.log(`- branch: ${status.branch}`)
  console.log(`- commit: ${status.commit}`)
  if (!status.businessMatches) process.exitCode = 2
  if (!status.managementExists) process.exitCode = 2
  if (!status.remoteUrl) process.exitCode = 2
}

function backupNow() {
  const status = readStatus()
  if (!status.managementExists) {
    throw new Error('管理项目路径不存在，无法备份')
  }
  if (!status.remoteUrl) {
    throw new Error('管理项目未配置 origin 远程，无法推送备份')
  }
  run(`git pull --rebase origin ${status.branch}`, status.managementRepoPath)

  run('git add .', status.managementRepoPath)
  const staged = run('git diff --cached --name-only', status.managementRepoPath)
  if (!staged) {
    console.log('[PM Backup] 无变更，跳过提交与推送')
    return
  }
  const message = `chore(pm-data): backup ${new Date().toISOString()}`
  run(`git commit -m "${message}"`, status.managementRepoPath)
  run(`git push origin ${status.branch}`, status.managementRepoPath)
  console.log(`[PM Backup] 已推送到 origin/${status.branch}`)
}

try {
  if (command === 'init') {
    initPortableCenter()
  } else if (command === 'backup') {
    backupNow()
  } else {
    printStatus()
  }
} catch (error) {
  console.error(`[PM Link] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
