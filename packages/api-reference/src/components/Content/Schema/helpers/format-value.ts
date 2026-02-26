/**
 * Converts a value to a string that can be displayed in the UI.
 */
export function formatValue(value: unknown): string | number {
  if (Array.isArray(value)) {
    return `[${value
      .map((item) => {
        if (typeof item === 'string') {
          return `"${item.toString().trim()}"`
        }

        if (typeof item === 'object') {
          return JSON.stringify(item)
        }

        if (item === undefined) {
          return 'undefined'
        }

        if (item === null) {
          return 'null'
        }

        return item
      })
      .join(', ')}]`
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  return value.toString().trim()
}
