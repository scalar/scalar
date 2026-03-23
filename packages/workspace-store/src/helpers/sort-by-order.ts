/**
 * Immutably sorts an array by a custom order specified in a separate list.
 *
 * Items found in the order list appear at the front, sorted by their position
 * in the order list. Items not in the order list appear at the end, maintaining
 * their original relative order.
 *
 * Copied from @scalar/object-utils/arrays to reduce dependencies.
 */
export function sortByOrder<T extends Record<K, string>, K extends keyof T>(arr: T[], order: string[], idKey: K): T[] {
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
