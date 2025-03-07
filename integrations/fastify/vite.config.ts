import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

import pkg from './package.json' assert { type: 'json' }
import { nodeExternals } from './vite-plugins/nodeExternals.ts'

export default defineConfig({
  plugins: [
    nodeExternals(),
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, '../../packages/api-reference/dist/browser/standalone.js'),
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
    rollupOptions: {
      external: Object.keys(pkg.dependencies),
    },
  },
  resolve: {},
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
