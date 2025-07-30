import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    fs: {
      allow: [
        fileURLToPath(new URL('./', import.meta.url)),
        '../../**/*.preview.ts',
        '../../**/*.ts',
        '../../**/*.js',
        '../../**/*.vue',
      ],
    },
  },
})
