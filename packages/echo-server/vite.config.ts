import { defineConfig } from 'vitest/config'

import pkg from './package.json'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/echo-server',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies)],
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
