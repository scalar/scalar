import type { ApiReferenceConfigurationWithMultipleSources } from './types'

/**
 * The configuration for the static HTML rendering using the CDN.
 *
 * It's the ApiReferenceConfiguration, but extended with the `pageTitle` and `cdn` options.
 */
export type HtmlRenderingConfiguration = Partial<ApiReferenceConfigurationWithMultipleSources> & {
  pageTitle: string
  cdn: string
  /**
   * A Content Security Policy (CSP) nonce to apply to the generated inline `<script>` and `<style>`
   * tags (and the CDN `<script>` tag).
   *
   * When set, a `<meta property="csp-nonce">` tag is also emitted so the standalone bundle can apply
   * the same nonce to the stylesheet it injects at runtime. This allows the API Reference to render
   * under a strict CSP without `unsafe-inline`.
   *
   * The value must match the `nonce-...` source in your `script-src` and `style-src` directives, and
   * a fresh nonce should be generated for every request.
   */
  nonce: string
}
