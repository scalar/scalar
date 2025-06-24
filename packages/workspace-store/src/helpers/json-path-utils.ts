/**
 * Parses a JSON Pointer string into an array of path segments
 *
 * @example
 * ```ts
 * parseJsonPointer('#/components/schemas/User')
 *
 * ['components', 'schemas', 'User']
 * ```
 */
export function parseJsonPointer(pointer: string): string[] {
  return (
    pointer
      // Split on '/'
      .split('/')
      // Remove the leading '#' if present
      .filter((segment, index) => (index !== 0 || segment !== '#') && segment)
  )
}

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
export function getValueByPath<R = unknown>(obj: any, pointer: string[]): R {
  return pointer.reduce((acc, part) => {
    if (acc === undefined || acc === null) {
      return undefined
    }
    return acc[part]
  }, obj)
}
