import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

function projectManagementFileApi() {
  const rootDir = process.cwd()
  const portableRootDir = resolve(rootDir, '..', '.pm-center')
  const defaultDataDir = resolve(portableRootDir, 'data')
  const startupCheckPath = resolve(portableRootDir, 'startup-check.json')
  const legacyDataDir = resolve(rootDir, '.project-management')
  const linkConfigPath = resolve(portableRootDir, 'project-links.local.json')
  const legacyLinkConfigPath = resolve(rootDir, '.project-management', 'project-links.local.json')
  const defaultProjectKey = 'learnMajSoul'

  function ensureDir(targetDir: string) {
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }
  }

  function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
  }

  function loadLinkConfig(): any {
    try {
      const activePath = existsSync(linkConfigPath) ? linkConfigPath : legacyLinkConfigPath
      if (!existsSync(activePath)) return { version: 1, projects: {} }
      const raw = readFileSync(activePath, 'utf-8')
      const parsed = JSON.parse(raw || '{}')
      return parsed && typeof parsed === 'object' ? parsed : { version: 1, projects: {} }
    } catch {
      return { version: 1, projects: {} }
    }
  }

  function ensureMigratedDefaultData(projectKey: string) {
    ensureDir(defaultDataDir)
    const names = ['items', 'bridge', 'receipts'] as const
    names.forEach((name) => {
      const target = resolve(defaultDataDir, `${projectKey}-${name}.json`)
      const legacy = resolve(legacyDataDir, `${projectKey}-${name}.json`)
      if (!existsSync(target) && existsSync(legacy)) {
        copyFileSync(legacy, target)
      }
    })
  }

  function defaultStartupCheck(projectKey: string) {
    return {
      projectKey,
      checkedAt: 0,
      severity: 'warning',
      messages: ['尚未执行启动检查'],
      businessRepo: {
        exists: true,
        branch: 'unknown',
        commit: 'unknown',
        remoteUrl: '',
        dirty: false,
        ahead: 0,
        behind: 0
      },
      dataRepo: {
        exists: false,
        branch: 'unknown',
        commit: 'unknown',
        remoteUrl: '',
        dirty: false,
        ahead: 0,
        behind: 0
      }
    }
  }

  function resolveProjectLinkStatus(projectKey: string): {
    linked: boolean
    backupReady: boolean
    needsUserAction: boolean
    needsAiAction: boolean
    reason: string
    businessRepoPath: string
    managementRepoPath: string
    managementDataDir: string
    remoteUrl: string
    managementBranch: string
    managementCommit: string
    workingTreeDirty: boolean
    ahead: number
    behind: number
    syncMessage: string
  } {
    const config = loadLinkConfig()
    const projects = config.projects && typeof config.projects === 'object' ? config.projects : {}
    const entry = projects[projectKey]
    const fallback = {
      linked: false,
      backupReady: false,
      needsUserAction: true,
      needsAiAction: false,
      reason: '未配置业务项目与管理项目映射，当前使用父目录便携数据目录',
      businessRepoPath: rootDir,
      managementRepoPath: '',
      managementDataDir: defaultDataDir,
      remoteUrl: '',
      managementBranch: 'unknown',
      managementCommit: 'unknown',
      workingTreeDirty: false,
      ahead: 0,
      behind: 0,
      syncMessage: '未检测同步状态'
    }
    if (!entry || typeof entry !== 'object') {
      ensureMigratedDefaultData(projectKey)
      return fallback
    }
    const businessRepoPath =
      typeof entry.businessRepoPath === 'string' && entry.businessRepoPath
        ? resolve(entry.businessRepoPath)
        : rootDir
    const managementRepoPath =
      typeof entry.managementRepoPath === 'string' && entry.managementRepoPath
        ? resolve(entry.managementRepoPath)
        : ''
    const managementDataSubdir =
      typeof entry.managementDataSubdir === 'string' && entry.managementDataSubdir
        ? entry.managementDataSubdir
        : 'data'
    if (!managementRepoPath || !existsSync(managementRepoPath)) {
      return {
        ...fallback,
        reason: '管理项目路径不存在，请更新映射配置',
        businessRepoPath,
        managementRepoPath,
        syncMessage: '管理仓库不可用'
      }
    }
    if (normalizePath(businessRepoPath) !== normalizePath(rootDir)) {
      return {
        ...fallback,
        reason: '映射中的业务项目路径与当前仓库不一致，请检查映射',
        businessRepoPath,
        managementRepoPath,
        syncMessage: '映射校验失败'
      }
    }
    const managementDataDir = resolve(managementRepoPath, managementDataSubdir)
    ensureDir(managementDataDir)

    let remoteUrl = ''
    let managementBranch = 'unknown'
    let managementCommit = 'unknown'
    let workingTreeDirty = false
    let ahead = 0
    let behind = 0
    let syncMessage = '同步状态未知'
    try {
      remoteUrl = execSync('git remote get-url origin', {
        cwd: managementRepoPath,
        encoding: 'utf-8'
      }).trim()
    } catch {
      remoteUrl = ''
    }
    try {
      managementBranch = execSync('git branch --show-current', {
        cwd: managementRepoPath,
        encoding: 'utf-8'
      }).trim()
    } catch {
      managementBranch = 'unknown'
    }
    try {
      managementCommit = execSync('git rev-parse --short HEAD', {
        cwd: managementRepoPath,
        encoding: 'utf-8'
      }).trim()
    } catch {
      managementCommit = 'unknown'
    }
    try {
      const statusLine = execSync('git status --porcelain', {
        cwd: managementRepoPath,
        encoding: 'utf-8'
      }).trim()
      workingTreeDirty = Boolean(statusLine)
    } catch {
      workingTreeDirty = false
    }
    if (remoteUrl) {
      try {
        const upstream = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', {
          cwd: managementRepoPath,
          encoding: 'utf-8'
        }).trim()
        const countLine = execSync(`git rev-list --left-right --count HEAD...${upstream}`, {
          cwd: managementRepoPath,
          encoding: 'utf-8'
        }).trim()
        const parts = countLine.split(/\s+/)
        ahead = Number(parts[0] || 0)
        behind = Number(parts[1] || 0)
      } catch {
        ahead = 0
        behind = 0
      }
    }

    const backupReady = Boolean(remoteUrl)
    if (!backupReady) {
      syncMessage = '未配置 origin，无法多设备同步'
    } else if (workingTreeDirty) {
      syncMessage = '管理仓库有未提交变更，设备间可能不一致'
    } else if (behind > 0 && ahead > 0) {
      syncMessage = `管理仓库与远端已分叉（ahead ${ahead}, behind ${behind}）`
    } else if (behind > 0) {
      syncMessage = `本地落后远端 ${behind} 提交，请先拉取同步`
    } else if (ahead > 0) {
      syncMessage = `本地领先远端 ${ahead} 提交，请推送备份`
    } else {
      syncMessage = '管理仓库与远端已同步'
    }
    return {
      linked: true,
      backupReady,
      needsUserAction: !backupReady || workingTreeDirty || behind > 0 || ahead > 0,
      needsAiAction: false,
      reason: backupReady ? '关联正常，且已配置远程备份' : '已关联，但管理仓库未配置 origin 远程',
      businessRepoPath,
      managementRepoPath,
      managementDataDir,
      remoteUrl,
      managementBranch: managementBranch || 'unknown',
      managementCommit: managementCommit || 'unknown',
      workingTreeDirty,
      ahead,
      behind,
      syncMessage
    }
  }

  function projectDataDir(projectKey: string): string {
    return resolveProjectLinkStatus(projectKey).managementDataDir
  }

  function filePath(projectKey: string): string {
    return resolve(projectDataDir(projectKey), `${projectKey}-items.json`)
  }

  function bridgePath(projectKey: string): string {
    return resolve(projectDataDir(projectKey), `${projectKey}-bridge.json`)
  }

  function receiptsPath(projectKey: string): string {
    return resolve(projectDataDir(projectKey), `${projectKey}-receipts.json`)
  }

  function ensureJsonFile(path: string, fallback: Record<string, unknown>) {
    if (!existsSync(path)) {
      writeFileSync(path, JSON.stringify(fallback, null, 2), 'utf-8')
    }
  }

  function readJsonFile(path: string, fallback: Record<string, unknown>): any {
    ensureJsonFile(path, fallback)
    try {
      const raw = readFileSync(path, 'utf-8')
      return JSON.parse(raw || '{}')
    } catch {
      writeFileSync(path, JSON.stringify(fallback, null, 2), 'utf-8')
      return fallback
    }
  }

  function writeJsonAtomic(path: string, data: Record<string, unknown>) {
    const tempPath = `${path}.tmp`
    const backupPath = `${path}.bak`
    const content = JSON.stringify(data, null, 2)
    writeFileSync(tempPath, content, 'utf-8')
    if (existsSync(path)) {
      copyFileSync(path, backupPath)
    }
    renameSync(tempPath, path)
  }

  function parseRequestBody(req: any): Promise<unknown> {
    return new Promise((resolveBody, reject) => {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString('utf-8')
      })
      req.on('end', () => {
        try {
          resolveBody(JSON.parse(body || '{}'))
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  function parseBeforeDate(dateText: string | undefined): number {
    if (!dateText) return Number.NaN
    const ts = new Date(`${dateText}T00:00:00`).getTime()
    return Number.isNaN(ts) ? Number.NaN : ts
  }

  function truncateLogsBeforeDate(
    target: string,
    key: 'events' | 'receipts',
    beforeTs: number
  ): { removed: number; remaining: number; revision: number } {
    const data = readJsonFile(target, { version: 1, revision: 0, updatedAt: 0, [key]: [] })
    const list = Array.isArray(data[key]) ? data[key] : []
    const kept = list.filter((item: any) => typeof item.createdAt !== 'number' || item.createdAt >= beforeTs)
    const removed = list.length - kept.length
    const currentRevision = typeof data.revision === 'number' ? (data.revision as number) : 0
    const nextRevision = currentRevision + 1
    writeJsonAtomic(target, {
      version: 1,
      revision: nextRevision,
      updatedAt: Date.now(),
      [key]: kept
    })
    return { removed, remaining: kept.length, revision: nextRevision }
  }

  function readGitContext(): { branch: string; commit: string } {
    try {
      const branch = execSync('git branch --show-current', {
        cwd: rootDir,
        encoding: 'utf-8'
      }).trim()
      const commit = execSync('git rev-parse --short HEAD', {
        cwd: rootDir,
        encoding: 'utf-8'
      }).trim()
      return { branch: branch || 'unknown', commit: commit || 'unknown' }
    } catch {
      return { branch: 'unknown', commit: 'unknown' }
    }
  }

  function runStartupCheck(projectKey: string) {
    try {
      execSync('node scripts/pm-startup-check.mjs', {
        cwd: rootDir,
        encoding: 'utf-8',
        env: { ...process.env, PM_PROJECT_KEY: projectKey }
      })
    } catch {
      // ignore script exit and fallback to file read
    }
    ensureDir(portableRootDir)
    return readJsonFile(startupCheckPath, defaultStartupCheck(projectKey))
  }

  function runDataRepoAction(
    projectKey: string,
    action: 'sync' | 'backup'
  ): { ok: boolean; message: string; changed?: boolean } {
    const status = resolveProjectLinkStatus(projectKey)
    if (!status.linked || !status.managementRepoPath) {
      return {
        ok: false,
        message: action === 'sync' ? '未完成业务与数据仓关联，无法同步' : '未完成业务与数据仓关联，无法备份'
      }
    }
    if (!existsSync(status.managementRepoPath)) {
      return {
        ok: false,
        message: action === 'sync' ? '管理仓库路径不存在，无法同步' : '管理仓库路径不存在，无法备份'
      }
    }
    if (!status.backupReady) {
      return {
        ok: false,
        message: action === 'sync' ? '数据仓未配置 origin，无法执行同步' : '数据仓未配置 origin，无法备份'
      }
    }
    try {
      execSync(`git pull --rebase origin ${status.managementBranch}`, {
        cwd: status.managementRepoPath,
        encoding: 'utf-8'
      })
      if (action === 'sync') {
        return { ok: true, message: '数据仓同步成功' }
      }
      execSync('git add .', {
        cwd: status.managementRepoPath,
        encoding: 'utf-8'
      })
      const staged = execSync('git diff --cached --name-only', {
        cwd: status.managementRepoPath,
        encoding: 'utf-8'
      }).trim()
      if (!staged) {
        return { ok: true, message: '无变更，无需备份', changed: false }
      }
      const message = `chore(pm-data): ui backup ${new Date().toISOString()}`
      execSync(`git commit -m "${message}"`, {
        cwd: status.managementRepoPath,
        encoding: 'utf-8'
      })
      execSync(`git push origin ${status.managementBranch}`, {
        cwd: status.managementRepoPath,
        encoding: 'utf-8'
      })
      return { ok: true, message: '数据仓备份成功并已推送', changed: true }
    } catch {
      return {
        ok: false,
        message: action === 'sync' ? '数据仓同步失败，请检查冲突或网络' : '数据仓备份失败，请检查冲突或网络'
      }
    }
  }

  function syncDataRepo(projectKey: string): { ok: boolean; message: string; status: any } {
    const result = runDataRepoAction(projectKey, 'sync')
    const status = resolveProjectLinkStatus(projectKey)
    return { ...result, status }
  }

  function backupDataRepo(projectKey: string): { ok: boolean; message: string; status: any } {
    const result = runDataRepoAction(projectKey, 'backup')
    const status = resolveProjectLinkStatus(projectKey)
    return { ...result, status }
  }

  function parseProjectKeyFromBody(parsed: any): string {
    if (parsed && typeof parsed === 'object' && typeof parsed.projectKey === 'string') {
      return parsed.projectKey
    }
    return defaultProjectKey
  }

  function registerRoutes(middlewares: any) {
    middlewares.use('/__pm_api/items', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        ensureDir(projectDataDir(projectKey))
        if (req.method === 'GET') {
          const target = filePath(projectKey)
          const data = readJsonFile(target, { version: 1, items: [] })
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          void parseRequestBody(req)
            .then((parsed: any) => {
              const projectKey =
                typeof parsed.projectKey === 'string' ? parsed.projectKey : defaultProjectKey
              ensureDir(projectDataDir(projectKey))
              const items = Array.isArray(parsed.items) ? parsed.items : []
              const target = filePath(projectKey)
              const current = readJsonFile(target, {
                version: 1,
                revision: 0,
                updatedAt: Date.now(),
                items: []
              })
              const currentRevision =
                typeof current.revision === 'number' ? (current.revision as number) : 0
              const expectedRevision =
                typeof parsed.expectedRevision === 'number' ? parsed.expectedRevision : undefined
              if (expectedRevision !== undefined && expectedRevision !== currentRevision) {
                res.statusCode = 409
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(
                  JSON.stringify({
                    ok: false,
                    code: 'REVISION_CONFLICT',
                    message: 'revision conflict',
                    currentRevision
                  })
                )
                return
              }
              const nextRevision = currentRevision + 1
              writeJsonAtomic(target, {
                version: 1,
                revision: nextRevision,
                updatedAt: Date.now(),
                items
              })
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true, count: items.length, revision: nextRevision }))
            })
            .catch(() => {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
            })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'internal error' }))
      }
    })

    middlewares.use('/__pm_api/bridge', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        ensureDir(projectDataDir(projectKey))
        if (req.method === 'GET') {
          const target = bridgePath(projectKey)
          const data = readJsonFile(target, { version: 1, revision: 0, updatedAt: 0, events: [] })
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          void parseRequestBody(req)
            .then((parsed: any) => {
              const projectKey =
                typeof parsed.projectKey === 'string' ? parsed.projectKey : defaultProjectKey
              ensureDir(projectDataDir(projectKey))
              const target = bridgePath(projectKey)
              const data = readJsonFile(target, {
                version: 1,
                revision: 0,
                updatedAt: 0,
                events: []
              })
              const currentEvents = Array.isArray(data.events) ? data.events : []
              const incomingEvents = Array.isArray(parsed.events) ? parsed.events : []
              const merged = [...currentEvents, ...incomingEvents]
              const currentRevision =
                typeof data.revision === 'number' ? (data.revision as number) : 0
              writeJsonAtomic(target, {
                version: 1,
                revision: currentRevision + 1,
                updatedAt: Date.now(),
                events: merged
              })
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true, count: merged.length }))
            })
            .catch(() => {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
            })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'internal error' }))
      }
    })

    middlewares.use('/__pm_api/receipts', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        ensureDir(projectDataDir(projectKey))
        if (req.method === 'GET') {
          const target = receiptsPath(projectKey)
          const data = readJsonFile(target, { version: 1, revision: 0, updatedAt: 0, receipts: [] })
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          void parseRequestBody(req)
            .then((parsed: any) => {
              const projectKey =
                typeof parsed.projectKey === 'string' ? parsed.projectKey : defaultProjectKey
              ensureDir(projectDataDir(projectKey))
              const target = receiptsPath(projectKey)
              const data = readJsonFile(target, {
                version: 1,
                revision: 0,
                updatedAt: 0,
                receipts: []
              })
              const currentReceipts = Array.isArray(data.receipts) ? data.receipts : []
              const incomingReceipts = Array.isArray(parsed.receipts) ? parsed.receipts : []
              const merged = [...currentReceipts, ...incomingReceipts]
              const currentRevision =
                typeof data.revision === 'number' ? (data.revision as number) : 0
              writeJsonAtomic(target, {
                version: 1,
                revision: currentRevision + 1,
                updatedAt: Date.now(),
                receipts: merged
              })
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true, count: merged.length }))
            })
            .catch(() => {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
            })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'internal error' }))
      }
    })

    middlewares.use('/__pm_api/context', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        const itemsTarget = filePath(projectKey)
        const itemsData = readJsonFile(itemsTarget, { version: 1, revision: 0, updatedAt: 0, items: [] })
        const gitContext = readGitContext()
        let itemsMtime = 0
        try {
          itemsMtime = statSync(itemsTarget).mtimeMs
        } catch {
          itemsMtime = 0
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            projectKey,
            branch: gitContext.branch,
            commit: gitContext.commit,
            itemsRevision: typeof itemsData.revision === 'number' ? itemsData.revision : 0,
            itemsUpdatedAt: typeof itemsData.updatedAt === 'number' ? itemsData.updatedAt : itemsMtime,
            itemsFilePath: itemsTarget
          })
        )
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'context read failed' }))
      }
    })

    middlewares.use('/__pm_api/logs/summary', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        const beforeTs = parseBeforeDate(url.searchParams.get('beforeDate') || undefined)
        if (Number.isNaN(beforeTs)) {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid beforeDate' }))
          return
        }
        const bridgeData = readJsonFile(bridgePath(projectKey), {
          version: 1,
          revision: 0,
          updatedAt: 0,
          events: []
        })
        const receiptData = readJsonFile(receiptsPath(projectKey), {
          version: 1,
          revision: 0,
          updatedAt: 0,
          receipts: []
        })
        const bridgeEvents = Array.isArray(bridgeData.events) ? bridgeData.events : []
        const receipts = Array.isArray(receiptData.receipts) ? receiptData.receipts : []
        const bridgeRemove = bridgeEvents.filter(
          (item: any) => typeof item.createdAt === 'number' && item.createdAt < beforeTs
        ).length
        const receiptRemove = receipts.filter(
          (item: any) => typeof item.createdAt === 'number' && item.createdAt < beforeTs
        ).length
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            ok: true,
            beforeDate: url.searchParams.get('beforeDate'),
            bridge: { total: bridgeEvents.length, removable: bridgeRemove },
            receipts: { total: receipts.length, removable: receiptRemove }
          })
        )
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'summary failed' }))
      }
    })

    middlewares.use('/__pm_api/logs/cleanup', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          try {
            const projectKey =
              typeof parsed.projectKey === 'string' ? parsed.projectKey : defaultProjectKey
            const beforeDate = typeof parsed.beforeDate === 'string' ? parsed.beforeDate : ''
            const beforeTs = parseBeforeDate(beforeDate)
            if (Number.isNaN(beforeTs)) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: 'invalid beforeDate' }))
              return
            }
            if (parsed.confirm !== true) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, message: 'confirm required' }))
              return
            }
            const bridgeResult = truncateLogsBeforeDate(bridgePath(projectKey), 'events', beforeTs)
            const receiptResult = truncateLogsBeforeDate(receiptsPath(projectKey), 'receipts', beforeTs)
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                ok: true,
                beforeDate,
                bridge: bridgeResult,
                receipts: receiptResult
              })
            )
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, message: 'cleanup failed' }))
          }
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/link/status', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        const status = resolveProjectLinkStatus(projectKey)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: true, projectKey, ...status }))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'link status failed' }))
      }
    })

    middlewares.use('/__pm_api/data/sync', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const result = runDataRepoAction(projectKey, 'sync')
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ...result, projectKey }))
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/data/backup', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const result = runDataRepoAction(projectKey, 'backup')
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ...result, projectKey }))
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/startup/check', (req: any, res: any) => {
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        ensureDir(portableRootDir)
        const data = readJsonFile(startupCheckPath, defaultStartupCheck(projectKey))
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(data))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'startup check read failed' }))
      }
    })

    middlewares.use('/__pm_api/control', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          try {
            const projectKey =
              typeof parsed.projectKey === 'string' ? parsed.projectKey : defaultProjectKey
            const action = typeof parsed.action === 'string' ? parsed.action : ''
            if (action === 'startup_check') {
              const check = runStartupCheck(projectKey)
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true, action, check }))
              return
            }
            if (action === 'sync_data_repo') {
              const result = syncDataRepo(projectKey)
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ...result, action }))
              return
            }
            if (action === 'backup_data_repo') {
              const result = backupDataRepo(projectKey)
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ...result, action }))
              return
            }
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, message: 'unknown action' }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, message: 'control action failed' }))
          }
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })
  }

  return {
    name: 'project-management-file-api',
    configureServer(server: any) {
      registerRoutes(server.middlewares)
    },
    configurePreviewServer(server: any) {
      registerRoutes(server.middlewares)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), projectManagementFileApi()],
})
