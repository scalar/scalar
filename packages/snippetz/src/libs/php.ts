/**
 * Generates a consistent indentation string based on the specified indentation level.
 */
function indent(level: number): string {
  return ' '.repeat(level * 2)
}

/**
 * Represents a raw PHP code that should not be quoted, e.g. `fopen('test.txt', 'r')`.
 * If it consists of multiple lines, they will be indented properly.
 */
export class Raw {
  constructor(public value: string) {}
}

/**
 * Converts a JavaScript object or value into a PHP array or scalar string representation.
 * Handles nested arrays and objects, proper string escaping, and preserves indentation for readability.
 *
 * @example
 * objectToString({ foo: 'bar', baz: 'qux' }) // => "['foo' => 'bar', 'baz' => 'qux']"
 */
export function objectToString(data: unknown, level = 0): string {
  if (data === null || data === undefined) {
    return 'null'
  }

  if (data instanceof Raw) {
    const lines = data.value.split('\n')
    if (lines.length > 1) {
      const innerIndentation = indent(level + 1)
      return lines
        .map((line, index) => {
          if (index === 0) {
            return line
          }
          return `${innerIndentation}${line}`
        })
        .join('\n')
    }
    return data.value
  }

  if (typeof data === 'string') {
    return `'${data.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data)
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '[]'
    }

    const items = data.map((item) => objectToString(item, level + 1)).join(',\n' + indent(level + 1))

    return `[\n${indent(level + 1)}${items}\n${indent(level)}]`
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)
    if (entries.length === 0) {
      return '[]'
    }

    const items = entries
      .map(([key, value]) => `'${key}' => ${objectToString(value, level + 1)}`)
      .join(',\n' + indent(level + 1))

    return `[\n${indent(level + 1)}${items}\n${indent(level)}]`
  }

  return 'null'
}
