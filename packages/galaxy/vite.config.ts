import yaml from '@rollup/plugin-yaml'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    yaml(),
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
})
