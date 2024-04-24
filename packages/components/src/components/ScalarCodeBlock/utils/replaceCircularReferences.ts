/**
 * JSON.stringify, but with circular dependencies replaced with '[Circular]'
 */
export function replaceCircularDependencies(content: any) {
  const cache = new Set()

  return JSON.stringify(
    content,
    (key, value) => {
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
