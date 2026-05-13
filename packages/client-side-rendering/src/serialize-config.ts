import serialize from 'serialize-javascript'

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
