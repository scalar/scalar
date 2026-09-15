import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { webpackStats } from 'rollup-plugin-webpack-stats'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

import { name, version } from './package.json'

// Opens with `/*!` (a legal comment) rather than `/**` so the oxc minifier keeps it
// when `output.comments.legal` is enabled. See the `banner`/`comments` output options.
const licenseBannerTemplate = String.raw`/*!
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
    // Stamp this version onto bundled sub-packages (e.g. @scalar/blocks) whose
    // own PACKAGE_VERSION is already baked into their prebuilt dist. Without this
    // the request-snippet User-Agent would report the block library's version
    // (e.g. Scalar/0.0.0) instead of the API reference version shipped here.
    'OVERRIDE_PACKAGE_VERSION': `"${version}"`,
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
    //
    // `useStrictCSP` makes the injected <style> read its nonce from a
    // `<meta property="csp-nonce">` tag, so the bundle's CSS can be served under a strict
    // Content Security Policy. See the `nonce` option in @scalar/client-side-rendering.
    cssInjectedByJsPlugin({ attributes: { id: 'scalar-style' }, useStrictCSP: true }),
    webpackStats(),
  ],
  build: {
    emptyOutDir: false,
    outDir: 'dist/browser',
    cssCodeSplit: false,
    // Ship linked source maps (external `.map` + a `//# sourceMappingURL=` comment)
    // so consumers can debug config errors against readable source. Browsers only
    // fetch the map when devtools is open and downstream bundlers strip the link, so
    // this does not affect production page weight.
    sourcemap: true,
    lib: {
      entry: ['src/standalone.ts'],
      name: '@scalar/api-reference',
      formats: ['umd'],
    },
    rolldownOptions: {
      // Externalize radix-vue — no radix-vue component (ScalarMenu)
      // is ever rendered in the standalone API reference. They leak in through the
      // @scalar/components barrel via @scalar/api-client but are never mounted.
      external: [/^radix-vue/, /^@scalar\/openapi-parser/],
      // Treat every non-CSS module as side-effect-free so Rolldown can drop
      // unreachable code paths from the bundle (matches the default lib config).
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      output: {
        entryFileNames: '[name].js',
        // Prepend the license banner through Rolldown (not vite-plugin-banner) so the
        // source map stays aligned: Rolldown accounts for the banner in the map,
        // whereas vite-plugin-banner rewrites the file after the map is emitted.
        banner: replaceVariables(licenseBannerTemplate, { packageName: name, version }),
        // Keep the `/*!` license banner through minification. Vite defaults oxc to
        // `legalComments: 'none'`, which would otherwise strip it.
        comments: { legal: true },
        globals: {
          'radix-vue': '{}',
          'radix-vue/namespaced': '{}',
        },
      },
    },
  },
})
