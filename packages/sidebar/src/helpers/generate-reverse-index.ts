/**
 * Generates a reverse index (Map) for fast lookups of entities by their IDs.
 * Also attaches a `parent` property to each node for easier upward traversal.
 *
 * @param items - The root array of entities to index.
 * @param nestedKey - The property name that contains child nodes (default: 'children').
 * @returns A Map where each key is an entity's `id` and the value is the entity (with optional `parent`).
 *
 * @example
 * const data = [
 *   { id: '1', name: 'Root', children: [
 *     { id: '2', name: 'Child 1' },
 *     { id: '3', name: 'Child 2', children: [
 *       { id: '4', name: 'Grandchild' }
 *     ]}
 *   ]}
 * ];
 * const index = generateReverseIndex(data);
 * // index.get('3') => { id: '3', name: 'Child 2', children: [...], parent: { id: '1', ... } }
 * // index.get('4') => { id: '4', name: 'Grandchild', parent: { id: '3', ... } }
 */
export const generateReverseIndex = <
  T extends { id: string } & Record<string, unknown>,
  Key extends string = 'children',
>(
  items: T[] = [],
  nestedKey: Key = 'children' as Key,
) => {
  // Create a mapping from id to node (with parent reference)
  const mapping = new Map<string, T & { parent?: T }>()

  const dfs = (node: T & { parent?: T }) => {
    mapping.set(node.id, node)

    if (nestedKey in node && Array.isArray(node[nestedKey])) {
      // Recursively traverse children and add the current node as their parent
      node[nestedKey]?.forEach((it) => dfs({ ...it, parent: node }))
    }
  }

  items.forEach(dfs)

  return mapping
}
