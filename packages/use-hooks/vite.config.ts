import { alias, createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: alias(import.meta.url),
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: false }),
  }),

  test: {
    environment: 'jsdom',
  },
})
