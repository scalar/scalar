import { parse } from 'yaml'

/**
 * Normalize a string (YAML, JSON, object) to a JavaScript datatype.
 */
export function normalize(content: any) {
  if (content === null) {
    return undefined
  }

  if (typeof content === 'string') {
    if (content.trim() === '') {
      return undefined
    }

    try {
      return JSON.parse(content)
    } catch (_error) {
      // Does it look like YAML?
      const hasColon = /^[^:]+:/.test(content)
      const isJson = content.slice(0, 50).trimStart().startsWith('{')

      if (!hasColon || isJson) {
        return undefined
      }

      return parse(content, {
        maxAliasCount: 10000,
      })
    }
  }

  return content
}
