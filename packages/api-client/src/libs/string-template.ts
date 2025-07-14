import { REGEX } from '@scalar/oas-utils/helpers'
import { isDefined } from '@scalar/oas-utils/helpers'

/**
 * Get the nested value from a context object
 *
 */
export function getDotPathValue(path: string, context: object) {
  const pathKeys = path.split('.')

  const result = pathKeys.reduce((nested: any, currentKey) => nested?.[currentKey], context)
  return typeof result === 'string' ? result : JSON.stringify(result)
}

/**
 * Replace all variables with values from a context object
 *
 * - {{ double curly }} - for query parameters and headers (no encoding)
 * - { single curly } - for path parameters (URL encoded)
 * - :colon - for path parameters (URL encoded)
 */
export function replaceTemplateVariables(templateString: string, context: object) {
  let substitutedString = templateString
  const usedKeys = new Set<string>()

  // Handle double curly braces first (no encoding for query params/headers)
  substitutedString = substitutedString.replace(REGEX.VARIABLES, (_, variable) => {
    const key = variable.trim()
    usedKeys.add(key)
    const value = getDotPathValue(key, context)
    return isDefined(value) && value !== '' ? value : `{{${key}}}`
  })

  // Handle single curly braces for path parameters (URL encode the values)
  substitutedString = substitutedString.replace(REGEX.PATH, (_, variable) => {
    const key = variable.trim()
    if (usedKeys.has(key)) {
      return `{${key}}`
    }
    const value = getDotPathValue(key, context)
    if (isDefined(value) && value !== '') {
      // URL encode path parameter values to handle special characters like colons, commas, etc.
      return encodeURIComponent(value)
    }
    return `{${key}}`
  })

  // Handle colon format for path parameters (URL encode the values)
  substitutedString = substitutedString.replace(/:\b[\w.]+\b/g, (match) => {
    const key = match.slice(1)
    if (usedKeys.has(key)) {
      return match
    }
    const value = getDotPathValue(key, context)
    if (isDefined(value) && value !== '') {
      // URL encode path parameter values to handle special characters like colons, commas, etc.
      return encodeURIComponent(value)
    }
    return match
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
