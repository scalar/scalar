import { getRaw } from '@scalar/json-magic/magic-proxy'

import type { UnknownObject } from '@/helpers/general'

/**
 * Deep merges two objects, combining their properties recursively.
 * Handles circular references by tracking visited objects to prevent infinite recursion.
 *
 * ⚠️ Note: This operation assumes there are no key collisions between the objects.
 * Use isKeyCollisions() to check for collisions before merging.
 *
 * @param a - Target object to merge into
 * @param b - Source object to merge from
 * @param cache - Set of visited objects to prevent circular reference issues
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
 *
 * // Circular reference safe
 * const obj = { name: 'John' }
 * obj.self = obj
 * const target = { age: 30 }
 * mergeObjects(target, obj) // Safely merges without infinite recursion
 */
export const mergeObjects = <R>(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  cache: Set<unknown> = new Set(),
): R => {
  for (const key in b) {
    if (!(key in a)) {
      a[key] = b[key]
    } else {
      const aValue = a[key]
      const bValue = b[key]

      if (typeof aValue === 'object' && aValue !== null && typeof bValue === 'object' && bValue !== null) {
        const rawA = getRaw(aValue as UnknownObject)
        const rawB = getRaw(bValue as UnknownObject)

        // Check for circular references before recursive merge
        if (cache.has(rawA) || cache.has(rawB)) {
          // Skip merging this branch to prevent infinite recursion
          continue
        }

        // Add objects to cache before recursive call
        cache.add(rawA)
        cache.add(rawB)

        mergeObjects(aValue as Record<string, unknown>, bValue as Record<string, unknown>, cache)
      } else {
        try {
          a[key] = bValue // Overwrite with b's value if not an object
        } catch (error) {
          console.warn(`Issue setting ${key} on object`)
          console.warn(error)
        }
      }
    }
  }

  return a as R
}
