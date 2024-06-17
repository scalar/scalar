import vue from '@vitejs/plugin-vue'
import path from 'path'
import { webpackStats } from 'rollup-plugin-webpack-stats'
import { fileURLToPath } from 'url'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

import licenseBannerTemplate from './license-banner-template.txt'
import { name, version } from './package.json'

function replaceVariables(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((content, [key, value]) => {
    return content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
  }, template)
}

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    vue(),
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
    // minify: false,
    lib: {
      entry: ['src/standalone.ts'],
      name: '@scalar/api-reference',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    dedupe: ['vue'],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
