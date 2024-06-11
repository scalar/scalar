import type { Plugin } from 'rollup'
import { fileURLToPath } from 'url'
import type { BuildOptions, LibraryOptions } from 'vite'

import { type StrictPluginOptions, createRollupConfig } from './rollup-options'

/** Standard path aliases for Vite */
export function alias(url: string) {
  return {
    '@test': fileURLToPath(new URL('./test', url)),
    '@': fileURLToPath(new URL('./src', url)),
  }
}

/**
 * Creates a standard Scalar library vite build config
 *
 * This should be used for packages and libraries NOT bundling
 * projects to be served client-side (like web apps)
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

const VARS_DICT = {
  client: {
    STYLE_ID: 'scalar-style-api-client',
    STYLE_LOADED_VAR: '--scalar-loaded-api-client',
  },
  references: {
    STYLE_ID: 'scalar-style-api-reference',
    STYLE_LOADED_VAR: '--scalar-loaded-api-reference',
  },
}

export const autoCSSInject = (app: keyof typeof VARS_DICT): Plugin =>
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
  ({
    name: 'autoload-css',
    generateBundle(_, bundle) {
      if (!('source' in bundle['style.css'])) return

      const {
        ['style.css']: { source: css },
      } = bundle

      const IIFEcss = `
        (function() {
          try {
            if (typeof document === 'undefined' || document.getElementById('${VARS_DICT[app].STYLE_ID}'))
              return

            setTimeout(() => {
              if (getComputedStyle(document.body).getPropertyValue('${VARS_DICT[app].STYLE_LOADED_VAR}') === 'true') 
                return 

              const elementStyle = document.createElement('style')
              elementStyle.setAttribute('id', '${VARS_DICT[app].STYLE_ID}')
              elementStyle.appendChild(document.createTextNode(${JSON.stringify(css)}))
              document.head.appendChild(elementStyle)

              console.warn('Auto-loading the ${app} css through js has been deprecated. Please import the css directly. Visit https://github.com/scalar/scalar for more info.')
            }, 0)

          } catch (error) {
            console.error(error, 'unable to concat style inside the bundled file')
          }
        })()`

      const component =
        bundle['index.js'] || bundle['index.cjs'] || bundle['index.mjs']
      if ('code' in component) component.code += IIFEcss
    },
  })
