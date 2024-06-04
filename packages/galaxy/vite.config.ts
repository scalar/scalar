import yaml from '@modyfi/vite-plugin-yaml'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vitest/config'

import pkg from './package.json'

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
    rollupOptions: {
      // external: [...Object.keys(pkg.depedencies)],
    },
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
