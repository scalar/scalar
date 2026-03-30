import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
} from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()

const entries = ['./src/index.ts']

const entry = createLibEntry(entries, import.meta.dirname)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
    dedupe: ['vue'],
  },
  build: {
    outDir: './dist',
    minify: false,
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
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
})
