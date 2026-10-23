/**
 * The API Reference standalone build, unchanged except for what `MODE` swaps:
 *
 * - `main`: as shipped
 * - `prototype`: `@scalar/code-highlight` replaced with the prototype
 * - `prototype-no-copy`: also stubs the "Copy as Markdown" packages, which
 *   still use unified, to show what remains once they move too
 *
 * `FORMAT=es` builds with code splitting, to approximate what an ESM app loads up front.
 */
import { fileURLToPath } from 'node:url'

import type { Plugin } from 'vite'
import { mergeConfig } from 'vite'

import base from '../../../../packages/api-reference/vite.standalone.config'

const MODE = process.env.MODE ?? 'main'
const FORMAT = (process.env.FORMAT ?? 'umd') as 'umd' | 'es'
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

const swap: Plugin = {
  name: 'markdown-swap',
  enforce: 'pre',
  resolveId(id) {
    if (MODE === 'main') return null
    if (id === '@scalar/code-highlight' || id === '@scalar/code-highlight/markdown')
      return here('./code-highlight-shim.ts')
    if (MODE === 'prototype-no-copy' && /^@scalar\/(openapi|asyncapi)-to-markdown\/browser$/.test(id))
      return here('./empty.ts')
    return null
  },
}

const config = mergeConfig(base, {
  root: here('../../../../packages/api-reference'),
  plugins: [swap],
  build: {
    outDir: here(`../../.out/standalone-${MODE}-${FORMAT}`),
    emptyOutDir: true,
    sourcemap: false,
  },
})
// `mergeConfig` concatenates arrays, so the format is set afterwards.
config.build.lib.formats = [FORMAT]

export default config
