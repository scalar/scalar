import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

export default defineConfig({
  plugins: [vue(), dts({ insertTypesEntry: true, rollupTypes: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 5066,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
    options: {
      ssr: false,
    },
  }),
})
