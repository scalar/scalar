import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { type Plugin, defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

const require = createRequire(import.meta.url)

const VIRTUAL_ID = 'virtual:scalar-standalone-js'
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`

/**
 * Resolve the path to the standalone build of `@scalar/api-reference`.
 *
 * We resolve it through the package itself instead of hard-coding a relative
 * path so the build keeps working from anywhere (monorepo, worktree, CI).
 */
const resolveStandalonePath = () => {
  // The main entry resolves to `<pkg>/dist/index.js`, so the standalone build
  // sits next to it under `browser/`.
  const entry = require.resolve('@scalar/api-reference')
  return path.join(path.dirname(entry), 'browser/standalone.js')
}

/**
 * Inline the `@scalar/api-reference` standalone script as a string.
 *
 * This is what makes the plugin bundler-safe: the script ends up embedded in the
 * output instead of being read from disk at runtime, so it survives whatever
 * bundler the consuming application uses.
 */
const inlineStandalone = (): Plugin => ({
  name: 'scalar:inline-standalone',
  // Run before Vite's resolver so the virtual id is never treated as an
  // external package (which happens under Vitest's SSR transform).
  enforce: 'pre',
  resolveId(id) {
    if (id === VIRTUAL_ID) {
      return RESOLVED_VIRTUAL_ID
    }
    return null
  },
  load(id) {
    if (id === RESOLVED_VIRTUAL_ID) {
      const standalonePath = resolveStandalonePath()
      const contents = fs.readFileSync(standalonePath, 'utf-8')
      // Track the file so a rebuild is triggered when the standalone changes.
      this.addWatchFile(standalonePath)
      return `export default ${JSON.stringify(contents)}`
    }
    return null
  },
})

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: '@scalar/fastify-api-reference',
      formats: ['es'],
      fileName: 'index',
    },
    minify: false,
    rolldownOptions: {
      // Keep dependencies and Node built-ins external; only the standalone
      // script is intentionally inlined.
      external: [...Object.keys(pkg.dependencies), /^node:/],
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [inlineStandalone(), dts({ insertTypesEntry: true, rollupTypes: true })],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
