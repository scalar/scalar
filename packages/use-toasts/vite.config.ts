import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/use-toasts',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
