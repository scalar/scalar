/** Groups items by a property key; groups absent from the input remain absent. */
export function groupBy<K extends PropertyKey, T extends Record<K, PropertyKey>>(
  arr: T[],
  key: K,
): Partial<Record<T[K], T[]>>
export function groupBy<K extends PropertyKey, T extends Record<K, PropertyKey>, R>(
  arr: T[],
  key: K,
  transform: (item: T) => R,
): Partial<Record<T[K], R[]>>
export function groupBy<K extends PropertyKey, T extends Record<K, PropertyKey>, R>(
  arr: T[],
  key: K,
  transform?: (item: T) => R,
): Partial<Record<T[K], (T | R)[]>> {
  const groups: Partial<Record<T[K], (T | R)[]>> = {}
  // Missing groups must stay undefined even for names inherited from Object.prototype.
  Object.setPrototypeOf(groups, null)
  for (const item of arr) {
    const groupKey = item[key]
    const value = transform ? transform(item) : item
    const group = groups[groupKey]
    if (group) {
      group.push(value)
    } else {
      groups[groupKey] = [value]
    }
  }
  return groups
}
