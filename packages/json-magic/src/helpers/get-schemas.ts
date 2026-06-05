/**
 * Retrieves the $id property from the input object if it exists and is a string.
 *
 * @param input - The object to extract the $id from.
 * @returns The $id string if present, otherwise undefined.
 */
export const getId = (input: unknown): string | undefined => {
  if (input && typeof input === 'object' && input['$id'] && typeof input['$id'] === 'string') {
    return input['$id']
  }
  return undefined
}

/**
 * Joins an array of path segments into a single string separated by '/'.
 *
 * @param segments - The array of path segments.
 * @returns The joined path string.
 */
const getPath = (segments: string[]): string => {
  return segments.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')
}

export interface DynamicAnchorEntry {
  /** $id of the schema resource containing this $dynamicAnchor, or path for anonymous resources */
  resourceId: string
  /** JSON pointer path to the $dynamicAnchor definition node */
  anchorPath: string
}

export type SchemaMap = Map<string, string> & {
  /**
   * Dynamic anchors grouped by anchor name. Each name maps to an array of entries
   * keyed by their enclosing schema resource ($id). Used for scope-aware $dynamicRef resolution.
   */
  dynamicAnchors: Map<string, DynamicAnchorEntry[]>
  /**
   * Reverse map from object to its JSON pointer path in the document.
   * Used by the proxy to determine the position of anonymous schemas.
   */
  objectPaths: WeakMap<object, string>
}

const attachDynamicAnchors = (
  map: Map<string, string>,
  dynamicAnchors: Map<string, DynamicAnchorEntry[]>,
  objectPaths: WeakMap<object, string>,
): SchemaMap => {
  const result = map as SchemaMap
  result.dynamicAnchors = dynamicAnchors
  result.objectPaths = objectPaths
  return result
}

/**
 * Recursively traverses the input object to collect all schemas identified by $id, $anchor,
 * and $dynamicAnchor properties.
 *
 * - If an object has a $id property, it is added to the map with its $id as the key.
 * - If an object has a $anchor property, it is added to the map with a key composed of the current base and the anchor.
 * - If an object has a $dynamicAnchor property, it is recorded with its enclosing resource $id for scope-aware resolution.
 * - The function performs a depth-first search (DFS) through all nested objects.
 *
 * @param input - The input object to traverse.
 * @param base - The current base URI, used for resolving anchors.
 * @param segments - The current JSON pointer segments.
 * @param map - The map collecting found schemas by $id/$anchor.
 * @param visited - WeakSet of visited objects to prevent cycles.
 * @param dynamicAnchors - The map collecting dynamic anchor entries by name.
 * @param resourceBase - The $id of the current enclosing schema resource (tracks scope boundaries).
 * @param resourcePath - The JSON pointer path of the current enclosing schema resource boundary.
 * @returns A map of schema identifiers to their corresponding object paths, with a dynamicAnchors property.
 */
export const getSchemas = (
  input: unknown,
  base: string = '',
  segments: string[] = [],
  map = new Map<string, string>(),
  visited = new WeakSet(),
  dynamicAnchors = new Map<string, DynamicAnchorEntry[]>(),
  resourceBase: string = '',
  resourcePath: string = '',
  objectPaths = new WeakMap<object, string>(),
): SchemaMap => {
  if (typeof input !== 'object' || input === null) {
    return attachDynamicAnchors(map, dynamicAnchors, objectPaths)
  }

  if (visited.has(input)) {
    return attachDynamicAnchors(map, dynamicAnchors, objectPaths)
  }

  visited.add(input)

  // Record every object's path for reverse lookup
  objectPaths.set(input, getPath(segments))

  const id = getId(input)

  if (id) {
    map.set(id, getPath(segments))
  }

  const newBase = id ?? base
  const currentResourceBase = id ?? resourceBase
  const currentResourcePath = id ? getPath(segments) : resourcePath

  if (input['$anchor'] && typeof input['$anchor'] === 'string') {
    map.set(`${newBase}#${input['$anchor']}`, getPath(segments))
  }

  if (input['$dynamicAnchor'] && typeof input['$dynamicAnchor'] === 'string') {
    const anchorName = input['$dynamicAnchor'] as string
    let entries = dynamicAnchors.get(anchorName)
    if (!entries) {
      entries = []
      dynamicAnchors.set(anchorName, entries)
    }
    entries.push({
      resourceId: currentResourceBase || currentResourcePath,
      anchorPath: getPath(segments),
    })
  }

  for (const key in input) {
    if (typeof input[key] === 'object' && input[key] !== null) {
      getSchemas(
        input[key],
        newBase,
        [...segments, key],
        map,
        visited,
        dynamicAnchors,
        currentResourceBase,
        currentResourcePath,
        objectPaths,
      )
    }
  }

  return attachDynamicAnchors(map, dynamicAnchors, objectPaths)
}
