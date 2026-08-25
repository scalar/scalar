import { boolean, object, optional, string, union } from '@scalar/validation'

export const htmlRenderingConfigurationSchema = object({
  /**
   * The URL to the Scalar API Reference UMD bundle (the classic build that registers `window.Scalar`
   * and is loaded via `<script src>`).
   *
   * Use this to pin a specific version of the Scalar API Reference.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   *
   * @example https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.122
   */
  cdn: string({
    default: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
  }),
  /**
   * Load the modern, code-split ESM build instead of the classic UMD bundle.
   *
   * Pass `true` to load the default ESM entry (`.../@scalar/api-reference/esm.js`) as a
   * `<script type="module">`, or a URL string to point at a specific ESM build. When set, `bundle`
   * takes precedence over `cdn`.
   */
  bundle: optional(union([string(), boolean()])),
  pageTitle: string({
    default: 'Scalar API Reference',
  }),
  /**
   * A Content Security Policy (CSP) nonce to apply to the generated inline `<script>` and `<style>`
   * tags so the API Reference can render under a strict CSP without `unsafe-inline`.
   *
   * Generate a fresh value per request and match it in your `script-src` and `style-src` directives.
   */
  nonce: optional(string()),
})
