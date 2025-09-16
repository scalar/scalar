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

  if (baseUrl) {
    if (!schemas.has(baseUrl)) {
      return undefined
    }

    if (!pathOrAnchor) {
      return schemas.get(baseUrl)
    }

    // If the pathOrAnchor is a JSON pointer, we need to append it to the baseUrl
    if (pathOrAnchor.startsWith('/')) {
      return `${schemas.get(baseUrl)}${pathOrAnchor}`
    }

    // If the pathOrAnchor is an anchor, we need to return the anchor
    return schemas.get(`${baseUrl}#${pathOrAnchor}`)
  }

  if (pathOrAnchor) {
    if (pathOrAnchor.startsWith('/')) {
      return pathOrAnchor.slice(1)
    }
    return schemas.get(`${currentContext}#${pathOrAnchor}`)
  }

  return undefined
}
