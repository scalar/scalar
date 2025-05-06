import { fileURLToPath } from 'node:url'
import { createViteBuildOptions, findEntryPoints } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env': {},
    'process.platform': JSON.stringify(process.platform),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
    options: {
      ssr: false,
    },
  }),
})
