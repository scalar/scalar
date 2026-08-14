/**
 * Path segments that reach `Object.prototype` and can poison every object in the runtime.
 *
 * `JSON.parse` turns `__proto__` into a real own property, so a parsed document carries the segment
 * into `diff`, `merge` and `apply` like any other key. `constructor` and `prototype` are the second
 * route to the same place, through the constructor function of the container.
 */
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Checks whether an object key or diff path segment can be used to reach `Object.prototype`.
 *
 * Documents reach the diff utilities from remote fetches and user files, so the input is untrusted.
 * Callers must never traverse into or write through a segment this returns true for.
 *
 * @param segment - The object key or path segment to check
 * @returns true when the segment is unsafe to traverse or write through, false otherwise
 *
 * @example
 * isUnsafePathSegment('__proto__') // true
 * isUnsafePathSegment('paths') // false
 */
export const isUnsafePathSegment = (segment: string): boolean => UNSAFE_PATH_SEGMENTS.has(segment)

/**
 * Deep check for objects for collisions
 * Check primitives if their values are different
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if there is a collision, false otherwise
 *
 * @example
 * // Objects with different values for same key
 * isKeyCollisions({ a: 1 }, { a: 2 }) // true
 *
 * // Objects with different types
 * isKeyCollisions({ a: 1 }, { a: '1' }) // true
 *
 * // Objects with no collisions
 * isKeyCollisions({ a: 1 }, { b: 2 }) // false
 *
 * // Nested objects with collision
 * isKeyCollisions({ a: { b: 1 } }, { a: { b: 2 } }) // true
 */
export const isKeyCollisions = (a: unknown, b: unknown) => {
  if (typeof a !== typeof b) {
    return true
  }

  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])

    for (const key of keys) {
      if (a[key] !== undefined && b[key] !== undefined) {
        if (isKeyCollisions(a[key], b[key])) {
          return true
        }
      }
    }
    return false
  }

  // We handle all primitives here
  return a !== b
}

/**
 * Deep merges two objects, combining their properties recursively.
 *
 * ⚠️ Note: This operation assumes there are no key collisions between the objects.
 * Use isKeyCollisions() to check for collisions before merging.
 *
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
export const mergeObjects = (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> => {
  for (const key in b) {
    // Merging into a prototype-reaching key writes straight onto the prototype of every object in
    // the runtime, so these keys are dropped rather than merged. `diff` skips them as well, which
    // keeps both sides of a merge consistent.
    if (isUnsafePathSegment(key)) {
      continue
    }

    if (!(key in a)) {
      a[key] = b[key]
    } else {
      const aValue = a[key]
      const bValue = b[key]

      if (typeof aValue === 'object' && aValue !== null && typeof bValue === 'object' && bValue !== null) {
        a[key] = mergeObjects(aValue as Record<string, unknown>, bValue as Record<string, unknown>)
      }
    }
  }

  return a
}

/**
 * Checks if two arrays have the same elements in the same order.
 *
 * @param a - First array to compare
 * @param b - Second array to compare
 * @returns True if arrays have same length and elements, false otherwise
 *
 * @example
 * // Arrays with same elements
 * isArrayEqual([1, 2, 3], [1, 2, 3]) // true
 *
 * // Arrays with different elements
 * isArrayEqual([1, 2, 3], [1, 2, 4]) // false
 *
 * // Arrays with different lengths
 * isArrayEqual([1, 2], [1, 2, 3]) // false
 */
export const isArrayEqual = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i <= a.length; ++i) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}
