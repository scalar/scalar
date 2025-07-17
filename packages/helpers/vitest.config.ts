import { alias } from '@scalar/build-tooling'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: alias(import.meta.url),
  },
  server: {
    port: 9000,
  },
  test: {
    environment: 'jsdom',
    coverage: {
      include: ['src/**'],
      reporter: ['text'],
    },
  },
})
