import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { OutputAsset, OutputBundle } from 'rollup'
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

const CSS_BUNDLE_ENTRY_FILES = ['base.css', 'style.css'] as const
const cssBundleEntryFiles = new Set<string>(CSS_BUNDLE_ENTRY_FILES)

const sourceToString = (source: string | Uint8Array): string =>
  typeof source === 'string' ? source : new TextDecoder().decode(source)

const isCssAsset = (asset: OutputBundle[string]): asset is OutputAsset =>
  asset.type === 'asset' && asset.fileName.endsWith('.css')

const isCssBundleEntry = (fileName: string): boolean => cssBundleEntryFiles.has(fileName)

const getCssAssets = (bundle: OutputBundle): OutputAsset[] =>
  Object.values(bundle)
    .filter(isCssAsset)
    .sort((first, second) => first.fileName.localeCompare(second.fileName))

const getComponentCss = (cssAssets: readonly OutputAsset[]): string =>
  cssAssets
    .filter((asset) => !isCssBundleEntry(asset.fileName))
    .map((asset) => sourceToString(asset.source))
    .join('\n')

const appendCss = (asset: OutputAsset | undefined, css: string): void => {
  if (!asset || !css) {
    return
  }

  asset.source = [sourceToString(asset.source), css].join('\n')
}

const removeComponentCssAssets = (bundle: OutputBundle, cssAssets: readonly OutputAsset[]): void => {
  for (const asset of cssAssets) {
    if (!isCssBundleEntry(asset.fileName)) {
      delete bundle[asset.fileName]
    }
  }
}

// Preserve-modules emits component CSS next to each component. The package only
// exposes base.css and style.css, so fold component CSS into both public files.
const createCssBundlePlugin = (): PluginOption => ({
  name: 'scalar-components-css-bundles',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const cssAssets = getCssAssets(bundle)
    const baseAsset = cssAssets.find((asset) => asset.fileName === 'base.css')
    const styleAsset = cssAssets.find((asset) => asset.fileName === 'style.css')
    const componentCss = getComponentCss(cssAssets)

    appendCss(baseAsset, componentCss)
    appendCss(styleAsset, componentCss)

    removeComponentCssAssets(bundle, cssAssets)
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
