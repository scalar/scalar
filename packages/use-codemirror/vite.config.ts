import { alias } from '@scalar/build-tooling'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: alias(import.meta.url),
  },
})
