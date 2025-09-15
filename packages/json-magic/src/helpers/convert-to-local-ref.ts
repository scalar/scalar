/**
 * Translates a JSON Reference ($ref) to a local object path within the root schema.
 *
 * @param ref - The JSON Reference string (e.g., "#/foo/bar", "other.json#/baz", "other.json#anchor")
 * @param currentContext - The current base context (usually the $id of the current schema or parent)
 * @param schemas - A map of schema identifiers ($id, $anchor) to their local object paths
 * @returns The local object path as a string, or undefined if the reference cannot be resolved
 */
export const convertToLocalRef = (
  ref: string,
  currentContext: string,
  schemas: Map<string, string>,
): string | undefined => {
  // Split the reference into base URL and path/anchor (e.g., "foo.json#/bar" => ["foo.json", "/bar"])
  const [baseUrl, pathOrAnchor] = ref.split('#', 2)

  // If the full reference is already in the schemas map, return its path
  if (schemas.has(ref)) {
    return schemas.get(ref)
  }

  // Determine the base path: use the schemas map for the baseUrl, or fallback to the current context
  const base = schemas.get(baseUrl) ?? currentContext

  // If a baseUrl is provided but not found in schemas, the reference cannot be resolved
  // That means that this is an external reference, so we cannot resolve it
  if (baseUrl && !schemas.has(baseUrl)) {
    return undefined
  }

  // If there is a path or anchor after the '#', resolve it appropriately
  if (pathOrAnchor) {
    // If it starts with '/', it's a JSON pointer; otherwise, it may be an anchor
    return `${base}/${
      pathOrAnchor.startsWith('/') ? pathOrAnchor.slice(1) : (schemas.get(`${baseUrl}#${pathOrAnchor}`) ?? pathOrAnchor)
    }`
  }

  // If no path or anchor, just return the base path
  return base
}
