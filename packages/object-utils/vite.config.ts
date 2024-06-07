import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: false }),
  }),
})
