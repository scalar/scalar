import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

import packageFile from './package.json'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  build: {
    minify: true,
    ssr: true,
    lib: {
      entry: ['src/index.ts'],
      name: packageFile.name,
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['zod'],
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
