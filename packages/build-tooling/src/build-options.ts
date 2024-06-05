import typescript from '@rollup/plugin-typescript'
import { readFileSync } from 'fs'
import type { InputPluginOption, Plugin, RollupOptions } from 'rollup'
import type { BuildOptions, LibraryOptions } from 'vite'

type StrictPluginOptions = RollupOptions & { plugins?: InputPluginOption[] }

/**
 * Generate rollup options for a Scalar package build
 * DO NOT USE FOR CLIENT BUNDLING
 *
 * Defaults:
 * - Treeshaking enabled
 * - Preserves modules
 * - Externalizes ALL dependencies
 */
export function createRollupConfig(props: {
  pkgFile?: Record<string, any>
  /** Add the typescript plugin for non-vite builds */
  typescript?: boolean
  options?: StrictPluginOptions
}): RollupOptions {
  /** Load the pkg file if not provided */
  const pkgFile =
    props.pkgFile ?? JSON.parse(readFileSync('./package.json', 'utf-8'))

  const plugins = Array.isArray(props.options?.plugins)
    ? [...props.options.plugins]
    : []

  if (props.typescript) plugins.push(typescript())

  const external: string[] = []

  if ('dependencies' in pkgFile)
    external.push(...Object.keys(pkgFile.dependencies))
  if ('devDependencies' in pkgFile)
    external.push(...Object.keys(pkgFile.devDependencies))
  if ('peerDependencies' in pkgFile)
    external.push(...Object.keys(pkgFile.peerDependencies))
  return {
    treeshake: {
      annotations: true,
      preset: 'recommended',
      moduleSideEffects: false,
    },
    output: {
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: './src',
      dir: './dist',
    },
    // Do not bundle any dependencies by default.
    external: external.map(
      (packageName) => new RegExp(`^${packageName}(/.*)?`),
    ),
    ...props.options,
    plugins,
  }
}

/**
 * Creates a standard Scalar library vite build config
 *
 * Defaults:
 * - Uses './dist' as output
 * - Treeshaking
 * - Builds only ESM output
 * - Preserves modules
 */
export function createViteBuildOptions(props: {
  entry: LibraryOptions['entry']
  pkgFile?: Record<string, any>
  options?: BuildOptions & { rollupOptions?: StrictPluginOptions }
}): BuildOptions {
  return {
    outDir: './dist',
    ...props.options,
    lib: {
      formats: ['es'],
      ...props?.options?.lib,
      entry: props.entry,
    },
    rollupOptions: createRollupConfig({
      pkgFile: props.pkgFile,
      options: props.options?.rollupOptions,
    }),
  }
}

// ---------------------------------------------------------------------------
// CSS injection plugin used while we migrate away from Javascript CSS injections
// TODO: Remove this at end of 2024

const STYLE_ID = 'scalar-style-api-reference'
const STYLE_LOADED_VAR = '--scalar-loaded-api-reference'

export const autoCSSInject: Plugin =
  /**
   * Automatic css injection via js
   * We need the setTimeout so we can do a quick check to see if the css file has already been loaded
   *
   * @see https://stackoverflow.com/a/68954980/1624255
   *
   * TODO make this into a rollup/vite plugin
   *
   * copied from client/vite.config
   */
  {
    name: 'autoload-css',
    generateBundle(_, bundle) {
      if (!('source' in bundle['style.css'])) return

      const {
        ['style.css']: { source: css },
      } = bundle

      const IIFEcss = `
        (function() {
          try {
            if (typeof document === 'undefined' || document.getElementById('${STYLE_ID}'))
              return

            setTimeout(() => {
              if (getComputedStyle(document.body).getPropertyValue('${STYLE_LOADED_VAR}') === 'true') return 

              const elementStyle = document.createElement('style')
              elementStyle.setAttribute('id', '${STYLE_ID}')
              elementStyle.appendChild(document.createTextNode(${JSON.stringify(css)}))
              document.head.appendChild(elementStyle)

              console.warn('Auto-loading the css through js has been deprecated. Please import the css directly. Visit https://github.com/scalar/scalar for more info.')
            }, 0)

          } catch (error) {
            console.error(error, 'unable to concat style inside the bundled file')
          }
        })()`

      const component =
        bundle['index.js'] || bundle['index.cjs'] || bundle['index.mjs']
      if ('code' in component) component.code += IIFEcss
    },
  }
