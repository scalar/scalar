/**
 * Converts an example value to a string that can be displayed in the UI.
 */
export function formatExample(example: unknown) {
  if (Array.isArray(example)) {
    return `[${example
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
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

  return example
}
