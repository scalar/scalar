import { isJsonString } from './parse'

/**
 * Takes JSON and formats it.
 */
export const prettyPrintJson = (value: string | number | any[] | Record<any, any>): string => {
  if (typeof value === 'string') {
    // JSON string
    if (isJsonString(value)) {
      return JSON.stringify(JSON.parse(value), null, 2)
    }

    // Regular string
    return value
  }

  // Object
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return replaceCircularDependencies(value)
    }
  }

  return value?.toString() ?? ''
}

/**
 * JSON.stringify, but with circular dependencies replaced with '[Circular]'
 */
export function replaceCircularDependencies(content: any) {
  const cache = new Set()

  return JSON.stringify(
    content,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]'
        }

        cache.add(value)
      }
      return value
    },
    2,
  )
}
