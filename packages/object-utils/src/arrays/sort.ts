/** Date sorting for arrays */
export function timeSort<T>(a: T, b: T, key?: T extends object ? keyof T : never): number {
  const valA = ((key ? a[key] : a) ?? '') as string | Date
  const valB = ((key ? b[key] : b) ?? '') as string | Date
  return new Date(valA).getTime() - new Date(valB).getTime()
}

/** Sort alphanumerically */
export function alphaSort<T>(a: T, b: T, key?: T extends object ? keyof T : never): number {
  const valA = String((key ? a[key] : a) ?? '')
  const valB = String((key ? b[key] : b) ?? '')

  return valA.localeCompare(valB)
}

/**
 * Immutably sorts an array by a custom order specified in a separate list.
 *
 * This function efficiently sorts an array of objects according to the order
 * provided in a separate array of identifiers. Items found in the order list
 * will appear at the front, sorted by their position in the order list. Items
 * whose identifier is not found in the order list will appear at the end,
 * maintaining their original relative order.
 *
 * Sorting is performed in O(n) time relative to the array size, making this
 * function suitable for large arrays.
 *
 * @template T - The type of the array elements, which must contain an identifier key of type string.
 * @template K - The key of T used as the identifier for sorting.
 * @param arr - The array of objects to be sorted.
 * @param order - The array of string identifiers indicating the desired order.
 * @param idKey - The object key in each element of arr to use for lookup/matching in order.
 * @returns A new sorted array, where items matching the order array come first (in order), and unmatched items follow.
 *
 * @example
 * const items = [
 *   { id: 'a', name: 'Alpha' },
 *   { id: 'b', name: 'Bravo' },
 *   { id: 'c', name: 'Charlie' }
 * ];
 * const order = ['c', 'a'];
 * const sorted = sortByOrder(items, order, 'id');
 * // Result:
 * // [
 * //   { id: 'c', name: 'Charlie' },
 * //   { id: 'a', name: 'Alpha' },
 * //   { id: 'b', name: 'Bravo' }
 * // ]
 */
export function sortByOrder<T extends Record<K, string>, K extends keyof T>(arr: T[], order: string[], idKey: K): T[] {
  // Map the order to keep a single lookup table
  const orderMap: Record<string, number> = {}
  order.forEach((e, idx) => (orderMap[e] = idx))

  const sorted: T[] = []
  const untagged: T[] = []

  arr.forEach((e) => {
    const sortedIdx = orderMap[e[idKey]] ?? -1
    if (sortedIdx >= 0) {
      sorted[sortedIdx] = e
    } else {
      untagged.push(e)
    }
  })

  return sorted.filter(Boolean).concat(...untagged)
}
