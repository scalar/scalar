import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      /* TODO: Remove/Separate dependencies */
      '@lib': fileURLToPath(
        new URL('../../packages/library/src', import.meta.url),
      ),
      '@guide': fileURLToPath(
        new URL('../../packages/guide/src', import.meta.url),
      ),
    },
  },
  build: {
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/swagger-editor',
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
