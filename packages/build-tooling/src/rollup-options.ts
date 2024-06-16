import alias from '@rollup/plugin-alias'
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
import yaml from '@rollup/plugin-yaml'
import { readFileSync } from 'fs'
import type { InputPluginOption, RollupOptions } from 'rollup'
import copy, { type Target } from 'rollup-plugin-copy'
import css from 'rollup-plugin-import-css'

export type StrictPluginOptions = RollupOptions & {
  plugins?: InputPluginOption[]
}

/**
 * Generate rollup options for a Scalar package build
 *
 * This should be used for packages and libraries NOT bundling
 * projects to be served client-side (like web apps)
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
  copy?: Target[]
  options?: StrictPluginOptions
}): RollupOptions {
  /** Load the pkg file if not provided */
  const pkgFile =
    props.pkgFile ?? JSON.parse(readFileSync('./package.json', 'utf-8'))

  const plugins = Array.isArray(props.options?.plugins)
    ? [...props.options.plugins]
    : []

  // Optional list of files to copy over
  if (props?.copy) plugins.push(copy({ targets: props.copy }))
  // For vanilla rollup (not Vite) we need to enable transpilation
  if (props.typescript) plugins.push(typescript())
  plugins.push(json())
  plugins.push(yaml())
  plugins.push(css())
  plugins.push(
    alias({
      entries: {
        '@': './src',
        '@test': './test',
      },
    }),
  )

  const external = Array.isArray(props.options?.external)
    ? props.options.external
    : []

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
      /**
       * We should never be importing modules for the side effects BUT
       * CSS import are by definition side effects. These must be excluded
       */
      moduleSideEffects: (id) => {
        return id.includes('.css')
      },
    },
    output: {
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: './src',
      dir: './dist',
    },
    ...props.options,
    // Do not bundle any dependencies by default.
    external: external.map(
      (packageName) => new RegExp(`^${packageName}(/.*)?`),
    ),
    plugins,
  }
}
