import { resolve } from 'node:path'

import { type Plugin, defineConfig } from 'vite'

import { createLibEntry, findEntryPoints } from '../../tooling/scripts/vite-lib-config.ts'

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
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      entry,
    },
    rolldownOptions: {
      // Bundle every dependency except the highlighter into the output.
      //
      // This package depends on the unified/remark/rehype/micromark stack,
      // which transitively pulls in CommonJS-only modules (`extend` via
      // `unified`, `debug` via `micromark`). Externalizing them ships raw CJS
      // to consumers, which breaks Vite dev under pnpm's strict node_modules
      // layout (`exports is not defined`). By bundling, Rolldown converts the
      // CJS to ESM at build time so consumers only ever see self-contained ESM.
      //
      // `@scalar/highlight` is plain ESM and stays external, so a page that
      // renders both Markdown and `ScalarCodeBlock` loads one copy of the
      // grammars rather than two.
      external: [/^@scalar\/highlight(\/|$)/],
      output: {
        // One file per module, dependencies included. With shared chunks, every bundled
        // dependency landed in one chunk that the root entry imported, so `htmlFromMarkdown`
        // dragged the whole unified stack (and parse5) into every consumer's initial load,
        // even though only the "Copy as Markdown" helpers use it. Separate files let a
        // consumer's bundler drop what it never imports, as `sideEffects: false` allows.
        preserveModules: true,
        preserveModulesRoot: './src',
        entryFileNames: (chunk) => {
          // npm drops nested `node_modules` folders from the tarball, so bundled dependencies
          // go under `vendor/`, keyed by their pnpm store folder so two versions cannot collide.
          const vendored = chunk.facadeModuleId?.match(
            /\/node_modules\/\.pnpm\/([^/]+)\/node_modules\/(?:@[^/]+\/)?[^/]+\/(.+)\.[cm]?js$/,
          )
          if (vendored) return `vendor/${vendored[1]}/${vendored[2]}.js`
          return `${chunk.name.replace(/node_modules/g, 'vendor')}.js`
        },
      },
    },
  },
})
