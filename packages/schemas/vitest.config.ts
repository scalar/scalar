import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    root: resolve(import.meta.dirname, '.'),
  },
  plugins: [],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
  },
})
