import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
  findEntryPoints,
} from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson(resolve(import.meta.dirname, 'package.json'))
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@test': resolve(import.meta.dirname, './test'),
    },
    dedupe: ['vue'],
  },
  build: {
    outDir: './dist',
    sourcemap: true,
    lib: {
      formats: ['es'],
      cssFileName: 'style',
      entry,
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      external,
      output: createPreserveModulesOutput(),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/vitest.setup.ts'],
  },
})
