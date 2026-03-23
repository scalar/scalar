import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { type Plugin, defineConfig } from 'vitest/config'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
} from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()
const entry = createLibEntry(['./src/index.ts', './src/library/index.ts', './src/types.ts'], import.meta.dirname)

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
  },
  plugins: [
    vue(),
    // Ensure the viewBox is preserved
    svgLoader({
      svgoConfig: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // @see https://github.com/svg/svgo/issues/1128
                removeViewBox: false,
              },
            },
          },
        ],
      },
    }) as Plugin,
  ],
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    lib: {
      formats: ['es'],
      cssFileName: 'style',
      entry,
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      external,
      output: createPreserveModulesOutput(),
    },
  },
  test: {
    environment: 'jsdom',
    root: resolve(import.meta.dirname, '.'),
  },
})
