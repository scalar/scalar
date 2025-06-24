/**
 * Applies a type transformation to a given type T based on the Transform parameter.
 *
 * This utility type supports common TypeScript transformations:
 * - 'NonNullable': Removes null and undefined from the type
 * - 'Partial': Makes all properties optional
 * - 'Required': Makes all properties required
 * - 'Readonly': Makes all properties readonly
 *
 * If no valid transformation is provided, returns the original type unchanged.
 *
 * @template T - The type to transform
 * @template Transform - The transformation to apply ('NonNullable' | 'Partial' | 'Required' | 'Readonly')
 */
type ApplyTransform<T, Transform> = Transform extends 'NonNullable'
  ? NonNullable<T>
  : Transform extends 'Partial'
    ? Partial<T>
    : Transform extends 'Required'
      ? Required<T>
      : Transform extends 'Readonly'
        ? Readonly<T>
        : // fallback to original type
          T

/**
 * Recursively applies a type transformation to all levels of a nested type structure.
 *
 * This utility type traverses through complex nested types and applies the specified transformation
 * at each level. It handles:
 * - Functions: Returns the function type unchanged (no transformation applied)
 * - Arrays: Recursively transforms each element in the array
 * - Objects: Recursively transforms each property value in the object
 * - Primitives: Applies the transformation directly using ApplyTransform
 *
 * The transformation is applied using the ApplyTransform utility, which supports:
 * 'NonNullable', 'Partial', 'Required', and 'Readonly' transformations.
 *
 * @template T - The type to recursively transform
 * @template Transform - The transformation to apply at each level
 * @example
 * // Make all properties in a nested object optional
 * type OptionalNested = DeepTransform<{ a: { b: string } }, 'Partial'>
 * // Result: { a?: { b?: string } }
 */
export type DeepTransform<T, Transform> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
    ? Array<DeepTransform<U, Transform>>
    : T extends object
      ? { [K in keyof T]-?: DeepTransform<ApplyTransform<NonNullable<T[K]>, Transform>, Transform> }
      : ApplyTransform<NonNullable<T>, Transform>

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
