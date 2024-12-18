import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // TODO: We don’t want to load Vue, but it’s helpful while we directly import the source files.
  plugins: [vue()],
  // TODO: We don’t want to add aliases here, but it’s helpful while we directly import the source files.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
})
