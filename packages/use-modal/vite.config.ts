import { createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
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
