import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./playground/src', import.meta.url)) },
  },
  server: {
    port: 5067,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
  }),
})
