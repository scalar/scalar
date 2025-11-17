import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/**
 * Recursively searches for and returns the first child node (including the given node itself)
 * of a specific type within the provided node's subtree.
 *
 * @template Type - The type of node to search for.
 * @param type - The node type to match.
 * @param node - The root node to begin searching from.
 * @returns The first child node of the specified type, or null if not found.
 */
export const getChildEntry = <Type extends TraversedEntry['type']>(
  type: Type,
  node: TraversedEntry,
): (TraversedEntry & { type: Type }) | null => {
  if (node.type === type) {
    return node as TraversedEntry & { type: Type }
  }

  if ('children' in node) {
    for (const child of node.children ?? []) {
      const result = getChildEntry(type, child)

      if (result) {
        return result
      }
    }
  }

  return null
}
