import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  build: {
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/api-reference',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
  server: {
    port: 7070,
  },
  test: {
    setupFiles: 'test/setup.ts',
    exclude: [...configDefaults.exclude],
    environment: 'jsdom',
    globals: true,
    coverage: {
      all: true,
      include: ['src/**'],
      provider: 'istanbul',
    },
  },
})
