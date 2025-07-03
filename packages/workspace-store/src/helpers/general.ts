export type UnknownObject = Record<string, unknown>

/**
 * Returns true if the value is a non-null object (but not an array).
 *
 * @example
 * ```ts
 * isObject({}) // true
 * isObject([]) // false
 * isObject(null) // false
 * ```
 */
export function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Checks if a string is a local reference (starts with #)
 * @param value - The reference string to check
 * @returns true if the string is a local reference, false otherwise
 * @example
 * ```ts
 * isLocalRef('#/components/schemas/User') // true
 * isLocalRef('https://example.com/schema.json') // false
 * isLocalRef('./local-schema.json') // false
 * ```
 */
export function isLocalRef(value: string): boolean {
  return value.startsWith('#')
}

export function keyOf<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value) as (keyof T)[]
}

/**
 * Deep clones a value using JSON serialization.
 *
 * @param value - The value to deep clone
 * @template T - The type of the value
 * @returns A deep clone of the value
 */
export const deepClone = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Splits an array into two arrays based on a condition.
 *
 * This function takes an array and a predicate function, then returns a tuple containing
 * two arrays: the first contains elements that pass the condition, and the second contains
 * elements that fail the condition.
 *
 * @param array - The array to split
 * @param condition - A predicate function that determines which array each element belongs to
 * @returns A tuple of two arrays: [passingElements, failingElements]
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5, 6]
 * const [evens, odds] = split(numbers, (n) => n % 2 === 0)
 * // evens: [2, 4, 6]
 * // odds: [1, 3, 5]
 *
 * const words = ['apple', 'banana', 'cherry', 'date']
 * const [longWords, shortWords] = split(words, (word) => word.length > 5)
 * // longWords: ['banana', 'cherry']
 * // shortWords: ['apple', 'date']
 * ```
 */
export const split = <T>(array: T[], condition: (element: T) => boolean) => {
  return array.reduce<[T[], T[]]>(
    ([pass, fail], item) => {
      return condition(item) ? [[...pass, item], fail] : [pass, [...fail, item]]
    },
    [[], []],
  )
}

/**
 * Safely assigns properties from a source object to a target object.
 *
 * This function uses Object.assign to copy enumerable properties from the source object
 * to the target object. It's a type-safe wrapper around Object.assign that ensures
 * the source object is compatible with the target object's type.
 *
 * @param target - The target object to assign properties to
 * @param source - The source object containing properties to assign
 * @template T - The type of the target object
 *
 * @example
 * ```ts
 * const target = { name: 'John', age: 30 }
 * const source = { age: 31, city: 'New York' }
 * safeAssign(target, source)
 * // target is now: { name: 'John', age: 31, city: 'New York' }
 *
 * const config = { theme: 'dark', language: 'en' }
 * const updates = { theme: 'light' }
 * safeAssign(config, updates)
 * // config is now: { theme: 'light', language: 'en' }
 * ```
 */
export const safeAssign = <T extends Record<string, unknown>>(target: T, source: Partial<T>) => {
  Object.assign(target, source)
}
