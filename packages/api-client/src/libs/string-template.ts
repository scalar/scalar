/**
 * Get the nested value from a context object
 *
 */
export function getDotPathValue(path: string, context: object) {
  const pathKeys = path.split('.')

  const result = pathKeys.reduce(
    (nested: any, currentKey) => nested?.[currentKey],
    context,
  )
  return typeof result === 'string' ? result : JSON.stringify(result)
}

/**
 * Replace all variables with values from a context object
 *
 * - {{ double curly }}
 * - { single curly }
 * - :colon
 */
export function replaceTemplateVariables(
  templateString: string,
  context: object,
) {
  /** Matches single, double curly and colon style variables */
  const variableRegex = /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g
  const matches = templateString.match(variableRegex) ?? []

  // Very few good ways other than a `let` here
  let substitutedString = templateString
  matches.forEach((m) => {
    const key = m.startsWith(':') ? m.slice(1) : m.replace(/[{}]/g, '').trim()

    const value = getDotPathValue(key, context)
    if (value) substitutedString = substitutedString.replaceAll(m, value)
  })

  return substitutedString
}

/**
 * Return a list of key/value pairs for the environment
 * Nested values will be dot-path referenced
 */
export function flattenEnvVars(environment: object) {
  /** Recursively get all nested paths string */
  function getNestedKeyValues(item: any, prefix?: string): [string, string][] {
    const keys = Object.keys(item)
    const values: [string, string][] = []
    keys.forEach((k) => {
      const prefixedKey = prefix ? `${prefix}.${k}` : k
      if (typeof item[k] === 'object') {
        // While we can support fetching of nested paths we won't support substitution of object values
        // values.push([prefixedKey, JSON.stringify(item[k])])
        values.push(...getNestedKeyValues(item[k], prefixedKey))
      } else {
        values.push([prefixedKey, String(item[k])])
      }
    })

    return values
  }

  return getNestedKeyValues(environment)
}
