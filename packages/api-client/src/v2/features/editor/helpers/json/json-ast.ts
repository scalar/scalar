import type * as monaco from 'monaco-editor'

export type JsonPath = readonly (string | number)[]

/**
 * Traverses the AST of a JSON document to find the node at the provided JsonPath.
 * Returns undefined if the path does not exist in the AST.
 *
 * @param node - The root AST node to begin traversal from.
 * @param path - The path to traverse within the AST, as an array of keys/indices.
 * @returns The AST node at the specified path, or undefined if not found.
 */
export const getJsonAstNodeAtPath = (
  node: monaco.languages.json.ASTNode | undefined,
  path: JsonPath,
): monaco.languages.json.ASTNode | undefined => {
  let current = node

  for (const segment of path) {
    if (!current) {
      // Path does not exist in the AST.
      return undefined
    }

    if (current.type === 'object') {
      // Traverse object properties using the segment as a key.
      const key = String(segment)
      const prop = current.properties.find((p) => p.keyNode.value === key)
      current = prop?.valueNode
      continue
    }

    if (current.type === 'array') {
      // Traverse array items using the segment as an index.
      const index = typeof segment === 'number' ? segment : Number.parseInt(String(segment), 10)
      if (!Number.isFinite(index) || index < 0 || index >= current.items.length) {
        // Invalid index or out-of-bounds.
        return undefined
      }
      current = current.items[index]
      continue
    }

    // If current node can't have children referenced by the path, return undefined.
    return undefined
  }

  // Return the found node or undefined if not found.
  return current
}
