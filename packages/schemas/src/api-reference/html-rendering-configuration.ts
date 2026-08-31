import { boolean, object, optional, string, union } from '@scalar/validation'

export const htmlRenderingConfigurationSchema = object({
  /**
   * The URL to the Scalar API Reference UMD bundle (the classic build that registers `window.Scalar`
   * and is loaded via `<script src>`).
   *
   * Setting it selects the UMD build instead of the default ESM build — use it to pin a specific
   * version of the classic bundle.
   *
   * @default https://cdn.jsdelivr.net/npm/@scalar/api-reference
   *
   * @example https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.122
   */
  cdn: string({
    default: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
  }),
  /**
   * Which build to load. The modern, code-split ESM build is the default.
   *
   * Pass a URL string to load a specific ESM build, or `false` to fall back to the classic UMD bundle.
   * When set, `bundle` takes precedence over both `cdn` and the `nonce` fallback.
   *
   * When a `nonce` is set (a strict, nonce-based CSP) the UMD bundle is used by default, because the
   * ESM build's `import`-loaded chunks cannot be nonced. Pass `bundle: true` to force the ESM build if
   * your CSP uses `'strict-dynamic'`.
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
