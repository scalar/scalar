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

/** Replace all double moustache variables with values from a context object  */
export function replaceTemplateVariables(
  templateString: string,
  context: object,
) {
  const doubleCurlyBrackets = /\{\{([+= .a-zA-Z0-9_-]*?)\}\}/g

  const matches = templateString.match(doubleCurlyBrackets) ?? []

  // Very few good ways other than a `let` here
  let substitutedString = templateString
  matches.forEach((m) => {
    const key = m.trim().slice(2, -2)

    const value = getDotPathValue(key, context) ?? ''
    substitutedString = substitutedString.replaceAll(m, value)
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
