import { resolve } from 'node:path'

import { type Plugin, defineConfig } from 'vite'

import { createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config'

const entryPaths = await findEntryPoints()
const entry = createLibEntry(entryPaths, import.meta.dirname)

/**
 * Force the universal build of `decode-named-character-reference`.
 *
 * The package ships a `browser` export (`index.dom.js`) that decodes entities
 * via a `<textarea>` and touches `document` at module load. Because we bundle
 * dependencies, Rolldown would inline that browser variant into the output and
 * crash the moment the bundle is imported in Node/SSR (e.g. vitest:
 * `ReferenceError: document is not defined`). The default `index.js` is a pure
 * implementation that works everywhere, including the browser, so we rewrite
 * the resolved id to it.
 */
const useUniversalDecodeNamedCharacterReference = (): Plugin => ({
  name: 'use-universal-decode-named-character-reference',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source !== 'decode-named-character-reference') {
      return null
    }

    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })

    return resolved ? resolved.id.replace(/index\.dom\.js$/, 'index.js') : null
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [useUniversalDecodeNamedCharacterReference()],
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
