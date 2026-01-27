import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      externalizeDeps: true,
    },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      externalizeDeps: true,
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [vue()],
    build: {
      outDir: 'dist/renderer',
    },
  },
})
