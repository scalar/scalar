import { createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
  }),
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
