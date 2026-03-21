import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    // tests/pm：与 src/pm 对齐的 PM 套件测试；tests/*.test.ts：业务侧（如手牌分析）
    include: ['src/**/*.test.{ts,tsx,js,jsx}', 'tests/**/*.test.ts']
  }
})
