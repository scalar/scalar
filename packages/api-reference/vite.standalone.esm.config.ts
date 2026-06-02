import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { webpackStats } from 'rollup-plugin-webpack-stats'
import { defineConfig } from 'vite'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

import { name, version } from './package.json'

const licenseBannerTemplate = String.raw`/**
 *    _____ _________    __    ___    ____
 *   / ___// ____/   |  / /   /   |  / __ \
 *   \__ \/ /   / /| | / /   / /| | / /_/ /
 *  ___/ / /___/ ___ |/ /___/ ___ |/ _, _/
 * /____/\____/_/  |_/_____/_/  |_/_/ |_|
 *
 * {{ packageName }} {{ version }}
 *
 * Website: https://scalar.com
 * GitHub:  https://github.com/scalar/scalar
 * License: https://github.com/scalar/scalar/blob/main/LICENSE
**/
`

const replaceVariables = (template: string, variables: Record<string, string>) =>
  Object.entries(variables).reduce(
    (content, [key, value]) => content.replace(new RegExp(`\\{\\{ ${key} \\}\\}`, 'g'), value),
    template,
  )

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    'PACKAGE_VERSION': `"${version}"`,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@test': resolve(import.meta.dirname, './test'),
    },
    dedupe: ['vue'],
  },
  plugins: [
    vue(),
    tailwindcss(),
    // Tag the single injected <style> with a known id so the runtime can detach
    // it on `destroy()`. Without this, the global styles linger in <head> after
    // SPA-style navigation (Turbo Drive, htmx). Keep the id in sync with
    // `STANDALONE_STYLE_ID` in `src/standalone/lib/html-api.ts`.
    cssInjectedByJsPlugin({ attributes: { id: 'scalar-style' } }),
    webpackStats({ fileName: 'webpack-stats.esm.json' }),
    banner({
      outDir: 'dist/browser',
      content: replaceVariables(licenseBannerTemplate, {
        packageName: name,
        version: version,
      }),
    }),
  ],
  build: {
    emptyOutDir: false,
    outDir: 'dist/browser',
    cssCodeSplit: false,
    lib: {
      entry: { 'standalone.esm': 'src/standalone.esm.ts' },
      name: '@scalar/api-reference',
      formats: ['es'],
    },
    rolldownOptions: {
      // Unlike the UMD bundle (which maps externals to global stubs), an ESM bundle
      // loaded via `<script type="module">` / `import` cannot resolve bare specifiers
      // like `radix-vue/namespaced` in the browser — they throw "Failed to resolve
      // module specifier". So the ESM build must be fully self-contained: bundle
      // everything and let tree-shaking drop whatever is genuinely unreachable.
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      output: {
        entryFileNames: '[name].js',
        // Rolldown names a shared chunk after an arbitrary member module. The large
        // eager chunk that holds the rendering core (highlight.js, zod, typebox, yaml,
        // parse5, plus the shared workspace-store/components code) would otherwise be
        // named after `map-hidden-clients-config` — a tiny helper that merely happens
        // to anchor that chunk boundary — which is misleading in bundle stats. Give it
        // a meaningful, stable name instead. This only renames the file; it does not
        // change which modules land in the chunk.
        chunkFileNames: (chunk) =>
          chunk.moduleIds?.some((id) => id.includes('map-hidden-clients-config'))
            ? 'chunks/vendor-[hash].js'
            : 'chunks/[name]-[hash].js',
        // Enable code splitting so genuinely-async boundaries become real lazy
        // chunks: the API client modal (heaviest by far — pulls in CodeMirror),
        // the AgentScalar drawer, the YAML parser used for downloads, and the
        // ~84 per-SVG dynamic imports from `@scalar/icons/library`. Each icon
        // becomes its own ~1 KB chunk that only fetches if the sidebar actually
        // renders that icon — the typical API only references a handful of them
        // out of the catalog, so this nets a smaller real-world page weight than
        // bundling them all into a single ~125 KB chunk.
        codeSplitting: true,
        // Vite forces `minifyWhitespace: false` for ES library builds, so we bypass
        // it by enabling Rolldown's native minifier on the output. This produces a
        // fully-minified bundle equivalent to what UMD already gets from Rolldown.
        minify: true,
      },
    },
  },
})
