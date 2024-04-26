import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/specifications/3.1.yaml',
          dest: './',
        },
        {
          src: 'src/specifications/3.1.yaml',
          dest: './',
          rename: 'latest.yaml',
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: ['src/index.ts'],
      name: '@scalar/galaxy',
      formats: ['es'],
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
