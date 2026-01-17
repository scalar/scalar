/**
 * Group together array objects by a specific key
 */
export const groupBy = <
  T extends Record<string, unknown>,
  K extends keyof T,
  V extends string | number | symbol = Extract<T[K], string | number | symbol>,
  R = T,
>(
  arr: T[],
  key: K,
  transform?: (item: T) => R,
): Record<V, R[]> => {
  return arr.reduce(
    (acc, obj) => {
      const transformedItem = transform ? transform(obj) : (obj as unknown as R)
      ;(acc[obj[key] as V] ??= []).push(transformedItem)
      return acc
    },
    {} as Record<V, R[]>,
  )
}
