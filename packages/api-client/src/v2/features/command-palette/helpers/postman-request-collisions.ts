import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getOpenApiMergeKeys, getPostmanMergeKeys } from '@/v2/features/command-palette/helpers/get-merge-key'
import { getPostmanItemAtIndexPath } from '@/v2/features/command-palette/helpers/postman-request-tree'

/**
 * Among the selected Postman request path keys, returns keys whose requests map to the same
 * OpenAPI path + HTTP method as another selected request or an existing operation in the base document.
 *
 * @param itemRoot - Postman collection `item` array
 * @param selectedPathKeys - Selected Postman request path keys (JSON index paths)
 * @param baseDocument - Optional existing OpenAPI document to check for collisions
 */
export const getCollidingPostmanRequestPathKeys = (
  itemRoot: unknown,
  selectedPathKeys: readonly string[],
  baseDocument?: OpenApiDocument,
): string[] => {
  const byMergeKey = new Map<string, string[]>()

  // Collect merge keys from the base document if provided
  const baseMergeKeys = baseDocument ? getOpenApiMergeKeys(baseDocument) : new Set<string>()

  for (const key of selectedPathKeys) {
    let path: number[]
    try {
      path = JSON.parse(key) as number[]
    } catch {
      continue
    }
    const leaf = getPostmanItemAtIndexPath(itemRoot, path)
    const mergeKey = getPostmanMergeKeys(leaf)
    if (mergeKey === undefined) {
      continue
    }

    const list = byMergeKey.get(mergeKey) ?? []
    list.push(key)
    byMergeKey.set(mergeKey, list)
  }

  const colliding: string[] = []
  for (const [mergeKey, keys] of byMergeKey.entries()) {
    // Collision if: multiple requests share the same merge key, OR any request collides with base
    if (keys.length > 1 || baseMergeKeys.has(mergeKey)) {
      colliding.push(...keys)
    }
  }
  return colliding
}
