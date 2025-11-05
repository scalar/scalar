import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
      },
      /** Do not bundle any dependencies by default. */
      external: external.map((packageName: string) => new RegExp(`^${packageName}(/.*)?`)),
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
