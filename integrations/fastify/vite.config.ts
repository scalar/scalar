import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { type Plugin, defineConfig } from 'vite'

import pkg from './package.json'

const require = createRequire(import.meta.url)

/** The source module whose contents are replaced with the inlined script. */
const INLINE_TARGET = 'src/utils/getJavaScriptFile.ts'

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
 * Inline the `@scalar/api-reference` standalone script into the build output.
 *
 * `getJavaScriptFile` reads the script from disk at runtime, which keeps `tsx`
 * (the dev playground) and the tests working. For the published bundle that
 * runtime read is undesirable — it breaks once a consumer bundles their app —
 * so here we replace the whole module with the script inlined as a string. We
 * only do this for `vite build` (not dev or tests) via `apply: 'build'`.
 */
const inlineStandalone = (): Plugin => ({
  name: 'scalar:inline-standalone',
  apply: 'build',
  load(id) {
    if (!id.replace(/\\/g, '/').endsWith(INLINE_TARGET)) {
      return null
    }

    let standalonePath: string
    try {
      standalonePath = resolveStandalonePath()
      // Confirm the file exists so we can fail with a clear hint instead of a
      // cryptic resolver error. This only happens when the dependency has not
      // been built yet (CI always builds it first via Turbo's `^build`).
      fs.accessSync(standalonePath)
    } catch (cause) {
      throw new Error(
        '[@scalar/fastify-api-reference] Could not read the standalone build of `@scalar/api-reference`. Build `@scalar/api-reference` before bundling this package (e.g. `pnpm build:packages`).',
        { cause },
      )
    }

    // Track the file so a rebuild is triggered when the standalone changes.
    this.addWatchFile(standalonePath)

    // Let Vite inline the file via its `?raw` loader. The file contents never
    // flow through generated code here — we only reference the resolved path —
    // so the inlining is handled (and escaped) by Vite itself.
    const rawSpecifier = `${standalonePath.replace(/\\/g, '/')}?raw`
    return `import standalone from ${JSON.stringify(rawSpecifier)}\nexport function getJavaScriptFile() { return standalone }`
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
  plugins: [inlineStandalone()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
