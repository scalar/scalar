import serialize from 'serialize-javascript'

/**
 * Escape sequences that would let a value break out of an inline `<script>` tag.
 *
 * `serializeConfigToScript` already handles this for the config payload via
 * `serialize-javascript`. This standalone helper is exposed for callers that
 * splice other user-controlled strings into the same inline-script context
 * (for example a CDN URL that downstream code interpolates into the
 * surrounding HTML).
 */
export const escapeForInlineScript = (source: string): string =>
  source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--')

/**
 * Serialize a configuration object to a JavaScript expression string that can
 * be safely embedded inside an inline `<script>` tag.
 *
 * `serialize-javascript` preserves function-valued props (via
 * `Function#toString`) instead of silently dropping them the way
 * `JSON.stringify` does, and escapes `</script`, `<!--`, `<![CDATA[`, and the
 * U+2028 / U+2029 line separators so the output cannot break out of the
 * surrounding script element.
 *
 * Continuation lines are indented six spaces so the result drops neatly into
 * the script template in `html-rendering.ts`.
 */
export const serializeConfigToScript = (config: Record<string, unknown>): string =>
  serialize(config, { space: 2 })
    .split('\n')
    .map((line, index) => (index === 0 ? line : `      ${line}`))
    .join('\n')
