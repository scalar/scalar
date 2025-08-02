/**
 * Recursively makes all properties of a type required.
 *
 * - If T is a function, it is returned as-is.
 * - If T is an array, recursively applies DeepRequired to its element type.
 * - If T is an object, recursively makes all properties required and applies DeepRequired to each property.
 * - Otherwise, T is returned as-is.
 *
 * @template T - The type to make deeply required.
 * @example
 * type Example = { a?: { b?: number[] } }
 * type RequiredExample = DeepRequired<Example>
 * // Result: { a: { b: number[] } }
 */
export type DeepRequired<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepRequired<U>>
    : T extends object
      ? { [K in keyof T]-?: DeepRequired<T[K]> }
      : T

/**
 * Recursively makes all properties of a type optional.
 *
 * - If T is an object, recursively applies DeepPartial to each property, making them optional.
 * - Otherwise, T is returned as-is.
 *
 * @template T - The type to make deeply partial (optional).
 * @example
 * type Example = { a: { b: number } }
 * type PartialExample = DeepPartial<Example>
 * // Result: { a?: { b?: number } }
 */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

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
