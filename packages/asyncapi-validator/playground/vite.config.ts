import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Resolve the package to its source so edits to the validator hot-reload without
// a rebuild. The `@` alias covers the validator's own internal imports.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@scalar/asyncapi-validator': resolve(import.meta.dirname, '../src/index.ts'),
      '@': resolve(import.meta.dirname, '../src'),
    },
  },
  server: {
    port: 5598,
  },
})
