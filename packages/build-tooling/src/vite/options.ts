import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { BuildEnvironmentOptions, LibraryOptions, Plugin } from 'vite'

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
  options?: Partial<Omit<T, 'lib' | 'rollupOptions'>> & {
    lib?: Partial<T['lib']>
    rollupOptions?: T['rollupOptions']
  }
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
      sanitizeFileName: true
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
    external.push(...Object.keys(pkgFile.peerDependencies as Record<string, string>))
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
        sanitizeFileName: true,
      },
      /** Do not bundle any dependencies by default. */
      external: external.map((packageName: string) => new RegExp(`^${packageName}(/.*)?`)),
    },
  }
}

/**
 * Vite plugin that sanitizes virtual module IDs containing characters invalid in filenames.
 *
 * Rolldown with preserveModules derives output filenames from module IDs. Virtual modules
 * like @vitejs/plugin-vue's `\0plugin-vue:export-helper` contain NUL bytes and colons which
 * cause filesystem errors. This plugin intercepts them and re-maps to safe IDs.
 *
 * Must be placed before @vitejs/plugin-vue in the plugins array.
 */
export function sanitizeVirtualModules(): Plugin {
  const EXPORT_HELPER_ID = '\0plugin-vue:export-helper'
  const SAFE_EXPORT_HELPER_ID = '\0plugin-vue-export-helper'

  return {
    name: 'scalar:sanitize-virtual-modules',
    enforce: 'pre',
    resolveId(id) {
      if (id === EXPORT_HELPER_ID) {
        return SAFE_EXPORT_HELPER_ID
      }
      return undefined
    },
    load(id) {
      if (id === SAFE_EXPORT_HELPER_ID) {
        return `export default (sfc, props) => {
  const target = sfc.__vccOpts || sfc
  for (const [key, val] of props) {
    target[key] = val
  }
  return target
}`
      }
      return undefined
    },
  }
}

/** Standard path aliases for Vite */
export function alias(url: string) {
  return {
    '@test': fileURLToPath(new URL('./test', url)),
    '@': fileURLToPath(new URL('./src', url)),
  }
}
