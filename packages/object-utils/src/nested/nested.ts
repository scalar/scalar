/**
 * Deep setting
 *
 * Derived from @url https://github.com/react-hook-form/react-hook-form/tree/011fad503cc8d4543892f8e847b9bd58c1d9400f/src/types/path
 *
 */
import type { ArrayKey, BrowserNativeObject, IsAny, IsEqual, IsTuple, Primitive, TupleKeys } from './common'

/**
 * Helper function to break apart T1 and check if any are equal to T2
 *
 * See {@link IsEqual}
 */
type AnyIsEqual<T1, T2> = T1 extends T2 ? (IsEqual<T1, T2> extends true ? true : never) : never

/**
 * Helper type for recursively constructing paths through a type.
 * This actually constructs the strings and recurses into nested
 * object types.
 *
 * See {@link Path}
 */
type PathImpl<K extends string | number, V, TraversedTypes> = V extends Primitive | BrowserNativeObject
  ? `${K}`
  : // Check so that we don't recurse into the same type
    // by ensuring that the types are mutually assignable
    // mutually required to avoid false positives of subtypes
    true extends AnyIsEqual<TraversedTypes, V>
    ? `${K}`
    : `${K}` | `${K}.${PathInternal<V, TraversedTypes | V>}`

/**
 * Helper type for recursively constructing paths through a type.
 * This obscures the internal type param TraversedTypes from exported contract.
 *
 * See {@link Path}
 */
type PathInternal<T, TraversedTypes = T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: PathImpl<K & string, T[K], TraversedTypes>
      }[TupleKeys<T>]
    : PathImpl<ArrayKey, V, TraversedTypes>
  : {
      [K in keyof T]-?: PathImpl<K & string, T[K], TraversedTypes>
    }[keyof T]

/**
 * Type which eagerly collects all paths through a type
 * @typeParam T - type which should be introspected
 * @example
 * ```
 * Path<{foo: {bar: string}}> = 'foo' | 'foo.bar'
 * ```
 */
// We want to explode the union type and process each individually
// so assignable types don't leak onto the stack from the base.
type Path<T> = T extends any ? PathInternal<T> : never

/**
 * Helper type for recursively constructing paths through a type.
 * This actually constructs the strings and recurses into nested
 * object types.
 *
 * See {@link ArrayPath}
 */
type ArrayPathImpl<K extends string | number, V, TraversedTypes> = V extends Primitive | BrowserNativeObject
  ? IsAny<V> extends true
    ? string
    : never
  : V extends ReadonlyArray<infer U>
    ? U extends Primitive | BrowserNativeObject
      ? IsAny<V> extends true
        ? string
        : never
      : // Check so that we don't recurse into the same type
        // by ensuring that the types are mutually assignable
        // mutually required to avoid false positives of subtypes
        true extends AnyIsEqual<TraversedTypes, V>
        ? never
        : `${K}` | `${K}.${ArrayPathInternal<V, TraversedTypes | V>}`
    : true extends AnyIsEqual<TraversedTypes, V>
      ? never
      : `${K}.${ArrayPathInternal<V, TraversedTypes | V>}`

/**
 * Helper type for recursively constructing paths through a type.
 * This obscures the internal type param TraversedTypes from exported contract.
 *
 * See {@link ArrayPath}
 */
type ArrayPathInternal<T, TraversedTypes = T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathImpl<K & string, T[K], TraversedTypes>
      }[TupleKeys<T>]
    : ArrayPathImpl<ArrayKey, V, TraversedTypes>
  : {
      [K in keyof T]-?: ArrayPathImpl<K & string, T[K], TraversedTypes>
    }[keyof T]

/**
 * Type which eagerly collects all paths through a type which point to an array
 * type.
 * @typeParam T - type which should be introspected.
 * @example
 * ```
 * Path<{foo: {bar: string[], baz: number[]}}> = 'foo.bar' | 'foo.baz'
 * ```
 */
// We want to explode the union type and process each individually
// so assignable types don't leak onto the stack from the base.
type ArrayPath<T> = T extends any ? ArrayPathInternal<T> : never

/**
 * Type to evaluate the type which the given path points to.
 * @typeParam T - deeply nested type which is indexed by the path
 * @typeParam P - path into the deeply nested type
 * @example
 * ```
 * PathValue<{foo: {bar: string}}, 'foo.bar'> = string
 * PathValue<[number, string], '1'> = string
 * ```
 */
type PathValue<T, P extends Path<T> | ArrayPath<T>> = T extends any
  ? P extends keyof T
    ? T[P]
    : P extends `${infer K}.${infer R}`
      ? K extends keyof T
        ? R extends Path<T[K]>
          ? PathValue<T[K], R>
          : never
        : K extends `${ArrayKey}`
          ? T extends ReadonlyArray<infer V>
            ? PathValue<V, R & Path<V>>
            : never
          : never
      : P extends `${ArrayKey}`
        ? T extends ReadonlyArray<infer V>
          ? V
          : never
        : never
  : never

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

/**
 * Set a nested value from an object using a dot separated path.
 *
 * Basic Path: `'foo.bar'`
 *
 * With Array: `'foo.1.bar'`
 */
export function setNestedValue<T, P extends Path<T>>(obj: T, path: P, value: PathValue<T, P>) {
  const keys = path.split('.')

  // Loop over to get the nested object reference. Then assign the value to it
  keys.reduce((acc, current, idx) => {
    if (idx === keys.length - 1) {
      acc[current] = value
    }

    return acc[current]
  }, obj as any)

  return obj
}

/**
 * Get a nested value from an object using a dot separated path.
 *
 * Basic Path: `'foo.bar'`
 *
 * With Array: `'foo.1.bar'`
 */
export function getNestedValue<T, P extends Path<T>>(obj: T, path: P) {
  const keys = path.split('.')

  // Loop over to get the nested object reference. Then assign the value to it
  return keys.reduce((acc, current) => {
    return acc[current]
  }, obj as any)
}

/** Export the path and path value types to create other setter functions */
export type { Path, PathValue }
