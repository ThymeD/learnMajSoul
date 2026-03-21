import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync, execSync } from 'node:child_process'

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

  function saveLinkConfig(config: any) {
    const targetPath = existsSync(linkConfigPath) ? linkConfigPath : legacyLinkConfigPath
    ensureDir(resolve(targetPath, '..'))
    writeJsonAtomic(targetPath, config && typeof config === 'object' ? config : { version: 1, projects: {} })
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
    workingMode: 'single_local' | 'multi_sync'
    modeConfirmed: boolean
    modeConfirmedAt: number
    needsModeConfirmation: boolean
    modePromptReason: string
    integrationBranch: string
    releaseBranch: string
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
      syncMessage: '未检测同步状态',
      workingMode: 'single_local' as const,
      modeConfirmed: false,
      modeConfirmedAt: 0,
      needsModeConfirmation: false,
      modePromptReason: '',
      integrationBranch: 'develop',
      releaseBranch: ''
    }
    if (!entry || typeof entry !== 'object') {
      ensureMigratedDefaultData(projectKey)
      return fallback
    }
    const integrationBranch =
      typeof entry.integrationBranch === 'string' && entry.integrationBranch.trim()
        ? entry.integrationBranch.trim()
        : 'develop'
    const releaseBranch =
      typeof entry.releaseBranch === 'string' && entry.releaseBranch.trim()
        ? entry.releaseBranch.trim()
        : ''
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
        syncMessage: '管理仓库不可用',
        integrationBranch,
        releaseBranch
      }
    }
    if (normalizePath(businessRepoPath) !== normalizePath(rootDir)) {
      return {
        ...fallback,
        reason: '映射中的业务项目路径与当前仓库不一致，请检查映射',
        businessRepoPath,
        managementRepoPath,
        syncMessage: '映射校验失败',
        integrationBranch,
        releaseBranch
      }
    }
    const managementDataDir = resolve(managementRepoPath, managementDataSubdir)
    ensureDir(managementDataDir)

    const rawWorkingMode = entry.workingMode === 'multi_sync' ? 'multi_sync' : 'single_local'
    const modeConfirmed = Boolean(entry.modeConfirmed)
    const modeConfirmedAt =
      typeof entry.modeConfirmedAt === 'number' && Number.isFinite(entry.modeConfirmedAt)
        ? entry.modeConfirmedAt
        : 0
    const confirmedRemoteUrl = typeof entry.confirmedRemoteUrl === 'string' ? entry.confirmedRemoteUrl : ''

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
      const cur = execSync('git branch --show-current', {
        cwd: managementRepoPath,
        encoding: 'utf-8'
      }).trim()
      if (cur) {
        managementBranch = cur
      } else {
        const short = execSync('git rev-parse --short HEAD', {
          cwd: managementRepoPath,
          encoding: 'utf-8'
        }).trim()
        managementBranch = short ? `游离(${short})` : '游离'
      }
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
    const needsModeConfirmation =
      Boolean(remoteUrl) && (!modeConfirmed || normalizePath(confirmedRemoteUrl) !== normalizePath(remoteUrl))
    const modePromptReason = needsModeConfirmation
      ? modeConfirmed
        ? '检测到远程仓库配置变化，请重新确认当前工作模式'
        : '检测到已配置远程仓库，请确认你是单机还是多设备同步开发'
      : ''

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
      syncMessage,
      workingMode: rawWorkingMode,
      modeConfirmed,
      modeConfirmedAt,
      needsModeConfirmation,
      modePromptReason,
      integrationBranch,
      releaseBranch
    }
  }

  function formatDataRepoGitError(error: unknown, fallbackMessage: string): string {
    const err = error as { stderr?: string | Buffer; stdout?: string | Buffer; message?: string }
    const stderrText =
      typeof err?.stderr === 'string'
        ? err.stderr
        : err?.stderr
          ? Buffer.from(err.stderr).toString('utf-8')
          : ''
    const stdoutText =
      typeof err?.stdout === 'string'
        ? err.stdout
        : err?.stdout
          ? Buffer.from(err.stdout).toString('utf-8')
          : ''
    const raw = `${stderrText}\n${stdoutText}\n${err?.message || ''}`.trim()
    const normalized = raw.toLowerCase()
    if (
      normalized.includes('could not resolve host') ||
      normalized.includes('failed to connect') ||
      normalized.includes('connection timed out')
    ) {
      return '网络连接失败：请检查网络或代理后重试'
    }
    if (
      normalized.includes('authentication failed') ||
      normalized.includes('permission denied (publickey)') ||
      normalized.includes('could not read username')
    ) {
      return 'GitHub 鉴权失败：请确认账号登录状态或 SSH/Token 权限'
    }
    if (normalized.includes('not a git repository')) {
      return '目标路径不是 Git 仓库'
    }
    const lastLine = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-1)[0]
    if (lastLine) {
      return `${fallbackMessage}（${lastLine}）`
    }
    return fallbackMessage
  }

  function runDataRepoGit(cwd: string, command: string): string {
    return execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
  }

  function dataRepoBranchExistsLocal(cwd: string, name: string): boolean {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${name}`, { cwd, stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  /** 分支名比较（大小写不敏感，避免 develop / Develop 误判走合并路径） */
  function dataRepoBranchNameMatch(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase()
  }

  function dataRepoReadCurrentBranch(cwd: string): string {
    try {
      return execFileSync('git', ['branch', '--show-current'], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
    } catch {
      return ''
    }
  }

  function listDataRepoBranches(
    projectKey: string,
    doFetch: boolean
  ): {
    ok: boolean
    message?: string
    branches?: string[]
    current?: string
    integrationBranch?: string
    releaseBranch?: string
  } {
    const status = resolveProjectLinkStatus(projectKey)
    if (!status.linked || !status.managementRepoPath) {
      return { ok: false, message: '未完成业务仓与数据仓关联' }
    }
    const cwd = status.managementRepoPath
    if (!existsSync(cwd)) {
      return { ok: false, message: '数据仓路径不存在' }
    }
    try {
      if (doFetch && status.backupReady) {
        runDataRepoGit(cwd, 'git fetch origin')
      }
      const localRaw = runDataRepoGit(cwd, 'git branch --format=%(refname:short)')
      const local = localRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const remote: string[] = []
      if (status.backupReady) {
        try {
          const remoteRaw = runDataRepoGit(cwd, 'git branch -r --format=%(refname:short)')
          remote.push(
            ...remoteRaw
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .filter((r) => r.startsWith('origin/'))
              .map((r) => r.replace(/^origin\//, ''))
              .filter((r) => r !== 'HEAD')
          )
        } catch {
          // ignore
        }
      }
      const set = new Set<string>([...local, ...remote])
      const branches = [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
      let current = 'unknown'
      try {
        const cur = runDataRepoGit(cwd, 'git branch --show-current')
        if (cur) {
          current = cur
        } else {
          const short = runDataRepoGit(cwd, 'git rev-parse --short HEAD')
          current = short ? `游离(${short})` : '游离'
        }
      } catch {
        current = 'unknown'
      }
      return {
        ok: true,
        branches,
        current,
        integrationBranch: status.integrationBranch,
        releaseBranch: status.releaseBranch
      }
    } catch (error: unknown) {
      return { ok: false, message: formatDataRepoGitError(error, '读取分支列表失败') }
    }
  }

  function checkoutDataRepoBranch(projectKey: string, branch: string): { ok: boolean; message: string } {
    const status = resolveProjectLinkStatus(projectKey)
    if (!status.linked || !status.managementRepoPath) {
      return { ok: false, message: '未完成业务仓与数据仓关联' }
    }
    const cwd = status.managementRepoPath
    if (!existsSync(cwd)) {
      return { ok: false, message: '数据仓路径不存在' }
    }
    if (gitWorkingTreeDirty(cwd)) {
      try {
        execFileSync('git', ['add', '-A'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
        const msg = `chore(pm-data): before checkout ${new Date().toISOString()}`
        try {
          execFileSync('git', ['commit', '-m', msg], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
        } catch {
          /* 无变更可提交时忽略（与并入协作主分支一致） */
        }
      } catch (error: unknown) {
        return {
          ok: false,
          message: formatDataRepoGitError(error, '无法暂存/提交改动，请手动处理工作区后再切换分支')
        }
      }
    }
    if (gitWorkingTreeDirty(cwd)) {
      return {
        ok: false,
        message:
          '工作区仍有未提交改动。请先在数据仓目录处理冲突或受保护文件，或使用「备份到 GitHub」完整提交并推送。'
      }
    }
    const name = branch.trim().replace(/^origin\//, '')
    if (!name || /[\s]/.test(name)) {
      return { ok: false, message: '分支名无效' }
    }
    try {
      if (status.backupReady) {
        runDataRepoGit(cwd, 'git fetch origin')
      }
      if (dataRepoBranchExistsLocal(cwd, name)) {
        runDataRepoGit(cwd, `git switch ${name}`)
        return { ok: true, message: `已切换到分支 ${name}` }
      }
      if (status.backupReady) {
        try {
          runDataRepoGit(cwd, `git rev-parse --verify origin/${name}`)
          runDataRepoGit(cwd, `git switch -c ${name} --track origin/${name}`)
          return { ok: true, message: `已基于远端 origin/${name} 创建并切换本地分支` }
        } catch {
          // fall through
        }
      }
      return { ok: false, message: `未找到分支「${name}」（本地或 origin 上均不存在）` }
    } catch (error: unknown) {
      return { ok: false, message: formatDataRepoGitError(error, '切换分支失败') }
    }
  }

  function pushDataRepo(projectKey: string): { ok: boolean; message: string } {
    const status = resolveProjectLinkStatus(projectKey)
    if (!status.backupReady) {
      return { ok: false, message: '数据仓未配置 origin，无法推送' }
    }
    const cwd = status.managementRepoPath
    if (!existsSync(cwd)) {
      return { ok: false, message: '数据仓路径不存在' }
    }
    try {
      runDataRepoGit(cwd, 'git fetch origin')
      const branch = runDataRepoGit(cwd, 'git branch --show-current')
      if (!branch) {
        return { ok: false, message: '无法读取当前分支' }
      }
      runDataRepoGit(cwd, 'git push -u origin HEAD')
      return { ok: true, message: `已推送到远端 origin/${branch}` }
    } catch (error: unknown) {
      return { ok: false, message: formatDataRepoGitError(error, '推送失败') }
    }
  }

  function gitWorkingTreeDirty(cwd: string): boolean {
    try {
      const line = execFileSync('git', ['status', '--porcelain'], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
      return Boolean(line)
    } catch {
      return false
    }
  }

  function originRefExists(cwd: string, branch: string): boolean {
    try {
      execFileSync('git', ['rev-parse', '--verify', `origin/${branch}`], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      return true
    } catch {
      return false
    }
  }

  /** 远端可作为「协作主分支」起点的分支：优先 main / master / develop（已存在于 origin） */
  function pickRemoteBaseBranchForNewIntegration(cwd: string, target: string): string | null {
    const candidates = ['main', 'master', 'develop'].filter((b) => b !== target)
    for (const b of candidates) {
      if (originRefExists(cwd, b)) {
        return b
      }
    }
    return null
  }

  /** 在已 fetch 的前提下，若 origin 尚无该分支则创建并推送；成功后尽量恢复到原 HEAD */
  function gitInitSingleRemoteBranchIfMissing(cwd: string, branch: string): { ok: boolean; message: string } {
    if (originRefExists(cwd, branch)) {
      return { ok: true, message: `origin/${branch} 已存在` }
    }
    if (gitWorkingTreeDirty(cwd)) {
      return {
        ok: false,
        message: '工作区有未提交改动，请先提交或暂存后再初始化远端分支'
      }
    }
    let headBefore = ''
    try {
      headBefore = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
    } catch {
      return { ok: false, message: '无法读取当前 HEAD' }
    }

    let msg = ''
    try {
      if (dataRepoBranchExistsLocal(cwd, branch)) {
        execFileSync('git', ['switch', branch], {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
        execFileSync('git', ['push', '-u', 'origin', branch], {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
        msg = `已推送本地 ${branch} 到远端`
      } else {
        const base = pickRemoteBaseBranchForNewIntegration(cwd, branch)
        if (base !== null) {
          execFileSync('git', ['switch', '-c', branch, `origin/${base}`], {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          })
          msg = `已基于 origin/${base} 创建并推送 origin/${branch}`
        } else {
          execFileSync('git', ['switch', '-c', branch], {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          })
          msg = `远端无 main/master/develop 等基准，已基于当前 HEAD 创建并推送 origin/${branch}`
        }
        execFileSync('git', ['push', '-u', 'origin', branch], {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
      }
    } catch (error: unknown) {
      return { ok: false, message: formatDataRepoGitError(error, '初始化远端分支失败') }
    } finally {
      if (headBefore) {
        try {
          execFileSync('git', ['checkout', headBefore], {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          })
        } catch {
          /* 恢复检出失败时忽略 */
        }
      }
    }
    return { ok: true, message: msg }
  }

  function checkDataRepoRemoteBranchStatus(projectKey: string): {
    ok: boolean
    message?: string
    integrationBranch: string
    releaseBranch: string
    integrationExists: boolean
    releaseExists: boolean | null
  } {
    const status = resolveProjectLinkStatus(projectKey)
    const ib = (status.integrationBranch || 'develop').trim()
    const rb = (status.releaseBranch || '').trim()
    if (!status.linked || !status.managementRepoPath) {
      return {
        ok: false,
        message: '未完成业务仓与数据仓关联',
        integrationBranch: ib || 'develop',
        releaseBranch: rb,
        integrationExists: false,
        releaseExists: rb ? false : null
      }
    }
    if (!status.backupReady) {
      return {
        ok: false,
        message: '未配置 origin，无法检查远端分支',
        integrationBranch: ib || 'develop',
        releaseBranch: rb,
        integrationExists: false,
        releaseExists: rb ? false : null
      }
    }
    const cwd = status.managementRepoPath
    if (!existsSync(cwd)) {
      return {
        ok: false,
        message: '数据仓路径不存在',
        integrationBranch: ib || 'develop',
        releaseBranch: rb,
        integrationExists: false,
        releaseExists: rb ? false : null
      }
    }
    try {
      execFileSync('git', ['fetch', 'origin'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const integrationBranch = ib || 'develop'
      const integrationExists = originRefExists(cwd, integrationBranch)
      const releaseExists = rb ? originRefExists(cwd, rb) : null
      return {
        ok: true,
        integrationBranch,
        releaseBranch: rb,
        integrationExists,
        releaseExists
      }
    } catch (error: unknown) {
      return {
        ok: false,
        message: formatDataRepoGitError(error, '检查远端分支失败'),
        integrationBranch: ib || 'develop',
        releaseBranch: rb,
        integrationExists: false,
        releaseExists: rb ? false : null
      }
    }
  }

  function initDataRepoRemoteBranches(
    projectKey: string,
    options: { integration?: boolean; release?: boolean }
  ): { ok: boolean; message: string } {
    const status = resolveProjectLinkStatus(projectKey)
    if (!status.linked || !status.managementRepoPath) {
      return { ok: false, message: '未完成业务仓与数据仓关联' }
    }
    if (!status.backupReady) {
      return { ok: false, message: '未配置 origin，无法推送' }
    }
    const cwd = status.managementRepoPath
    if (!existsSync(cwd)) {
      return { ok: false, message: '数据仓路径不存在' }
    }
    const ib = (status.integrationBranch || 'develop').trim()
    if (!ib || /\s/.test(ib)) {
      return { ok: false, message: '协作主分支名无效' }
    }
    const rb = (status.releaseBranch || '').trim()
    const initIntegration = options.integration !== false
    const initRelease = rb.length > 0 && options.release !== false
    if (!initIntegration && !initRelease) {
      return { ok: false, message: '未指定要初始化的远端分支' }
    }
    try {
      execFileSync('git', ['fetch', 'origin'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const parts: string[] = []
      if (initIntegration) {
        const r = gitInitSingleRemoteBranchIfMissing(cwd, ib)
        if (!r.ok) {
          return r
        }
        parts.push(`协作主分支：${r.message}`)
      }
      if (initRelease) {
        const r = gitInitSingleRemoteBranchIfMissing(cwd, rb)
        if (!r.ok) {
          return r
        }
        parts.push(`发布分支：${r.message}`)
      }
      return { ok: true, message: parts.join('；') }
    } catch (error: unknown) {
      return { ok: false, message: formatDataRepoGitError(error, '初始化远端分支失败') }
    }
  }

  /** 将当前分支工作提交后并入「协作主分支」（默认 develop）并推送；已在主分支时等价于拉取+推送 */
  function mergeCurrentIntoIntegrationBranchAndPush(projectKey: string): { ok: boolean; message: string } {
    const status = resolveProjectLinkStatus(projectKey)
    if (!status.linked || !status.managementRepoPath) {
      return { ok: false, message: '未完成业务仓与数据仓关联' }
    }
    if (!status.backupReady) {
      return { ok: false, message: '数据仓未配置 origin，无法推送' }
    }
    const cwd = status.managementRepoPath
    if (!existsSync(cwd)) {
      return { ok: false, message: '数据仓路径不存在' }
    }
    const target = (status.integrationBranch || 'develop').trim()
    if (!target || /\s/.test(target)) {
      return { ok: false, message: '协作主分支名无效，请在左侧填写并保存约定' }
    }
    try {
      execFileSync('git', ['fetch', 'origin'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      let sourceBranch = execFileSync('git', ['branch', '--show-current'], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
      let createdDetachedTempBranch = false
      if (!sourceBranch) {
        let short = ''
        try {
          short = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          }).trim()
        } catch {
          /* */
        }
        if (!short) {
          return { ok: false, message: '无法解析当前 HEAD，请确认数据仓为有效 Git 仓库' }
        }
        let candidate = `pm-detached-${short}`
        let n = 0
        while (dataRepoBranchExistsLocal(cwd, candidate)) {
          n += 1
          candidate = `pm-detached-${short}-${n}`
        }
        try {
          execFileSync('git', ['switch', '-c', candidate], {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          })
          sourceBranch = candidate
          createdDetachedTempBranch = true
        } catch (error: unknown) {
          return {
            ok: false,
            message: formatDataRepoGitError(
              error,
              '当前数据仓处于游离 HEAD，且无法从当前提交创建临时分支。请切换到一条本地分支后再并入'
            )
          }
        }
      }
      if (gitWorkingTreeDirty(cwd)) {
        execFileSync('git', ['add', '-A'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
        const msg = `chore(pm-data): workspace ${new Date().toISOString()}`
        try {
          execFileSync('git', ['commit', '-m', msg], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
        } catch {
          /* 无变更可提交时忽略 */
        }
      }

      const hasOriginTarget = originRefExists(cwd, target)

      if (!hasOriginTarget) {
        return {
          ok: false,
          message: `远端不存在 origin/${target}。请先在「分支约定」中点击「检查远端分支」，对缺失项执行「初始化远端分支」后再试。`
        }
      }

      if (dataRepoBranchNameMatch(sourceBranch, target)) {
        execFileSync('git', ['pull', '--rebase', 'origin', target], {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
        execFileSync('git', ['push', '-u', 'origin', 'HEAD'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
        const after = dataRepoReadCurrentBranch(cwd)
        return {
          ok: true,
          message: `已在「${after || target}」上拉取远端并推送`
        }
      }

      if (dataRepoBranchExistsLocal(cwd, target)) {
        execFileSync('git', ['switch', target], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      } else {
        execFileSync('git', ['switch', '-c', target, '--track', `origin/${target}`], {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
      }
      execFileSync('git', ['pull', '--rebase', 'origin', target], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      try {
        execFileSync('git', ['merge', sourceBranch, '--no-edit'], {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
      } catch (error: unknown) {
        return {
          ok: false,
          message: formatDataRepoGitError(
            error,
            `合并 ${sourceBranch} → ${target} 失败（可能有冲突，请在数据仓目录用 Git 处理）`
          )
        }
      }

      let onBranch = dataRepoReadCurrentBranch(cwd)
      if (!onBranch) {
        return {
          ok: false,
          message:
            '合并后未处于任何本地分支（可能是 detached HEAD）。请在数据仓目录手动执行 git checkout 到协作主分支后再推送。'
        }
      }
      if (!dataRepoBranchNameMatch(onBranch, target)) {
        try {
          execFileSync('git', ['switch', target], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
          onBranch = dataRepoReadCurrentBranch(cwd)
        } catch {
          /* 尝试失败则沿用下方报错 */
        }
        if (!onBranch || !dataRepoBranchNameMatch(onBranch, target)) {
          return {
            ok: false,
            message: `合并后当前检出为「${onBranch || '未知'}」，与约定协作主分支「${target}」不一致，已中止推送。请在数据仓目录确认分支后再试。`
          }
        }
      }

      execFileSync('git', ['push', '-u', 'origin', 'HEAD'], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const shown = dataRepoReadCurrentBranch(cwd) || target
      if (createdDetachedTempBranch && sourceBranch.startsWith('pm-detached-')) {
        try {
          execFileSync('git', ['branch', '-d', sourceBranch], {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          })
        } catch {
          /* 合并后删除临时分支；失败则保留便于排查 */
        }
      }
      return {
        ok: true,
        message: `已将「${sourceBranch}」并入「${target}」并推送到 GitHub（当前检出「${shown}」）${
          createdDetachedTempBranch ? '；游离 HEAD 已先转为临时分支完成合并' : ''
        }`
      }
    } catch (error: unknown) {
      return { ok: false, message: formatDataRepoGitError(error, '并入协作主分支失败') }
    }
  }

  function saveDataRepoBranchConfig(
    projectKey: string,
    integrationBranch?: string,
    releaseBranch?: string
  ): { ok: boolean; message: string } {
    const config = loadLinkConfig()
    const projects = config.projects && typeof config.projects === 'object' ? config.projects : {}
    const entry = projects[projectKey]
    if (!entry || typeof entry !== 'object') {
      return { ok: false, message: '未找到项目关联配置' }
    }
    const next = { ...entry } as Record<string, unknown>
    if (integrationBranch !== undefined) {
      const v = integrationBranch.trim()
      if (v) next.integrationBranch = v
    }
    if (releaseBranch !== undefined) {
      next.releaseBranch = releaseBranch.trim()
    }
    projects[projectKey] = next
    saveLinkConfig({ ...(config || {}), version: 1, projects })
    return { ok: true, message: '分支约定已保存到本地配置' }
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
      execSync('node scripts/pm/pm-startup-check.mjs', {
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
    function runGit(command: string, cwd: string): string {
      return execSync(command, {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
    }

    function formatGitActionError(error: unknown, fallbackMessage: string): string {
      const err = error as { stderr?: string | Buffer; stdout?: string | Buffer; message?: string }
      const stderrText =
        typeof err?.stderr === 'string'
          ? err.stderr
          : err?.stderr
            ? Buffer.from(err.stderr).toString('utf-8')
            : ''
      const stdoutText =
        typeof err?.stdout === 'string'
          ? err.stdout
          : err?.stdout
            ? Buffer.from(err.stdout).toString('utf-8')
            : ''
      const raw = `${stderrText}\n${stdoutText}\n${err?.message || ''}`.trim()
      const normalized = raw.toLowerCase()

      if (
        normalized.includes('could not resolve host') ||
        normalized.includes('failed to connect') ||
        normalized.includes('connection timed out')
      ) {
        return '网络连接失败：请检查网络或代理后重试'
      }
      if (
        normalized.includes('authentication failed') ||
        normalized.includes('permission denied (publickey)') ||
        normalized.includes('could not read username')
      ) {
        return 'GitHub 鉴权失败：请确认账号登录状态或 SSH/Token 权限'
      }
      if (
        normalized.includes('conflict') ||
        normalized.includes('merge conflict') ||
        normalized.includes('rebase')
      ) {
        return '与远端存在提交冲突：请先同步并处理冲突后再备份'
      }
      if (normalized.includes('no upstream branch')) {
        return '当前分支未设置远端跟踪：请先完成一次 -u 推送'
      }
      if (normalized.includes('not a git repository')) {
        return '管理仓库不可用：目标路径不是 Git 仓库'
      }

      const lastLine = raw.split('\n').map((line) => line.trim()).filter(Boolean).slice(-1)[0]
      if (lastLine) {
        return `${fallbackMessage}（${lastLine}）`
      }
      return fallbackMessage
    }

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
      const branch = status.managementBranch && status.managementBranch !== 'unknown'
        ? status.managementBranch
        : runGit('git branch --show-current', status.managementRepoPath)
      if (!branch || branch === 'unknown') {
        return { ok: false, message: '无法识别管理仓库分支，请先在该仓库检出有效分支' }
      }

      runGit('git fetch origin', status.managementRepoPath)

      if (action === 'sync') {
        runGit(`git pull --rebase --autostash origin ${branch}`, status.managementRepoPath)
        return { ok: true, message: '数据仓同步成功（已拉取远端最新提交）' }
      }

      runGit('git add .', status.managementRepoPath)
      const staged = runGit('git diff --cached --name-only', status.managementRepoPath)
      let changed = false
      if (staged) {
        const message = `chore(pm-data): ui backup ${new Date().toISOString()}`
        runGit(`git commit -m "${message}"`, status.managementRepoPath)
        changed = true
      }

      runGit(`git pull --rebase --autostash origin ${branch}`, status.managementRepoPath)
      runGit(`git push -u origin ${branch}`, status.managementRepoPath)
      return {
        ok: true,
        message: changed ? '数据仓备份成功并已推送' : '远端已对齐（无本地新增变更）',
        changed
      }
    } catch (error) {
      return {
        ok: false,
        message:
          action === 'sync'
            ? formatGitActionError(error, '数据仓同步失败')
            : formatGitActionError(error, '数据仓备份失败')
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

  function setProjectWorkingMode(
    projectKey: string,
    mode: 'single_local' | 'multi_sync'
  ): { ok: boolean; message: string } {
    const config = loadLinkConfig()
    const projects = config.projects && typeof config.projects === 'object' ? config.projects : {}
    const entry = projects[projectKey]
    if (!entry || typeof entry !== 'object') {
      return { ok: false, message: '未找到项目关联配置，请先完成业务仓与数据仓关联' }
    }
    const status = resolveProjectLinkStatus(projectKey)
    const nextEntry = {
      ...entry,
      workingMode: mode,
      modeConfirmed: true,
      modeConfirmedAt: Date.now(),
      confirmedRemoteUrl: status.remoteUrl || ''
    }
    projects[projectKey] = nextEntry
    saveLinkConfig({ ...(config || {}), version: 1, projects })
    return {
      ok: true,
      message: mode === 'multi_sync' ? '已切换为多设备同步模式' : '已切换为本地单机模式'
    }
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

    middlewares.use('/__pm_api/mode', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const mode = parsed?.workingMode === 'multi_sync' ? 'multi_sync' : 'single_local'
          const result = setProjectWorkingMode(projectKey, mode)
          const status = resolveProjectLinkStatus(projectKey)
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ...result, projectKey, workingMode: status.workingMode, modeConfirmed: status.modeConfirmed }))
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
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

    middlewares.use('/__pm_api/data/branches', (req: any, res: any) => {
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        const doFetch = url.searchParams.get('fetch') === '1' || url.searchParams.get('fetch') === 'true'
        const result = listDataRepoBranches(projectKey, doFetch)
        res.statusCode = result.ok ? 200 : 400
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ projectKey, ...result }))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'branches list failed' }))
      }
    })

    middlewares.use('/__pm_api/data/checkout', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const branch = typeof parsed.branch === 'string' ? parsed.branch : ''
          const result = checkoutDataRepoBranch(projectKey, branch)
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ...result, projectKey }))
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/data/push', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const result = pushDataRepo(projectKey)
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ...result, projectKey }))
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/data/merge-integration', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const result = mergeCurrentIntoIntegrationBranchAndPush(projectKey)
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ...result, projectKey }))
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/data/branch-config', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const integrationBranch =
            typeof parsed.integrationBranch === 'string' ? parsed.integrationBranch : undefined
          const releaseBranch = typeof parsed.releaseBranch === 'string' ? parsed.releaseBranch : undefined
          const result = saveDataRepoBranchConfig(projectKey, integrationBranch, releaseBranch)
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          const status = resolveProjectLinkStatus(projectKey)
          res.end(
            JSON.stringify({
              ...result,
              projectKey,
              integrationBranch: status.integrationBranch,
              releaseBranch: status.releaseBranch
            })
          )
        })
        .catch(() => {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, message: 'invalid json payload' }))
        })
    })

    middlewares.use('/__pm_api/data/branch-remote-status', (req: any, res: any) => {
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      try {
        const url = new URL(req.url || '', 'http://localhost')
        const projectKey = url.searchParams.get('projectKey') || defaultProjectKey
        const result = checkDataRepoRemoteBranchStatus(projectKey)
        res.statusCode = result.ok ? 200 : 400
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ projectKey, ...result }))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, message: 'branch remote status failed' }))
      }
    })

    middlewares.use('/__pm_api/data/branch-init', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ ok: false, message: 'method not allowed' }))
        return
      }
      void parseRequestBody(req)
        .then((parsed: any) => {
          const projectKey = parseProjectKeyFromBody(parsed)
          const integration = parsed.integration
          const release = parsed.release
          const result = initDataRepoRemoteBranches(projectKey, {
            integration: typeof integration === 'boolean' ? integration : undefined,
            release: typeof release === 'boolean' ? release : undefined
          })
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
              const check = runStartupCheck(projectKey) as {
                messages?: string[]
                severity?: string
              }
              const message =
                (check.messages && check.messages[0]) || `启动检查完成（${check.severity || 'unknown'}）`
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true, action, check, message }))
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
