/**
 * Retrieves the $id property from the input object if it exists and is a string.
 *
 * @param input - The object to extract the $id from.
 * @returns The $id string if present, otherwise undefined.
 */
export const getId = (input: object): string | undefined => {
  if (input['$id'] && typeof input['$id'] === 'string') {
    return input['$id']
  }
  return undefined
}

/**
 * Recursively traverses the input object to collect all schemas identified by $id and $anchor properties.
 *
 * - If an object has a $id property, it is added to the map with its $id as the key.
 * - If an object has a $anchor property, it is added to the map with a key composed of the current base and the anchor.
 * - The function performs a depth-first search (DFS) through all nested objects.
 *
 * @param input - The input object to traverse.
 * @param base - The current base URI, used for resolving anchors.
 * @param map - The map collecting found schemas.
 * @returns A map of schema identifiers to their corresponding objects.
 */
export const getSchemas = (
  input: unknown,
  base: string = '',
  map = new Map<string, unknown>(),
  visited = new WeakSet(),
) => {
  // Only process non-null objects
  if (typeof input !== 'object' || input === null) {
    return map
  }

  // If the object has already been visited, return the map
  if (visited.has(input)) {
    return map
  }

  // Add the object to the visited set
  visited.add(input)

  // Attempt to get $id from the current object
  const id = getId(input)

  // If $id exists, add the object to the map with $id as the key
  if (id) {
    map.set(id, input)
  }

  // Update the base for nested anchors
  const newBase = id ?? base

  // If $anchor exists, add the object to the map with base#anchor as the key
  if (input['$anchor'] && typeof input['$anchor'] === 'string') {
    map.set(`${newBase}#${input['$anchor']}`, input)
  }

  // Recursively traverse all properties (DFS)
  for (const key in input) {
    if (typeof input[key] === 'object' && input[key] !== null) {
      getSchemas(input[key], newBase, map, visited)
    }
  }

  return map
}
