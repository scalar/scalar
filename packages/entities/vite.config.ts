import { alias } from '@scalar/build-tooling'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: alias(import.meta.url),
  },
  server: {
    port: 7070,
  },
  test: {
    exclude: [...configDefaults.exclude],
    environment: 'jsdom',
    globals: true,
    coverage: {
      all: true,
      include: ['src/**'],
      provider: 'istanbul',
    },
  },
})
