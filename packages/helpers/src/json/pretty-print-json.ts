/**
 * Takes JSON and formats it.
 */
export const prettyPrintJson = (value: string | number | any[] | Record<any, any>): string => {
  // When the values is already a string it should be parsable
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(parsed, null, 2)
      }

      return value
    } catch {
      return value
    }
  }

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
