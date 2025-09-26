import { readFileSync } from 'node:fs'

import type { Plugin } from 'rollup'
import type { BuildEnvironmentOptions, LibraryOptions } from 'vite'

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
export function createViteBuildOptions<
  T extends {
    lib?: Record<string, any> | undefined | false
    rollupOptions?: Record<string, any> | undefined
  } = BuildEnvironmentOptions,
>(props: {
  entry: LibraryOptions['entry']
  pkgFile?: Record<string, any>
  options?: Partial<T>
}): {
  outDir: string
  lib: {
    formats: ['es']
    cssFileName: 'style'
  } & T['lib']
  rollupOptions: T['rollupOptions'] & {
    external: string | RegExp[]
    output: {
      format: 'esm'
      preserveModules: true
      preserveModulesRoot: './src'
      dir: './dist'
    }
    treeshake: {
      annotations: true
      preset: 'recommended'
      moduleSideEffects: (id: string) => boolean
    }
  }
} {
  /** Load the pkg file if not provided */
  const pkgFile = props.pkgFile ?? JSON.parse(readFileSync('./package.json', 'utf-8'))

  const external = Array.isArray(props.options?.rollupOptions?.external) ? props.options.rollupOptions.external : []

  if ('dependencies' in pkgFile) {
    external.push(...Object.keys(pkgFile.dependencies))
  }
  if ('devDependencies' in pkgFile) {
    external.push(...Object.keys(pkgFile.devDependencies))
  }
  if ('peerDependencies' in pkgFile) {
    external.push(...Object.keys(pkgFile.peerDependencies))
  }

  return {
    outDir: './dist',
    ...props.options,
    lib: {
      formats: ['es'],
      /**
       * Default the css filename to align with Vite5 behavior
       * This can still be overridden by the consumer of this function
       */
      cssFileName: 'style',
      ...props?.options?.lib,
      entry: props.entry,
    },
    rollupOptions: {
      ...props.options?.rollupOptions,
      treeshake: {
        annotations: true,
        preset: 'recommended',
        /**
         * We should never be importing modules for the side effects BUT
         * CSS import are by definition side effects. These must be excluded
         */
        moduleSideEffects: (id: string) => {
          return id.includes('.css')
        },
      },
      output: {
        format: 'esm',
        preserveModules: true,
        preserveModulesRoot: './src',
        dir: './dist',
      },
      /** Do not bundle any dependencies by default. */
      external: external.map((packageName) => new RegExp(`^${packageName}(/.*)?`)),
    },
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

/**
 *
 * @deprecated We have moved away from javascript CSS injection. This will be deleted in the near future
 */
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
      if (!(bundle['style.css'] && 'source' in bundle['style.css'])) {
        return
      }

      const {
        'style.css': { source: css },
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

      const component = bundle['index.js'] || bundle['index.cjs'] || bundle['index.mjs']
      if (component && 'code' in component) {
        component.code += IIFEcss
      }
    },
  })
