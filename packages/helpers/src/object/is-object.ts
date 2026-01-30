/**
 * Returns true if the provided value is a record object
 * (i.e. not null, not an array, and has an actual object as the prototype).
 *
 * Differs from the previous isObject in that it returns false for Date,
 * RegExp, Error, Map, Set, WeakMap, WeakSet, Promise, and other non-plain objects.
 *
 * Examples:
 *   isObject({})                  // true
 *   isObject({ a: 1 })            // true
 *   isObject([])                  // false (Array)
 *   isObject(null)                // false
 *   isObject(123)                 // false
 *   isObject('string')            // false
 *   isObject(new Error('test'))   // false
 *   isObject(new Date())          // false
 *   isObject(Object.create(null)) // true
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
