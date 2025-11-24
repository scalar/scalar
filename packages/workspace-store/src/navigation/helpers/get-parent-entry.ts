import type { TraversedEntry } from '@/schemas/navigation'

/**
 * Traverses up the tree to find and return the closest parent node (including self) of a specified type.
 *
 * @template Type - The type of node to look for.
 * @param type - The type to match in the parent chain.
 * @param node - The node from which traversal begins.
 * @returns The closest parent node of the specified type, or undefined if not found.
 */
export const getParentEntry = <Type extends TraversedEntry['type']>(
  type: Type,
  node?: TraversedEntry & { parent?: TraversedEntry },
): (TraversedEntry & { type: Type }) | undefined => {
  if (!node) {
    return undefined
  }

  if (node.type === type) {
    return node as TraversedEntry & { type: Type }
  }

  return getParentEntry(type, node.parent)
}
