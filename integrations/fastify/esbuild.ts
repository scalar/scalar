import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { build } from '@scalar/build-tooling/esbuild'
import type { Plugin } from 'esbuild'

/**
 * Plugin to handle ?raw imports and inline files as text strings.
 */
const rawImportLoader: Plugin = {
  name: 'raw-import-loader',
  setup(build) {
    /**
     * Resolve ?raw imports by stripping the suffix and marking them for text loading.
     */
    build.onResolve({ filter: /\?raw$/ }, (args) => {
      const pathWithoutRaw = args.path.replace(/\?raw$/, '')
      const resolvedPath = resolve(dirname(args.importer), pathWithoutRaw)

      return { path: resolvedPath, namespace: 'raw-text' }
    })

    /**
     * Load files in the raw-text namespace as text strings.
     */
    build.onLoad({ filter: /.*/, namespace: 'raw-text' }, async (args) => {
      const contents = await readFile(args.path, 'utf8')

      return { contents: `export default ${JSON.stringify(contents)}`, loader: 'js' as const }
    })
  },
}

const entries = ['src/index.ts']

build({
  entries,
  platform: 'node',
  // Required to bundle ?raw imports (theme.css and scalar.js)
  bundle: true,
  options: {
    plugins: [rawImportLoader],
    /**
     * Mark all dependencies as external to avoid bundling them.
     * We only want to bundle our own source code and inline the assets.
     */
    external: [
      '@scalar/core',
      '@scalar/openapi-parser',
      '@scalar/openapi-types',
      'fastify-plugin',
      'github-slugger',
      'fastify',
    ],
  },
})
