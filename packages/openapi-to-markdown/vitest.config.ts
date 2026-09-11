import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: { env: { MARKDOWN_EVALUATION_STRICT: '1' }, include: ['src/**/*.test.ts', 'evaluation/**/*.test.ts'] },
})
