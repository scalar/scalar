import { alias } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: alias(import.meta.url),
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
