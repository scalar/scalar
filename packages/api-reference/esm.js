/**
 * Short CDN entry point for the ESM standalone build.
 *
 * This thin pointer lives at the package root so the API Reference can be loaded
 * from a friendly URL:
 *
 *   import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'
 *
 * The real bundle (and its lazy chunks) stays under `dist/browser`. Because the
 * browser resolves the re-export below against this file's own CDN URL, the
 * bundle and its `./chunks/*` imports load as normal explicit paths — so there is
 * no bare-package-URL chunk-resolution issue to work around here.
 *
 * The re-export also evaluates the bundle, so its side effects (registering
 * `window.Scalar` and reading legacy `data-*` attributes) still run, matching the
 * existing `dist/browser/standalone.esm.js` behavior.
 */
export { createApiReference } from './dist/browser/standalone.esm.js'
