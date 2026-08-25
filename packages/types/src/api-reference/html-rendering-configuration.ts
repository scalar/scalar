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
   * and is loaded via `<script src>`). Use this to pin a specific version.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   */
  cdn: string
  /**
   * Load the modern, code-split ESM build instead of the classic UMD bundle.
   *
   * Pass `true` to load the default ESM entry (`.../@scalar/api-reference/esm.js`) as a
   * `<script type="module">`, or a URL string to point at a specific ESM build. Because the ESM build
   * is code-split, less JavaScript blocks the first render. When set, `bundle` takes precedence over
   * `cdn`.
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
