/**
 * Generate a reverse index for fast lookups of entities by their IDs.
 */
export const generateReverseIndex = <
  T extends { id: string } & Record<string, unknown>,
  Key extends string = 'children',
>(
  items: T[] = [],
  nestedKey: Key = 'children' as Key,
) => {
  // Adds a parent to each node for easier traversal if needed
  const mapping = new Map<string, T & { parent?: T }>()

  const dfs = (node: T & { parent?: T }) => {
    mapping.set(node.id, node)

    if (nestedKey in node && Array.isArray(node[nestedKey])) {
      // Recursively traverse children
      // and add the current node as their parent
      node[nestedKey]?.forEach((it) => dfs({ ...it, parent: node }))
    }
  }

  items.forEach(dfs)

  return mapping
}
