import { object, optional, string } from '@scalar/validation'

export const htmlRenderingConfigurationSchema = object({
  /**
   * The URL to the Scalar API Reference JS CDN.
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
