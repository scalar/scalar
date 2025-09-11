import { URL, fileURLToPath } from 'node:url'

import { createViteBuildOptions } from '@scalar/build-tooling/vite'
import vue from '@vitejs/plugin-vue'
import { type BuildEnvironmentOptions, defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
  build: createViteBuildOptions<BuildEnvironmentOptions>({
    entry: ['src/index.ts'],
    options: {
      ssr: false,
    },
  }),
})
