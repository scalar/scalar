import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { PluginOption } from 'vite'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitest/config'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
  findEntryPoints,
} from '../../tooling/scripts/vite-lib-config'

const external = createExternalsFromPackageJson()
const entryPaths = await findEntryPoints()
const entry = {
  ...createLibEntry(entryPaths, import.meta.dirname),
  base: resolve(import.meta.dirname, './src/base.css'),
  style: resolve(import.meta.dirname, './src/style.css'),
}

const sourceToString = (source: string | Uint8Array): string =>
  typeof source === 'string' ? source : new TextDecoder().decode(source)

const createCssBundlePlugin = (): PluginOption => ({
  name: 'scalar-components-css-bundles',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const cssAssets = Object.entries(bundle)
      .filter((entry): entry is [string, Extract<(typeof bundle)[string], { type: 'asset' }>] => {
        const [, asset] = entry

        return asset.type === 'asset' && asset.fileName.endsWith('.css')
      })
      .sort(([first], [second]) => first.localeCompare(second))

    const baseAsset = cssAssets.find(([fileName]) => fileName === 'base.css')?.[1]
    const styleAsset = cssAssets.find(([fileName]) => fileName === 'style.css')?.[1]
    const componentCss = cssAssets
      .filter(([fileName]) => fileName !== 'base.css' && fileName !== 'style.css')
      .map(([, asset]) => sourceToString(asset.source))
      .join('\n')

    if (baseAsset) {
      baseAsset.source = [sourceToString(baseAsset.source), componentCss].filter(Boolean).join('\n')
    }

    if (styleAsset) {
      styleAsset.source = [sourceToString(styleAsset.source), componentCss].filter(Boolean).join('\n')
    }

    for (const [fileName] of cssAssets) {
      if (fileName !== 'base.css' && fileName !== 'style.css') {
        delete bundle[fileName]
      }
    }
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@test': resolve(import.meta.dirname, './test'),
    },
  },
  plugins: [
    vue(),
    tailwindcss(),
    createCssBundlePlugin(),
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
    }) as PluginOption,
  ],
  build: {
    outDir: './dist',
    minify: false,
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      formats: ['es'],
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
})
