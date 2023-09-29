import path from 'path'
import { defineConfig } from 'vitest/config'

import { nodeExternals } from './src/vite-plugins'
import { nodeShims } from './src/vite-plugins'

export default defineConfig({
  plugins: [nodeShims(), nodeExternals()],
  build: {
    // If minify is enabled, the nodeShims extension doesn’t work.
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/fastify-api-reference',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['fastify'],
    },
  },
  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/*/style.css)
        find: /^@scalar\/([^/]+)$/,
        replacement: path.resolve(__dirname, '../$1/src/index.ts'),
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
