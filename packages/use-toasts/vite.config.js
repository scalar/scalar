import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: pkg.name,
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'nanoid'],
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
