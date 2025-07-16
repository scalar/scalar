import { URL, fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { webpackStats } from 'rollup-plugin-webpack-stats'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

import tailwindcss from '@tailwindcss/vite'
import licenseBannerTemplate from './license-banner-template.txt'
import { name, version } from './package.json'

function replaceVariables(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((content, [key, value]) => {
    return content.replace(new RegExp(`\\{\\{ ${key} \\}\\}`, 'g'), value)
  }, template)
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@v2': fileURLToPath(new URL('./src/v2', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
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
    commonjsOptions: {
      include: [/node_modules/],
    },
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      format: {
        max_line_len: 80,
      },
    },
    lib: {
      entry: ['src/standalone.ts'],
      name: '@scalar/api-reference',
      formats: ['umd'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@scalar/api-client',
        '@scalar/api-client/layouts/Modal',
        '@scalar/components',
        '@scalar/use-codemirror',
        '@scalar/use-toasts',
        '@scalar/themes',
      ],
      output: {
        entryFileNames: '[name].js',
        globals: {
          vue: 'Vue',
          '@scalar/api-client': 'ScalarApiClient',
          '@scalar/components': 'ScalarComponents',
          '@scalar/use-codemirror': 'ScalarUseCodemirror',
          '@scalar/use-toasts': 'ScalarUseToasts',
          '@scalar/themes': 'ScalarThemes',
        },
      },
    },
  },
})
