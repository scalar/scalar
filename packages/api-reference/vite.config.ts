import { autoCSSInject, createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vue'],
  },
  build: createViteBuildOptions({
    entry: ['src/index.ts'],
    options: {
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        plugins: [autoCSSInject('references')],
      },
    },
  }),
})
