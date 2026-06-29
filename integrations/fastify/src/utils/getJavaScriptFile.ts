import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

/**
 * Return the standalone build of `@scalar/api-reference` as a string.
 *
 * This implementation reads the script from disk and is what runs during
 * development (the playground executes the source directly via `tsx`) and in
 * tests, where `@scalar/api-reference` is available as a workspace dependency.
 *
 * For the published package, the Vite build replaces this module with the
 * script inlined as a string (see `vite.config.ts`). That is what makes the
 * plugin bundler-safe: the output is self-contained and no longer reads the
 * file at runtime, so it survives whatever bundler the consuming application
 * uses (for example when bundling a Fastify app into a Docker image).
 */
export function getJavaScriptFile(): string {
  try {
    // The main entry resolves to `<pkg>/dist/index.js`, so the standalone build
    // sits next to it under `browser/`.
    const entry = require.resolve('@scalar/api-reference')
    return fs.readFileSync(path.join(path.dirname(entry), 'browser/standalone.js'), 'utf-8')
  } catch (cause) {
    throw new Error(
      '[@scalar/fastify-api-reference] Could not read the standalone build of `@scalar/api-reference`. Build `@scalar/api-reference` first (e.g. `pnpm build:packages`).',
      { cause },
    )
  }
}
