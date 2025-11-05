import { alias } from '@scalar/build-tooling/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: alias(import.meta.url),
  },
})
