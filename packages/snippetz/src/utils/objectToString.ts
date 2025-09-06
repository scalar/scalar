import { needsQuotes } from './needsQuotes'

/**
 * Represents a raw code that should not be quoted, e.g. `JSON.stringify(...)`.
 * If consists of multiple lines, they will be indented properly.
 */
export class Unquoted {
  constructor(public value: string) {}
}

/**
 * Converts an object into a string representation with proper formatting and indentation
 *
 * Handles nested objects, arrays, and special string values
 */
export function objectToString(obj: Record<string, any>, indent = 0): string {
  const parts = []
  const indentation = ' '.repeat(indent)
  const innerIndentation = ' '.repeat(indent + 2)

  if (Object.keys(obj).length === 0) {
    return '{}'
  }

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = needsQuotes(key) ? `'${key}'` : key

    if (value instanceof Unquoted) {
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
    } else if (Array.isArray(value)) {
      const items = value.map((item) => {
        if (typeof item === 'string') {
          return `'${item}'`
        }
        if (item && typeof item === 'object') {
          return objectToString(item)
        }
        return JSON.stringify(item)
      })

      if (items.some((item) => item.includes('\n'))) {
        // format vertically if any array element contains a newline
        const arrayString = items.map((item) => indentString(item, indent + 4)).join(',\n')
        parts.push(`${innerIndentation}${formattedKey}: [\n${arrayString}\n${innerIndentation}]`)
      } else {
        parts.push(`${innerIndentation}${formattedKey}: [${items.join(', ')}]`)
      }
    } else if (value && typeof value === 'object') {
      parts.push(`${innerIndentation}${formattedKey}: ${objectToString(value, indent + 2)}`)
    } else if (typeof value === 'string') {
      const formattedValue = `'${value}'`

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
