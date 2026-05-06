/**
 * Serialize a Scalar configuration object to a JavaScript expression string.
 *
 * Mirrors the function-preserving serialization used by `getScriptTags` in
 * `@scalar/client-side-rendering`: top-level function-valued props (and
 * arrays containing functions) are emitted as raw source via `Function#toString`
 * instead of being silently dropped by `JSON.stringify`. This matters for
 * config keys like `content`, `plugins`, `onLoaded`, and custom `fetch`.
 */

const serializeArrayWithFunctions = (arr: readonly unknown[]): string =>
  `[${arr.map((item) => (typeof item === 'function' ? item.toString() : JSON.stringify(item))).join(',')}]`

const serializeConfigObject = (config: Record<string, unknown>): string => {
  const jsonSafe: Record<string, unknown> = { ...config }
  const functionEntries: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      functionEntries.push(`${JSON.stringify(key)}:${(value as (...args: unknown[]) => unknown).toString()}`)
      delete jsonSafe[key]
    } else if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
      functionEntries.push(`${JSON.stringify(key)}:${serializeArrayWithFunctions(value)}`)
      delete jsonSafe[key]
    }
  }

  const json = JSON.stringify(jsonSafe)

  if (functionEntries.length === 0) {
    return json
  }

  if (json === '{}') {
    return `{${functionEntries.join(',')}}`
  }

  // Inject function entries before the closing brace of the JSON object literal.
  return `${json.slice(0, -1)},${functionEntries.join(',')}}`
}

type SerializeArgs = {
  key: string
  configuration: Record<string, unknown>
  cdn: string | null
}

/**
 * Build the inline-script body that registers a single Scalar mount config on
 * the shared `window.__scalarAstro.configs` registry.
 */
export const serializeClientConfig = ({ key, configuration, cdn }: SerializeArgs): string => {
  const keyLiteral = JSON.stringify(key)
  const configLiteral = serializeConfigObject(configuration)
  const cdnLiteral = JSON.stringify(cdn)
  return `(window.__scalarAstro=window.__scalarAstro||{configs:{}}).configs[${keyLiteral}]={configuration:${configLiteral},cdn:${cdnLiteral}}`
}
