/**
 * Type safe alternative to array.filter(Boolean)
 *
 * @example
 *
 * ```ts
 * const dataArray = [1, null, 2, undefined, 3].filter(isDefined)
 * ```
 *
 * @see https://jaketrent.com/post/typescript-type-safe-filter-boolean/
 */
export const isDefined = <T>(value: T | null | undefined): value is NonNullable<T> =>
  value !== null && value !== undefined
