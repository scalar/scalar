import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { addPackageFileExports } from '@scalar/build-tooling'
import { rm } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import type { Plugin, RollupOptions } from 'rollup'
import outputSize from 'rollup-plugin-output-size'

const entries = [
  './src/index.ts',
  './src/plugins/fetch-urls/index.ts',
  './src/plugins/read-files/index.ts',
]

await addPackageFileExports({ entries })

const dir = 'dist'

/**
 * Remove the output directory.
 */
function cleanBeforeWrite(directory: string): Plugin {
  let removePromise: Promise<void>

  return {
    generateBundle(_options, _bundle, isWrite) {
      if (isWrite) {
        // Only remove before first write, but make all writes wait on the removal
        removePromise ??= rm(directory, {
          force: true,
          recursive: true,
        })

        return removePromise
      }
    },
    name: 'clean-before-write',
  }
}

/**
 * Rollup configuration
 */
const config: RollupOptions[] = [
  // Code
  {
    input: entries,
    output: [
      // ESM
      {
        format: 'esm',
        preserveModules: true,
        preserveModulesRoot: 'src',
        dir,
      },
    ],
    plugins: [
      cleanBeforeWrite(dir),
      typescript(),
      json(),
      terser(),
      outputSize(),
    ],
    external: [
      ...builtinModules,
      ...builtinModules.map((m) => `node:${m}`),
      'ajv/dist/2020',
      'ajv-draft-04',
      'ajv-formats',
      'yaml',
      '@scalar/openapi-types',
    ],
    treeshake: {
      annotations: true,
      preset: 'recommended',
    },
  },
]

export default config
