/**
 * Group together array objects by a specific key
 */
export const groupBy = <
  T extends Record<string, unknown>,
  K extends keyof T,
  V extends string | number | symbol = Extract<T[K], string | number | symbol>,
>(
  arr: T[],
  key: K,
) =>
  arr.reduce(
    (acc, obj) => {
      ;(acc[obj[key] as V] ??= []).push(obj)
      return acc
    },
    {} as Record<V, T[]>,
  )
