import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectKey = process.env.PM_PROJECT_KEY || 'learnMajSoul'
const receiptsFile = resolve(__dirname, `../.project-management/${projectKey}-receipts.json`)

function printHelp() {
  console.log(`Usage:
  npm run bridge:receipts -- tail [count]

Env:
  PM_PROJECT_KEY=<projectKey>  # default: learnMajSoul

Examples:
  npm run bridge:receipts -- tail
  npm run bridge:receipts -- tail 20
`)
}

function loadReceipts() {
  if (!existsSync(receiptsFile)) {
    return []
  }
  try {
    const raw = readFileSync(receiptsFile, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data.receipts) ? data.receipts : []
  } catch {
    return []
  }
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function printRecommendation(receipts) {
  if (receipts.length === 0) {
    console.log('建议: 暂无回执，保持当前任务推进。')
    return
  }
  const latest = [...receipts].sort((a, b) => b.createdAt - a.createdAt)[0]
  if (latest.action === 'user_reject') {
    console.log(`建议: 继续开发（最近是用户打回，itemId=${latest.itemId}）。`)
    return
  }
  if (latest.action === 'ai_submit_for_confirm') {
    console.log(`建议: 等待用户（最近是AI提交确认，itemId=${latest.itemId}）。`)
    return
  }
  if (latest.action === 'user_confirm') {
    console.log(`建议: 当前项可收尾或切换下一项（itemId=${latest.itemId}）。`)
    return
  }
  console.log('建议: 保持当前流程。')
}

const [, , command, countArg] = process.argv

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp()
  process.exit(0)
}

if (command !== 'tail') {
  console.error(`Unknown command: ${command}`)
  printHelp()
  process.exit(1)
}

const count = Math.max(1, Number.parseInt(countArg || '10', 10) || 10)
const receipts = loadReceipts().sort((a, b) => b.createdAt - a.createdAt)
const subset = receipts.slice(0, count)

console.log(`Project: ${projectKey}`)
console.log(`Receipts file: ${receiptsFile}`)
console.log(`Total receipts: ${receipts.length}`)
console.log(`Showing latest: ${subset.length}`)
console.log('---')

if (subset.length === 0) {
  console.log('暂无回执记录')
  printRecommendation(receipts)
  process.exit(0)
}

subset.forEach((r, idx) => {
  console.log(
    `${idx + 1}. ${fmtTime(r.createdAt)} | ${r.action} | item=${r.itemId} | ${r.statusFrom} -> ${r.statusTo}`
  )
  console.log(`   operator=${r.operator} | note=${r.note || '无'}`)
})

console.log('---')
printRecommendation(receipts)
