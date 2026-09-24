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
      // JSON keys may match prototype properties; create an own data property instead of following them.
      Object.defineProperty(acc, part, {
        value: isNaN(Number(part)) ? {} : [],
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
    return acc[part]
  }, obj)
}
