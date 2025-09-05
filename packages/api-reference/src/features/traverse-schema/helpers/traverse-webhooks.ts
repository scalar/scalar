import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { TagsMap, TraversedWebhook } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OperationObject, TagObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getTag } from './get-tag'

/** Handles creating entries for webhooks */
const createWebhookEntry = (
  operation: OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  name = 'Unknown',
  titlesMap: Map<string, string>,
  getWebhookId: UseNavState['getWebhookId'],
  tag?: TagObject,
): TraversedWebhook => {
  const title = operation.summary || name
  const id = getWebhookId({ name, method }, tag)
  titlesMap.set(id, title)

  return {
    id,
    title,
    name,
    webhook: operation,
    method: method,
  }
}

/** When traversing webhooks, we pass in the tags in from operations to save on memory */
export const traverseWebhooks = (
  content: OpenAPIV3_1.Document,
  /** The tag map from from traversing paths */
  tagsMap: TagsMap,
  /** Map of titles for the mobile title */
  titlesMap: Map<string, string>,
  getWebhookId: UseNavState['getWebhookId'],
): TraversedWebhook[] => {
  const untagged: TraversedWebhook[] = []

  // Traverse webhooks
  Object.entries(content.webhooks ?? {}).forEach(([name, pathItemObject]) => {
    const pathEntries = Object.entries(pathItemObject ?? {}) as [OpenAPIV3_1.HttpMethods, OperationObject][]

    pathEntries.forEach(([method, operation]) => {
      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore']) {
        return
      }

      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          const { tag } = getTag(tagsMap, tagName)

          tagsMap.get(tagName)?.entries.push(createWebhookEntry(operation, method, name, titlesMap, getWebhookId, tag))
        })
      }
      // Add to untagged
      else {
        untagged.push(createWebhookEntry(operation, method, name, titlesMap, getWebhookId))
      }
    })
  })

  return untagged
}
