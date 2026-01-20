import { readFile } from 'node:fs/promises'

import { build } from '@scalar/build-tooling/esbuild'
import type { Plugin } from 'esbuild'

/**
 * Plugin to load files in src/assets as text strings.
 *
 * This is more selective than using global loaders, ensuring only
 * theme.css and scalar.js are inlined as text.
 */
const assetTextLoader: Plugin = {
  name: 'asset-text-loader',
  setup(build) {
    build.onLoad({ filter: /src\/assets\/.+\.(css|js)$/ }, async (args) => {
      const contents = await readFile(args.path, 'utf8')

      return { contents: `export default ${JSON.stringify(contents)}`, loader: 'js' as const }
    })
  },
}

const entries = ['src/index.ts']

build({
  entries,
  platform: 'node',
  // required to bundle those files:
  // - theme.css
  // - scalar.js
  bundle: true,
  options: {
    plugins: [assetTextLoader],
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
