/**
 * Type helper for checking that types are equal.
 *
 * @example
 * type IsEqual = Equal<'a', 'a'> // true
 * type IsNotEqual = Equal<'a', 'b'> // false
 */
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

/**
 * Type helper for asserting that a type is true.
 *
 * @example
 * type AssertString = Expect<Equal<string, string>>
 */
export type Expect<T extends true> = T

/**
 * Helper shape used by `DetailedDiff` to show expected and actual values.
 *
 * @example
 * type Entry = DiffEntry<string, number>
 * // { expected: string; actual: number }
 */
type DiffEntry<Expected, Actual> = {
  expected: Expected
  actual: Actual
}

/**
 * Returns a per-property diff between two object types.
 *
 * Matching properties are removed by `Diff`, so the result only includes
 * keys that are missing or have incompatible value types.
 *
 * @example
 * type ObjectDiff = DetailedDiff<{ id: string }, { id: number; name: string }>
 * // {
 * //   id: { expected: string; actual: number }
 * //   name: { expected: never; actual: string }
 * // }
 */
export type DetailedDiff<A, B> = {
  [K in keyof A | keyof B]: K extends keyof A
    ? K extends keyof B
      ? Equal<A[K], B[K]> extends true
        ? never
        : DiffEntry<A[K], B[K]>
      : DiffEntry<A[K], never>
    : K extends keyof B
      ? DiffEntry<never, B[K]>
      : never
}

/**
 * Remove keys that map to `never`.
 *
 * @example
 * type Cleaned = Clean<{ same: never; changed: { expected: string; actual: number } }>
 * // { changed: { expected: string; actual: number } }
 */
export type Clean<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K]
}

/**
 * Top-level object diff with only changed keys.
 *
 * @example
 * type Changed = Diff<{ id: string }, { id: number; name: string }>
 * // {
 * //   id: { expected: string; actual: number }
 * //   name: { expected: never; actual: string }
 * // }
 */
export type Diff<A, B> = Clean<DetailedDiff<A, B>>

/**
 * Triggers a compiler error that includes mismatched keys.
 *
 * @example
 * type AssertMatches = AssertNoDiff<Diff<{ id: string }, { id: string }>>
 * // passes because `Diff` is empty
 */
export type AssertNoDiff<T extends { [K in keyof T]: never }> = T

type StringifyKey<K> = K extends string | number ? `${K}` : never

type JoinPath<Prefix extends string, K> = Prefix extends '' ? StringifyKey<K> : `${Prefix}.${StringifyKey<K>}`

type IsTraversableObject<T> = T extends object
  ? T extends readonly unknown[]
    ? false
    : T extends (...args: never[]) => unknown
      ? false
      : true
  : false

type MismatchPathForEntry<Expected, Actual, Path extends string> = IsTraversableObject<Expected> extends true
  ? IsTraversableObject<Actual> extends true
    ? [MismatchPathsFromDiff<Diff<Expected, Actual>, Path>] extends [never]
      ? Path
      : MismatchPathsFromDiff<Diff<Expected, Actual>, Path>
    : Path
  : Path

type MismatchPathsFromDiff<TDiff, Prefix extends string = ''> = {
  [K in keyof TDiff]: TDiff[K] extends DiffEntry<infer Expected, infer Actual>
    ? MismatchPathForEntry<Expected, Actual, JoinPath<Prefix, K>>
    : never
}[keyof TDiff]

/**
 * Returns mismatched nested property paths using dot notation.
 *
 * @example
 * type Paths = MismatchPaths<
 *   { user: { profile: { name: string } } },
 *   { user: { profile: { name: number } } }
 * >
 * // "user.profile.name"
 */
export type MismatchPaths<A, B> = MismatchPathsFromDiff<Diff<A, B>>

/**
 * Builds a path-only mismatch map for compiler-friendly errors.
 *
 * Use with `AssertNoDiff` to get a compact list of mismatched paths:
 *
 * @example
 * type AssertMatches = AssertNoDiff<MismatchPathDiff<{ id: string }, { id: number }>>
 * // error keys include "id"
 */
export type MismatchPathDiff<A, B> = {
  [K in MismatchPaths<A, B>]: K
}
