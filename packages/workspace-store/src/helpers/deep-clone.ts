/**
 * Deeply clones an object or array, handling circular references.
 *
 * This function recursively copies all properties of the input value,
 * creating a new object or array. If the input contains circular references,
 * they are preserved in the clone using a WeakMap to track already-cloned objects.
 *
 * @param value - The value to deep clone (object, array, or primitive)
 * @param hash - (internal) WeakMap for tracking circular references
 * @param getSource - Optional view of an object to copy when it exposes virtual properties.
 * @returns A deep clone of the input value
 *
 * @example
 * const obj: any = { a: 1 }
 * obj.self = obj
 * const clone = deepClone(obj)
 * console.log(clone) // { a: 1, self: [Circular] }
 * console.log(clone !== obj) // true
 * console.log(clone.self === clone) // true
 */
export const deepClone = <T>(value: T, hash = new WeakMap(), getSource?: (value: object) => object): T => {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (hash.has(value)) {
    return hash.get(value)
  }

  const result = Array.isArray(value) ? [] : {}
  hash.set(value, result)

  const source = getSource?.(value) ?? value
  Object.keys(source).forEach((key) => {
    // @ts-expect-error: Index signature for generic object
    result[key] = deepClone(source[key], hash, getSource)
  })

  return result as T
}
