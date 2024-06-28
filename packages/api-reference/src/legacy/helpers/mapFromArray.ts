/**
 * A utility function to convert an array of objects to an object of objects.
 */
export function mapFromArray<
  T extends Record<string, unknown>,
  K extends keyof T & string,
  V extends keyof T & string,
>(arr: T[], key: K, valueKey: V) {
  const obj: Record<string, T[V]> = {}

  arr.forEach((entry) => {
    obj[entry[key] as string] = entry[valueKey]
  })

  return obj
}
