import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/echo-server',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['cookie-parser', 'cors', 'express'],
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
        replacement: path.resolve(__dirname, '../../packages/$1/src/index.ts'),
      },
    ],
  },
})
