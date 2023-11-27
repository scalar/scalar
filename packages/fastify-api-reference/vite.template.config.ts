import terser from '@rollup/plugin-terser'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  optimizeDeps: {
    include: ['@scalar/swagger-parser'],
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: './src/templates/index.ejs',
          dest: './',
        },
      ],
    }),
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
    outDir: './dist/templates',
    lib: {
      entry: 'src/templates/render.ts',
      formats: ['es'],
    },
    rollupOptions: {
      plugins: [terser()],
      output: {
        manualChunks: () => 'index',
      },
    },
  },
})
