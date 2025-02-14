import { alias, findEntryPoints } from '@scalar/build-tooling'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import pkg from './package.json'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: alias(import.meta.url),
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
})
