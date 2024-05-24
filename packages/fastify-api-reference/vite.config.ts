import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

import { nodeExternals } from './vite-plugins'

export default defineConfig({
  plugins: [
    nodeExternals(),
    viteStaticCopy({
      targets: [
        {
          src: '../api-reference/dist/browser/standalone.js',
          dest: './js',
        },
      ],
    }),
  ],
  build: {
    // If minify is enabled, the nodeShims extension doesn’t work.
    minify: 'terser',
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/fastify-api-reference',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    // We don’t have any production dependencies.
    // rollupOptions: {
    //   external: pkg.dependencies || {},
    // },
  },
  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/*/style.css)
        find: /^@scalar\/(?!(openapi-parser|snippetz|galaxy|components\/style\.css|components\b))(.+)/,
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
