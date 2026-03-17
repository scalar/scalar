import { resolve } from 'node:path'

import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
})
