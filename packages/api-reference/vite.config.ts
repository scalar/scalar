import { URL, fileURLToPath } from 'node:url'
import { autoCSSInject, createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { version } from './package.json'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
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
