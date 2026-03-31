import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

import { createExternalsFromPackageJson } from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson(resolve(import.meta.dirname, 'package.json'))

export default defineConfig({
  build: {
    outDir: './dist',
    cssCodeSplit: true,
    cssMinify: false,
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        tailwind: resolve(import.meta.dirname, 'src/tailwind.css'),
        style: resolve(import.meta.dirname, 'src/style.css'),
        'fonts/fonts': resolve(import.meta.dirname, 'src/fonts/fonts.css'),
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      external,
    },
  },
  test: {},
})
