import vue from '@vitejs/plugin-vue'
import path from 'path'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/api-reference',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        ...Object.keys(pkg.dependencies || {}).filter(
          (item) => !item.startsWith('@scalar'),
        ),
      ],
    },
  },
  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      // It also does not match components since we want the built version
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/components/*/style.css)
        find: /^@scalar\/(?!(openapi-parser|snippetz|components\/style\.css|components\b))(.+)/,
        replacement: path.resolve(__dirname, '../$2/src/index.ts'),
      },
    ],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
