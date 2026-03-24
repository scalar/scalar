import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 9000,
  },
  test: {
    environment: 'jsdom',
  },
})
