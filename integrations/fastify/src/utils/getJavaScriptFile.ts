// The standalone build of `@scalar/api-reference` is inlined into the bundle at
// build time (see `vite.config.ts`). We do this on purpose: the previous
// implementation read the file from disk at runtime via `import.meta.url`, which
// broke whenever a consumer bundled their Fastify app (for example into a Docker
// image), because the asset was no longer next to the compiled plugin.
// Inlining the script makes this package self-contained and bundler-safe.
import standalone from 'virtual:scalar-standalone-js'

/**
 * Return the bundled Scalar standalone JavaScript as a string.
 */
export function getJavaScriptFile() {
  return standalone
}
