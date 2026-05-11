/**
 * Escape sequences that would let a value break out of an inline `<script>` tag.
 *
 * The HTML parser scans script bodies for `</script` (case-insensitive) and
 * `<!--`. A user-controlled string in the configuration (for example
 * `content`, a custom callback's source, or a CDN URL) that contains those
 * sequences would terminate the script element early — leaving the trailing
 * characters to be parsed as HTML and potentially executing injected markup.
 *
 * Inserting a backslash keeps the JavaScript string value identical (`\/` is
 * just `/` to the JS engine) while preventing the HTML parser from matching
 * the dangerous sequence.
 */
export const escapeForInlineScript = (source: string): string =>
  source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--')

const serializeArrayWithFunctions = (arr: readonly unknown[]): string =>
  `[${arr.map((item) => (typeof item === 'function' ? item.toString() : JSON.stringify(item))).join(', ')}]`

/**
 * Serialize a configuration object to a JavaScript expression string that can
 * be safely embedded inside an inline `<script>` tag.
 *
 * - Preserves top-level function-valued props (and arrays containing
 *   functions) by emitting raw source via `Function#toString` instead of
 *   silently dropping them (which `JSON.stringify` would do).
 * - Pretty-prints with 2-space indent and indents continuation lines with 6
 *   spaces so the output drops neatly into a `<script>` block.
 * - Escapes any `</script` or `<!--` sequences in the result.
 */
export const serializeConfigToScript = (config: Record<string, unknown>): string => {
  const jsonSafe: Record<string, unknown> = { ...config }
  const functionEntries: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      functionEntries.push(`"${key}": ${(value as (...args: unknown[]) => unknown).toString()}`)
      delete jsonSafe[key]
    } else if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
      functionEntries.push(`"${key}": ${serializeArrayWithFunctions(value)}`)
      delete jsonSafe[key]
    }
  }

  const json = JSON.stringify(jsonSafe, null, 2)
  const indented = json
    .split('\n')
    .map((line, index) => (index === 0 ? line : `      ${line}`))
    .join('\n')

  let result: string
  if (functionEntries.length === 0) {
    result = indented
  } else if (json === '{}') {
    result = `{\n        ${functionEntries.join(',\n        ')}\n      }`
  } else {
    const withoutClose = indented.split('\n').slice(0, -1).join('\n')
    result = `${withoutClose},\n        ${functionEntries.join(',\n        ')}\n      }`
  }

  return escapeForInlineScript(result)
}
