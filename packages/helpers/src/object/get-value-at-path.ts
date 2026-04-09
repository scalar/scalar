/**
 * Retrieves a nested value from the source document using a path array
 *
 * @example
 * ```ts
 * getValueByPath(document, ['components', 'schemas', 'User'])
 *
 * { id: '123', name: 'John Doe' }
 * ```
 */
export function getValueAtPath<R = unknown>(obj: any, pointer: string[]): R {
  return pointer.reduce((acc, part) => {
    if (acc === undefined || acc === null) {
      return undefined
    }
    return acc[part]
  }, obj)
}
