/**
 * Returns true if the provided value is a plain object
 * (i.e. not null, not an array, and typeof value is "object").
 *
 * This is a type guard useful for narrowing types in TypeScript.
 *
 * Examples:
 *   isObject({})                // true
 *   isObject({ a: 1 })          // true
 *   isObject([])                // false (Array)
 *   isObject(null)              // false
 *   isObject(123)               // false
 *   isObject('string')          // false
 *   isObject(new Date())        // true  (note: Date is technically an object)
 *   isObject(Object.create(null)) // true
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
