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
      name: '@scalar/api-client',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        ...Object.keys(pkg.dependencies || {}).filter(
          (item) => !item.startsWith('@scalar'),
        ),
      ],
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
