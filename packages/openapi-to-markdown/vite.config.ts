import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { createExternalsFromPackageJson, createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config'
import { whitespacePredicates } from './scripts/whitespace-predicates'

// Bundle the converter so its whitespace fix reaches downstream installations.
const external = createExternalsFromPackageJson().filter((pattern) => !pattern.test('rehype-remark'))
const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

export default defineConfig({
  plugins: [vue(), whitespacePredicates()],
  ssr: { noExternal: true },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
    dedupe: ['vue'],
  },
  build: {
    // This package only renders on the server; avoid building client-side VNode trees.
    ssr: true,
    outDir: './dist',
    license: { fileName: 'THIRD_PARTY_LICENSES.md' },
    minify: false,
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
    },
  },
})
