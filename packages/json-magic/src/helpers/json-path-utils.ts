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
    if (!Object.hasOwn(acc, part) || acc[part] === undefined) {
      const value = isNaN(Number(part)) ? {} : []
      if (part === '__proto__') {
        // Avoid the prototype setter while preserving ordinary proxy set notifications.
        Object.defineProperty(acc, part, { value, enumerable: true, configurable: true, writable: true })
      } else {
        acc[part] = value
      }
    }
    return acc[part]
  }, obj)
}
