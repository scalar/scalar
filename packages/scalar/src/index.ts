/**
 * @scalar/scalar
 *
 * The Scalar API Reference bundled as a single, code-split ECMAScript module. The point of this
 * package is the CDN URL: it lets you load the reference straight from jsDelivr with a plain module
 * import and no build step:
 *
 * ```html
 * <script type="module">
 *   import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/scalar'
 *
 *   createApiReference('#app', {
 *     url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
 *   })
 * </script>
 * ```
 *
 * Unlike the UMD `standalone.js` build (a single multi-megabyte file), this build is code-split: the
 * heavy, rarely-needed pieces (the API client modal, the YAML parser, the per-icon modules) stay in
 * lazy chunks that only load when they are actually used.
 */
import '@scalar/api-reference/style.css'

import { createApiReference } from '@scalar/api-reference'

// Expose the same `window.Scalar` global the UMD build sets, so consumers that prefer the global over
// a named import keep working when they load this build instead.
if (typeof window === 'object') {
  ;(window as Window & { Scalar?: { createApiReference: typeof createApiReference } }).Scalar = {
    createApiReference,
  }
}

export { createApiReference }
