import { autoCSSInject, createViteBuildOptions } from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [vue()],
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
  resolve: {
    dedupe: ['vue'],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
