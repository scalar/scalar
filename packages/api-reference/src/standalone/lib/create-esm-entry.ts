/**
 * Build the package-root ESM loader with the version of its standalone bundle.
 *
 * An entry cached before a release must keep loading that release's chunks. Hosts using
 * npm package paths can select an immutable release without depending on a CDN hostname
 * or path prefix. Custom self-hosted paths keep loading the bundle next to the entry.
 */
export const createEsmEntry = (version: string): string => `/**
 * Short CDN entry point for the ESM standalone build, generated with its package version.
 *
 * npm-style URLs load the matching release on the same host, so a cached entry does not
 * request old chunk names from a newer release. The public URL can still use latest.
 * Hosts must support versioned npm package paths for this pinning to work.
 * Custom paths keep the bundle next to this file; self-hosted deployments must retain
 * old chunks while cached pages can still request them.
 *
 * Importing the bundle also runs its legacy initialization and registers window.Scalar.
 */
const version = ${JSON.stringify(version)}
const url = new URL(import.meta.url)
const npmPackage = /\\/@scalar\\/api-reference(?:@[^/]+)?\\/esm(?:\\.min)?\\.js$/.test(url.pathname)
const bundle = new URL(
  npmPackage
    ? '../api-reference@' + version + '/dist/browser/standalone.esm.js'
    : './dist/browser/standalone.esm.js',
  url,
).href
const { createApiReference } = await import(bundle)

export { createApiReference }
`
