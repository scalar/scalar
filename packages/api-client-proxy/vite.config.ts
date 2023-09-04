import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/api-client-proxy',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['express', 'cors', 'dotenv'],
    },
  },
  resolve: {
    alias: [
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
