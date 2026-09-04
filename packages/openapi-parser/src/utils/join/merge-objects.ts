import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'

/**
 * Deep merges two objects, combining their properties recursively.
 *
 * ⚠️ Note: This operation assumes there are no key collisions between the objects.
 * @param a - Target object to merge into
 * @param b - Source object to merge from
 * @returns The merged object (mutates and returns a)
 *
 * @example
 * // Simple merge
 * const a = { name: 'John' }
 * const b = { age: 30 }
 * mergeObjects(a, b) // { name: 'John', age: 30 }
 *
 * // Nested merge
 * const a = { user: { name: 'John' } }
 * const b = { user: { age: 30 } }
 * mergeObjects(a, b) // { user: { name: 'John', age: 30 } }
 */
export const mergeObjects = <R>(a: Record<string, unknown>, b: Record<string, unknown>): R => {
  for (const key in b) {
    // Skip inherited keys and prototype pollution vectors such as an own `__proto__` key that
    // survives JSON.parse. Without this guard the recursive merge below would walk into
    // Object.prototype and pollute it for the whole process.
    if (!Object.hasOwn(b, key) || isPollutionKey(key)) {
      continue
    }

    if (!(key in a)) {
      a[key] = b[key]
    } else {
      const aValue = a[key]
      const bValue = b[key]

      if (typeof aValue === 'object' && aValue !== null && typeof bValue === 'object' && bValue !== null) {
        mergeObjects(aValue as Record<string, unknown>, bValue as Record<string, unknown>)
      } else {
        a[key] = bValue // Overwrite with b's value if not an object
      }
    }
  }

  return a as R
}
