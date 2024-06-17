import vue from '@vitejs/plugin-vue'
import { webpackStats } from 'rollup-plugin-webpack-stats'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [vue(), cssInjectedByJsPlugin(), webpackStats()],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    commonjsOptions: {
      include: [/@scalar\/api-reference/, /node_modules/],
    },
    cssCodeSplit: false,
    minify: 'terser',
    // With the default terserOptions, highlight.js breaks the build.
    // * They’re using terser, too.
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
      entry: ['src/index.ts'],
      name: '@scalar/play-button',
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
