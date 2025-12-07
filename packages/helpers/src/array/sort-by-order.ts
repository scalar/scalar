/**
 * Immutably sorts an array based on a given custom order, as specified by a separate list of identifiers.
 *
 * Note: Make sure that the identifier is unique for each item in the array.
 * If the identifier is not unique, only the last occurrence of the identifier will be sorted.
 * Any other elements will be overridden by the last occurrence of the identifier.
 *
 * This function efficiently arranges elements of an input array so that items whose IDs (obtained via the `getId` callback)
 * match the order array will appear first, strictly in the order specified. Items not found in the order array will be
 * appended after, maintaining their original order.
 *
 * This is a flexible utility: the identifier can be extracted from any data structure via the `getId` callback,
 * and any primitive (string, number, symbol, etc.) can serve as the identifier type.
 * Sorting is O(n) with respect to the array size, making it performant even for large arrays.
 *
 * @template T - The type of array elements.
 * @template N - The type of values in the order array and the identifier returned by the getId callback.
 * @param arr - The array to be sorted.
 * @param order - Array specifying the desired sequence (contains identifiers returned by getId).
 * @param getId - A callback to extract the unique identifier from each array element.
 * @returns A new array sorted according to the order provided, with unmatched elements following.
 *
 * @example
 * // Sorting an array of objects:
 * const items = [
 *   { id: 'a', name: 'Alpha' },
 *   { id: 'b', name: 'Bravo' },
 *   { id: 'c', name: 'Charlie' }
 * ];
 * const order = ['c', 'a'];
 * const sorted = sortByOrder(items, order, item => item.id);
 * // Result:
 * // [
 * //   { id: 'c', name: 'Charlie' },
 * //   { id: 'a', name: 'Alpha' },
 * //   { id: 'b', name: 'Bravo' }
 * // ]
 *
 * @example
 * // Sorting an array of primitive values:
 * const input = ['a', 'b', 'c', 'd'];
 * const order = ['c', 'a'];
 * sortByOrder(input, order, item => item);
 * // Result: ['c', 'a', 'b', 'd']
 */
export function sortByOrder<T, N>(arr: T[], order: N[], getId: (item: T) => N): T[] {
  // Map the order to keep a single lookup table
  const orderMap = new Map<N, number>()
  order.forEach((e, idx) => orderMap.set(e, idx))

  const sorted: T[] = []
  const untagged: T[] = []

  arr.forEach((e) => {
    const sortedIdx = orderMap.get(getId(e))
    if (sortedIdx === undefined) {
      untagged.push(e)
      return
    }
    sorted[sortedIdx] = e
  })

  return [...sorted.filter((it) => it !== undefined), ...untagged]
}
