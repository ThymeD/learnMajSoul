/**
 * PM 核心可加载性（不经 `core/index` 桶导出，避免 config ↔ delivery 循环依赖在 Vitest 下未初始化）
 */
import { describe, it, expect } from 'vitest'
import { createDefaultProjectTemplates } from '../../src/pm/core/templates'

describe('pm/core/templates', () => {
  it('createDefaultProjectTemplates returns non-empty list', () => {
    const templates = createDefaultProjectTemplates()
    expect(Array.isArray(templates)).toBe(true)
    expect(templates.length).toBeGreaterThan(0)
    expect(templates[0]?.id).toBeTruthy()
  })
})
