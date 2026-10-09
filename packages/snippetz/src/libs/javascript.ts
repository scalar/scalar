/**
 * Checks if a key needs to be wrapped in quotes when used as an object property
 *
 * Returns true when the key is not a valid JavaScript identifier.
 */
function needsQuotes(key: string) {
  return !/^[$A-Z_][0-9A-Z_$]*$/i.test(key)
}

/** Escapes a value for a single-quoted JavaScript string literal. */
export const escapeJsString = (value: string): string => {
  return value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('\r', '\\r').replaceAll("'", "\\'")
}

/**
 * Represents a raw code that should not be quoted, e.g. `JSON.stringify(...)`.
 * If consists of multiple lines, they will be indented properly.
 */
export class Raw {
  constructor(public value: string) {}
}

/**
 * Converts an object into a string representation with proper formatting and indentation
 *
 * Handles nested objects, arrays, and special string values
 */
export function objectToString(obj: object, indent = 0): string {
  const parts = []
  const indentation = ' '.repeat(indent)
  const innerIndentation = ' '.repeat(indent + 2)

  // Arrays must be handled before Object.entries turns their indexes into object keys.
  if (Array.isArray(obj)) {
    const items = obj.map((item) => {
      if (typeof item === 'string') {
        return `'${escapeJsString(item)}'`
      }
      if (item && typeof item === 'object') {
        return objectToString(item)
      }
      return JSON.stringify(item)
    })

    if (items.some((item) => item.includes('\n'))) {
      const arrayString = items.map((item) => indentString(item, indent + 2)).join(',\n')
      return `[\n${arrayString}\n${indentation}]`
    }
    return `[${items.join(', ')}]`
  }

  if (Object.keys(obj).length === 0) {
    return '{}'
  }

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = needsQuotes(key) ? `'${escapeJsString(key)}'` : key

    if (value instanceof Raw) {
      const lines = value.value.split('\n')
      let formattedValue = `${value.value}`

      if (lines.length > 1) {
        formattedValue = lines
          .map((line, index) => {
            if (index === 0) {
              return line
            }

            return `${innerIndentation}${line}`
          })
          .join('\n')
      }

      parts.push(`${innerIndentation}${formattedKey}: ${formattedValue}`)
    } else if (value && typeof value === 'object') {
      parts.push(`${innerIndentation}${formattedKey}: ${objectToString(value, indent + 2)}`)
    } else if (typeof value === 'string') {
      const formattedValue = `'${escapeJsString(value)}'`

      parts.push(`${innerIndentation}${formattedKey}: ${formattedValue}`)
    } else {
      parts.push(`${innerIndentation}${formattedKey}: ${value}`)
    }
  }

  return `{\n${parts.join(',\n')}\n${indentation}}`
}

function indentString(str: string, indent: number) {
  const indentation = ' '.repeat(indent)
  return str
    .split('\n')
    .map((line) => `${indentation}${line}`)
    .join('\n')
}
