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
    cssInjectedByJsPlugin(),
    webpackStats(),
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
      // Match the UMD config: ScalarMenu (the only radix-vue consumer) is never
      // mounted in the standalone reference, so radix-vue can be safely externalized.
      external: [/^radix-vue/, /^@scalar\/openapi-parser/],
      output: {
        entryFileNames: '[name].js',
        // Collapse all chunks into a single file so the ESM bundle matches the UMD
        // layout (one JS file) and the size comparison is apples-to-apples.
        codeSplitting: false,
        // Vite forces `minifyWhitespace: false` for ES library builds, so we bypass
        // it by enabling Rolldown's native minifier on the output. This produces a
        // fully-minified bundle equivalent to what UMD already gets from Rolldown.
        minify: true,
        globals: {
          'radix-vue': '{}',
          'radix-vue/namespaced': '{}',
        },
      },
    },
  },
})
