/**
 * Returns true if the provided value is a record object
 * (i.e. not null, not an array, and has an actual object as the prototype).
 *
 * Differs from the previous isObject in that it returns false for Date,
 * RegExp, Error, Map, Set, WeakMap, WeakSet, Promise, and other non-plain objects.
 *
 * | Value | Result |
 * | :--- | :--- |
 * | `isObject({})` | `true` |
 * | `isObject({ a: 1 })` | `true` |
 * | `isObject([])` | `false` (Array) |
 * | `isObject(null)` | `false` |
 * | `isObject(123)` | `false` |
 * | `isObject('string')` | `false` |
 * | `isObject(new Error('test'))` | `false` |
 * | `isObject(new Date())` | `false` |
 * | `isObject(Object.create(null))` | `true` |
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * A cheaper version of isObject if you do not care about arrays, errors, and dates.
 *
 * This helper is useful when you only need to guard against `null` and primitives.
 *
 * | Value | Result |
 * | :--- | :--- |
 * | `isObjectLike({})` | `true` |
 * | `isObjectLike([])` | `true` (Array) |
 * | `isObjectLike(new Date())` | `true` |
 * | `isObjectLike(null)` | `false` |
 * | `isObjectLike(123)` | `false` |
 * | `isObjectLike('string')` | `false` |
 */
export const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
