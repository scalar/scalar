import { findEntryPoints } from '@scalar/build-tooling'
import { alias, createViteBuildOptions, sanitizeVirtualModules } from '@scalar/build-tooling/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sanitizeVirtualModules(), vue()],
  resolve: {
    alias: alias(import.meta.url),
    dedupe: ['vue'],
  },
  server: {
    port: 5064,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
    options: {
      ssr: false,
    },
  }),
})
