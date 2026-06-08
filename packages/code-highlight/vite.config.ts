import { resolve } from 'node:path'

import { defineConfig } from 'vite'

import { createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config'

const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
    dedupe: ['vue'],
  },
  server: {
    port: 9000,
  },
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      entry,
    },
    rolldownOptions: {
      // Bundle all dependencies into the output.
      //
      // This package depends on the unified/remark/rehype/micromark/lowlight
      // stack, which transitively pulls in CommonJS-only modules (`extend` via
      // `unified`, `debug` via `micromark`) plus `highlight.js` (which uses
      // `require()`). Externalizing them ships raw CJS to consumers, which
      // breaks Vite dev under pnpm's strict node_modules layout
      // (`exports is not defined`). By bundling, Rolldown converts the CJS to
      // ESM at build time so consumers only ever see self-contained ESM.
      external: [],
      output: {
        // Map each entry to the dist layout the `exports` map expects
        // (e.g. `code/index` -> `dist/code/index.js`).
        entryFileNames: '[name].js',
        // Co-locate shared chunks under a predictable directory.
        chunkFileNames: 'chunks/[name].js',
      },
    },
  },
})
