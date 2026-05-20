/**
 * Trims surrounding whitespace, but keeps the original string when trimming would empty it
 * (so an intentional " " example is not silently turned into "").
 */
function preserveOrTrim(value: string): string {
  const trimmed = value.trim()
  return trimmed === '' ? value : trimmed
}

/**
 * Converts an example value to a string that can be displayed in the UI.
 */
export function formatExample(example: unknown): string | number {
  if (Array.isArray(example)) {
    return `[${example
      .map((item) => {
        if (typeof item === 'string') {
          return `"${preserveOrTrim(item)}"`
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

  if (example === null) {
    return 'null'
  }

  if (typeof example === 'object') {
    if ('value' in example) {
      return example.value as string | number
    }

    if ('externalValue' in example) {
      return example.externalValue as string | number
    }

    return JSON.stringify(example)
  }

  if (example === undefined) {
    return 'undefined'
  }

  if (typeof example === 'string') {
    return preserveOrTrim(example)
  }

  return preserveOrTrim(example.toString())
}
