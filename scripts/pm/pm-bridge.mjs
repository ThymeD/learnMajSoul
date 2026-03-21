import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectKey = process.env.PM_PROJECT_KEY || 'learnMajSoul'
const bridgeFile = resolve(__dirname, `../../.project-management/${projectKey}-bridge.json`)

function ensureBridgeFile() {
  const parent = dirname(bridgeFile)
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true })
  }
  if (!existsSync(bridgeFile)) {
    writeFileSync(bridgeFile, JSON.stringify({ version: 1, events: [] }, null, 2), 'utf-8')
  }
}

function loadBridge() {
  ensureBridgeFile()
  try {
    const raw = readFileSync(bridgeFile, 'utf-8')
    const data = JSON.parse(raw)
    if (!Array.isArray(data.events)) data.events = []
    if (typeof data.version !== 'number') data.version = 1
    return data
  } catch {
    return { version: 1, events: [] }
  }
}

function saveBridge(data) {
  writeFileSync(bridgeFile, JSON.stringify(data, null, 2), 'utf-8')
}

function nextId() {
  return `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function appendEvent(event) {
  const data = loadBridge()
  data.events.push(event)
  saveBridge(data)
}

function printHelp() {
  console.log(`Usage:
  npm run bridge:event -- status <itemId> <toStatus> [note]
  npm run bridge:event -- create <title> [domain] [note]

Env:
  PM_PROJECT_KEY=<projectKey>  # default: learnMajSoul

Examples:
  npm run bridge:event -- status pm-123 pending_user_confirm "AI完成开发，提交确认"
  npm run bridge:event -- create "优化交付看板筛选" management "AI建议新增筛选器"
`)
}

const [, , command, ...args] = process.argv

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp()
  process.exit(0)
}

if (command === 'status') {
  const [itemId, toStatus, ...restNote] = args
  if (!itemId || !toStatus) {
    printHelp()
    process.exit(1)
  }
  const note = restNote.join(' ').trim()
  appendEvent({
    id: nextId(),
    action: 'update_status',
    createdAt: Date.now(),
    actor: 'AI',
    itemId,
    toStatus,
    note
  })
  console.log(`Bridge event added: status ${itemId} -> ${toStatus} (${projectKey})`)
  process.exit(0)
}

if (command === 'create') {
  const [title, domainArg, ...restNote] = args
  if (!title) {
    printHelp()
    process.exit(1)
  }
  const domain = domainArg === 'management' || domainArg === 'product' ? domainArg : 'product'
  const note = restNote.join(' ').trim()
  appendEvent({
    id: nextId(),
    action: 'create_item',
    createdAt: Date.now(),
    actor: 'AI',
    note,
    payload: {
      title,
      domain,
      status: 'pending_ai',
      kind: 'todo',
      mode: 'both',
      priority: 'P2',
      handler: 'ai'
    }
  })
  console.log(`Bridge event added: create "${title}" (${domain}, ${projectKey})`)
  process.exit(0)
}

console.error(`Unknown command: ${command}`)
printHelp()
process.exit(1)
