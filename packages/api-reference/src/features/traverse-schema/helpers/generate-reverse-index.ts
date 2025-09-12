import type { OpenApiDocument, TraversedEntry } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Generate a reverse index for fast lookups of entities by their IDs.
 */
export const generateReverseIndex = (navigation: OpenApiDocument['x-scalar-navigation'] = []) => {
  const mapping = new Map<string, TraversedEntry>()

  const dfs = (node: TraversedEntry) => {
    mapping.set(node.id, node)

    if ('children' in node) {
      node.children?.forEach((it) => dfs(it as TraversedEntry))
    }
  }

  navigation.forEach(dfs)

  return mapping
}
