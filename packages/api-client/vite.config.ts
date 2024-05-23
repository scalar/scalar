import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

export default defineConfig({
  plugins: [vue()],
  build: {
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/api-client',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', ...Object.keys(pkg.dependencies || {})],
    },
  },
  resolve: {
    //   alias: [
    //     // Resolve the uncompiled source code for all @scalar packages
    //     // It’s working with the alias, too. It’s just required to enable HMR.
    //     // It also does not match components since we want the built version
    //     {
    //       // Resolve the uncompiled source code for all @scalar packages
    //       // @scalar/* -> packages/*/
    //       // (not @scalar/*/style.css)
    //       find: /^@scalar\/(?!(openapi-parser|snippetz|galaxy|components\/style\.css|components\b))(.+)/,
    //       replacement: path.resolve(__dirname, '../$2/src/index.ts'),
    //     },
    //   ],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
