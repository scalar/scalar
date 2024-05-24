import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import pkg from './package.json'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5041,
  },
})
