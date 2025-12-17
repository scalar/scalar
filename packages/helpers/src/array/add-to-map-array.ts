/**
 * A little helper to add a value to a map array where the type is Map<string, any[]>
 */
export const addToMapArray = (map: Map<string, unknown[]>, key: string, value: unknown) => {
  const prev = map.get(key) ?? []
  prev.push(value)
  map.set(key, prev)
}
