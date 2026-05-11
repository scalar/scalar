/**
 * Build the inline-script body that registers a single Scalar mount config on
 * the shared `window.__scalarAstro.configs` registry.
 *
 * Preserves top-level function-valued props (sorters, slug generators,
 * lifecycle hooks) by emitting raw source via `Function#toString`. Then
 * escapes any `</script` or `<!--` in the result because `key`, `cdn`, and
 * arbitrary config string values are user-controlled and would otherwise let
 * the value break out of the surrounding inline `<script>` tag.
 */

const escapeForInlineScript = (source: string): string =>
  source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--')

const serializeArrayWithFunctions = (arr: readonly unknown[]): string =>
  `[${arr.map((item) => (typeof item === 'function' ? item.toString() : JSON.stringify(item))).join(', ')}]`

const serializeConfig = (config: Record<string, unknown>): string => {
  const jsonSafe: Record<string, unknown> = { ...config }
  const functionEntries: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      functionEntries.push(`${JSON.stringify(key)}: ${(value as (...args: unknown[]) => unknown).toString()}`)
      delete jsonSafe[key]
    } else if (Array.isArray(value) && value.some((item) => typeof item === 'function')) {
      functionEntries.push(`${JSON.stringify(key)}: ${serializeArrayWithFunctions(value)}`)
      delete jsonSafe[key]
    }
  }

  const json = JSON.stringify(jsonSafe)

  if (functionEntries.length === 0) {
    return escapeForInlineScript(json)
  }
  if (json === '{}') {
    return escapeForInlineScript(`{ ${functionEntries.join(', ')} }`)
  }
  return escapeForInlineScript(`${json.slice(0, -1)}, ${functionEntries.join(', ')}}`)
}

type SerializeArgs = {
  key: string
  configuration: Record<string, unknown>
  cdn: string | null
}

export const serializeClientConfig = ({ key, configuration, cdn }: SerializeArgs): string => {
  const keyLiteral = JSON.stringify(key)
  const configLiteral = serializeConfig(configuration)
  const cdnLiteral = JSON.stringify(cdn)
  return escapeForInlineScript(
    `(window.__scalarAstro=window.__scalarAstro||{configs:{}}).configs[${keyLiteral}]={configuration:${configLiteral},cdn:${cdnLiteral}}`,
  )
}
