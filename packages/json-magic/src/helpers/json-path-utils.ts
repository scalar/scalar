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
 * Creates a nested path in an object from an array of path segments.
 * Only creates intermediate objects/arrays if they don't already exist.
 *
 * @param obj - The target object to create the path in
 * @param segments - Array of path segments to create
 * @returns The final nested object/array at the end of the path
 *
 * @example
 * ```ts
 * const obj = {}
 * createPathFromSegments(obj, ['components', 'schemas', 'User'])
 * // Creates: { components: { schemas: { User: {} } } }
 *
 * createPathFromSegments(obj, ['items', '0', 'name'])
 * // Creates: { items: [{ name: {} }] }
 * ```
 */
export function createPathFromSegments(obj: any, segments: string[]) {
  return segments.reduce((acc, part) => {
    if (acc[part] === undefined) {
      if (isNaN(Number(part))) {
        acc[part] = {}
      } else {
        acc[part] = []
      }
    }
    return acc[part]
  }, obj)
}
