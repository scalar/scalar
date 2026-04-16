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

const standaloneExternal = [/^radix-vue/, /^@scalar\/openapi-parser/]
const standaloneGlobals = {
  'radix-vue': '{}',
  'radix-vue/namespaced': '{}',
}

const bannerPlugin = banner({
  outDir: 'dist/browser',
  content: replaceVariables(licenseBannerTemplate, {
    packageName: name,
    version: version,
  }),
})

export default defineConfig(({ mode }) => {
  const isUmdBuild = mode === 'standalone-umd'

  return {
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
      __VUE_OPTIONS_API__: 'false',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
        '@test': resolve(import.meta.dirname, './test'),
      },
      dedupe: ['vue'],
    },
    plugins: isUmdBuild
      ? [vue(), tailwindcss(), cssInjectedByJsPlugin(), webpackStats(), bannerPlugin]
      : [vue(), tailwindcss(), bannerPlugin],
    build: {
      emptyOutDir: isUmdBuild,
      outDir: 'dist/browser',
      minify: true,
      target: 'esnext',
      cssCodeSplit: false,
      lib: {
        entry: resolve(import.meta.dirname, isUmdBuild ? './src/standalone.ts' : './src/standalone-esm.ts'),
        formats: isUmdBuild ? ['umd'] : ['es'],
        ...(isUmdBuild ? { name: '@scalar/api-reference' } : {}),
      },
      rolldownOptions: {
        // Externalize radix-vue — no radix-vue component (ScalarMenu)
        // is ever rendered in the standalone API reference. They leak in through the
        // @scalar/components barrel via @scalar/api-client but are never mounted.
        external: standaloneExternal,
        treeshake: {
          moduleSideEffects: (id) => id.includes('.css'),
        },
        output: isUmdBuild
          ? {
              entryFileNames: 'standalone.js',
              globals: standaloneGlobals,
            }
          : {
              entryFileNames: 'standalone.mjs',
            },
      },
    },
  }
})
