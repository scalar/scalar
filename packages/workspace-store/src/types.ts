/**
 * Converts a readonly array type to a mutable array type.
 *
 * This utility type removes the readonly modifier from all elements in an array type,
 * allowing the array to be modified. It's useful when you need to work with mutable
 * versions of readonly arrays in TypeScript.
 *
 * @template T - The readonly array type to convert to mutable
 * @example
 * // Convert a readonly array to mutable
 * type ReadonlyNumbers = readonly number[]
 * type MutableNumbers = MutableArray<ReadonlyNumbers>
 * // Result: number[]
 */
export type MutableArray<T extends readonly any[]> = {
  -readonly [k in keyof T]: T[k]
}
