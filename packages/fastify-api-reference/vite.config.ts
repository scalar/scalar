import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/fastify-api-reference',
      fileName: 'index',
      formats: ['es', 'umd'],
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
})
