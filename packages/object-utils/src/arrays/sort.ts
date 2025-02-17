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
 * Immutably sorts a list by another list with O(n) time
 * Returns a sorted copy with any unsorted items at the end of list
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

  return sorted.concat(...untagged)
}
