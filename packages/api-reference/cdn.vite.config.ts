import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  optimizeDeps: {
    include: ['@scalar/swagger-parser'],
  },
  plugins: [
    vue(),
    topLevelAwait(),
    cssInjectedByJsPlugin(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      exclude: [
        'fs', // Excludes the polyfill for `fs` and `node:fs`.
      ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  build: {
    commonjsOptions: {
      include: [/@scalar\/swagger-editor/, /node_modules/],
    },
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/cdn.ts'],
      name: '@scalar/api-reference',
      fileName: 'scalar-api-reference',
      formats: ['es'],
    },
  },
})
