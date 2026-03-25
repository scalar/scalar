import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { type Plugin, defineConfig } from 'vitest/config'

import { createExternalsFromPackageJson, createPreserveModulesOutput } from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()

const componentsDir = resolve(import.meta.dirname, './src/components')
const componentEntries = Object.fromEntries(
  readdirSync(componentsDir)
    .filter((f) => f.endsWith('.vue'))
    .map((f) => [`components/${f.replace('.vue', '')}`, resolve(componentsDir, f)]),
)

const entry: Record<string, string> = {
  index: resolve(import.meta.dirname, './src/index.ts'),
  types: resolve(import.meta.dirname, './src/types.ts'),
  'library/index': resolve(import.meta.dirname, './src/library/index.ts'),
  ...componentEntries,
}

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
