import path from 'path'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/api-client-proxy',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies)],
    },
  },
  resolve: {},
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
