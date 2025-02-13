import { alias } from '@scalar/build-tooling'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: alias(import.meta.url),
  },
  server: {
    port: 9000,
  },
})
