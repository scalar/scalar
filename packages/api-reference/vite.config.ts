import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      exclude: [
        'fs', // Excludes the polyfill for `fs` and `node:fs`.
      ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: false,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: ['src/index.ts', 'src/assets/css/variables.css'],
      name: '@scalar/api-reference',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'xmldom',
        'rehype-document',
        'rehype-format',
        'rehype-sanitize',
        'rehype-stringify',
        'remark-gfm',
        'remark-parse',
        'remark-rehype',
        'remark-textr',
        'typographic-base',
        'unified',
        '@scalar/swagger-editor',
      ],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'style.css'
          }

          return assetInfo.name ?? 'default'
        },
      },
    },
  },
})
