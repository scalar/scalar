import { alias } from '@scalar/build-tooling'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: alias(import.meta.url),
  },
})
