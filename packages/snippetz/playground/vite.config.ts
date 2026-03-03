import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // Most specific first so Vite does not prefix-match the shorter alias
      { find: '@scalar/snippetz/clients/lazy', replacement: resolve(__dirname, '../src/clients/lazy/index.ts') },
      { find: '@scalar/snippetz/clients', replacement: resolve(__dirname, '../src/clients/index.ts') },
      { find: '@scalar/snippetz', replacement: resolve(__dirname, '../src/index.ts') },
      // The snippetz source uses `@/` as a path alias for `src/`
      { find: /^@\//, replacement: resolve(__dirname, '../src') + '/' },
    ],
  },
})
