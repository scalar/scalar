import type { ApiReferenceConfigurationWithMultipleSources } from './types'

/**
 * The configuration for the static HTML rendering using the CDN.
 *
 * It's the ApiReferenceConfiguration, but extended with the `pageTitle`, `cdn` and `bundle` options.
 */
export type HtmlRenderingConfiguration = Partial<ApiReferenceConfigurationWithMultipleSources> & {
  pageTitle: string
  /**
   * The URL to the Scalar API Reference UMD bundle (the classic build that registers `window.Scalar`
   * and is loaded via `<script src>`). Setting it selects the UMD build instead of the default ESM
   * build — use it to pin a specific version of the classic bundle.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   */
  cdn: string
  /**
   * Which build to load. The modern, code-split ESM build is the default, because it lets less
   * JavaScript block the first render.
   *
   * Pass a URL string to load a specific ESM build, or `false` to fall back to the classic UMD bundle.
   * When set, `bundle` takes precedence over both `cdn` and the `nonce` fallback.
   *
   * When a `nonce` is set (a strict, nonce-based CSP) the UMD bundle is used by default, because the
   * ESM build's `import`-loaded chunks cannot be nonced. Pass `bundle: true` to force the ESM build if
   * your CSP uses `'strict-dynamic'`.
   */
  bundle?: string | boolean
  /**
   * A Content Security Policy (CSP) nonce to apply to the generated inline `<script>` and `<style>`
   * tags (and the CDN `<script>` tag).
   *
   * When set, a `<meta property="csp-nonce">` tag is also emitted so the standalone bundle can apply
   * the same nonce to the stylesheet it injects at runtime. This lets the API Reference run under a
   * strict `script-src` with no `unsafe-inline` and no `unsafe-eval`.
   *
   * The value must match the `nonce-...` source in your `script-src` directive, and a fresh nonce
   * should be generated for every request.
   *
   * Note: `style-src` still needs `'unsafe-inline'`. The reference renders inline `style="..."`
   * attributes, which a CSP nonce can never authorize (nonces only apply to `<script>`, `<style>`
   * and `<link>` elements).
   */
  nonce: string
}
