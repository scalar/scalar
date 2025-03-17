/**
 * Return a hash map from an array object using a generated key
 *
 * Example:
 * ```
 * const mappedObj =
 *   objectFromArray([{ key: '1', name: 'one' }, { key: '2', name: 'two'}], (item) => item.key)
 *
 * const result = {
 *   '1': { key: '1', name: 'one' },
 *   '2': { key: '2', name: 'two' }
 * }
 * ```
 */
export function objectFromArray<T extends object>(data: T[], keyGenerator: (val: T) => string) {
  return data.reduce<Record<string, T>>((map, current) => {
    if (map[keyGenerator(current)]) {
      console.warn(`Duplicate entry in object mapping for ${current}`)
    }

    map[keyGenerator(current)] = current
    return map
  }, {})
}
