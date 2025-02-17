import { fileURLToPath, URL } from 'node:url'

import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 9000,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: false }),
  }),
})
