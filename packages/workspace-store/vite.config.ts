import { resolve } from 'node:path'

import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@test': resolve(import.meta.dirname, './test'),
    },
  },
})
