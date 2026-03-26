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
    'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@test': resolve(import.meta.dirname, './test'),
      // Replace the full zod/v3 compat layer (~106 KB) with a minimal stub.
      // @ai-sdk/provider-utils only imports ZodFirstPartyTypeKind from zod/v3 to
      // detect whether a schema is a Zod v3 schema. We only pass Zod 4 schemas to
      // the AI SDK, so the v3 converter code path is never reached at runtime.
      'zod/v3': resolve(import.meta.dirname, './src/stubs/zod-v3-stub.ts'),
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
      entry: ['src/standalone.ts'],
      name: '@scalar/api-reference',
      formats: ['umd'],
    },
    rolldownOptions: {
      // Externalize radix-vue — no radix-vue component (ScalarMenu)
      // is ever rendered in the standalone API reference. They leak in through the
      // @scalar/components barrel via @scalar/api-client but are never mounted.
      external: [/^radix-vue/, /^@scalar\/openapi-parser/],
      output: {
        entryFileNames: '[name].js',
        globals: {
          'radix-vue': '{}',
          'radix-vue/namespaced': '{}',
        },
      },
    },
  },
})
