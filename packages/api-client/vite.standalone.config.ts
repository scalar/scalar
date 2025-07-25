import { ViteWatchWorkspace, alias } from '@scalar/build-tooling'
import { version } from './package.json'

import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { webpackStats } from 'rollup-plugin-webpack-stats'
//import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
    'process.env.NODE_ENV': '"production"',
    'process.env.SCALAR_API_REFERENCE_VERSION': `"${version}"`,
  },
  resolve: {
    alias: alias(import.meta.url),
    dedupe: ['vue'],
  },
  plugins: [vue(), tailwindcss(), svgLoader(), ViteWatchWorkspace(), cssInjectedByJsPlugin(), webpackStats()],
  optimizeDeps: {
    exclude: ['@scalar/*'],
  },
  server: {
    port: 5065,
    /**
     * We proxy requests to void.scalar.com to test same-domain cookies.
     */
    proxy: {
      '/void': 'https://void.scalar.com',
    },
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist/browser',
    commonjsOptions: {
      include: [/node_modules/],
    },
    cssCodeSplit: false,
    minify: 'terser',
    // With the default terserOptions, highlight.js breaks the build.
    // * They're using terser, too.
    // * Copying their options fixes the build.
    // * `max_line_len: 80` is the one setting that makes the difference.
    //
    // Source: https://github.com/highlightjs/highlight.js/blob/b9ae5fea90514b864f2c9b2889d7d3302d6156dc/tools/build_config.js#L58-L73
    terserOptions: {
      format: {
        max_line_len: 80,
      },
    },
    lib: {
      entry: ['src/standalone.ts'],
      name: '@scalar/api-client',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/vitest.setup.ts',
  },
})
