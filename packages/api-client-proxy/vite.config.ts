import path from 'path'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VERSION__: process.env.npm_package_version,
  },
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
