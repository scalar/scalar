import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
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
    cssCodeSplit: true,
    minify: false,
    lib: {
      entry: ['src/index.ts', 'src/assets/css/variables.css'],
      name: '@scalar/api-client',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'style.css'
          }

          return assetInfo.name ?? 'default'
        },
      },
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
