import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Generate a reverse index for fast lookups of entities by their IDs.
 */
export const generateReverseIndex = (navigation: OpenApiDocument['x-scalar-navigation'] = []) => {
  // Adds a parent to each node for easier traversal if needed
  const mapping = new Map<string, TraversedEntry & { parent?: TraversedEntry }>()

  const dfs = (node: TraversedEntry & { parent?: TraversedEntry }) => {
    mapping.set(node.id, node)

    if ('children' in node) {
      // Recursively traverse children
      // and add the current node as their parent
      node.children?.forEach((it) => dfs({ ...(it as TraversedEntry), parent: node }))
    }
  }

  navigation.forEach(dfs)

  return mapping
}
