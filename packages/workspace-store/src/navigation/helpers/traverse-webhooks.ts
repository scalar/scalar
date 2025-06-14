import { getTag } from './get-tag'
import type { TagsMap, TraversedWebhook, TraverseSpecOptions } from '@/navigation/types'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@/schemas/v3.1/strict/path-operations'
import type { TagObject } from '@/schemas/v3.1/strict/tag'
import { isReference } from '@/schemas/v3.1/type-guard'

/** Creates a traversed webhook entry from an OpenAPI webhook object.
 *
 * @param ref - JSON pointer reference to the webhook in the OpenAPI document
 * @param method - HTTP method of the webhook
 * @param name - Name of the webhook, defaults to 'Unknown'
 * @param title - Title of the webhook, defaults to 'Unknown'
 * @param titlesMap - Map to store webhook IDs and titles for mobile header navigation
 * @param getWebhookId - Function to generate unique IDs for webhooks
 * @param tag - Optional tag object associated with the webhook
 * @returns A traversed webhook entry with ID, title, name, method and reference
 */
const createWebhookEntry = (
  ref: string,
  method: string,
  name = 'Unknown',
  title = 'Unknown',
  titlesMap: Map<string, string>,
  getWebhookId: TraverseSpecOptions['getWebhookId'],
  tag?: TagObject,
): TraversedWebhook => {
  const id = getWebhookId({ name, method }, tag)
  titlesMap.set(id, title)

  return {
    id,
    title,
    name,
    ref,
    method: method,
    type: 'webhook',
  }
}

/** Traverses the webhooks in an OpenAPI document to build an array of webhook entries.
 *
 * This function processes each webhook in the document to:
 * - Filter out internal webhooks (marked with x-internal) and webhooks to ignore (marked with x-scalar-ignore)
 * - Group webhooks by their tags
 * - Create webhook entries with unique references and IDs
 * - Store webhook IDs and titles for mobile header navigation
 *
 * @param content - The OpenAPI document to traverse
 * @param tagsMap - Map of tag names to arrays of traversed entries from operations
 * @param tagsDict - Dictionary mapping tag names to their OpenAPI tag objects
 * @param titlesMap - Map to store webhook IDs and titles for mobile header navigation
 * @param getWebhookId - Function to generate unique IDs for webhooks
 * @returns Array of untagged webhook entries
 */
export const traverseWebhooks = (
  content: OpenApiDocument,
  /** The tag map from from traversing paths */
  tagsMap: TagsMap,
  /** Map of titles for the mobile title */
  titlesMap: Map<string, string>,
  getWebhookId: TraverseSpecOptions['getWebhookId'],
): TraversedWebhook[] => {
  const untagged: TraversedWebhook[] = []

  // Traverse webhooks
  Object.entries(content.webhooks ?? {}).forEach(([name, pathItemObject]) => {
    const pathEntries = Object.entries(pathItemObject ?? {}) as [string, OperationObject][]

    pathEntries.forEach(([method, operation]) => {
      if (isReference(operation)) {
        return
      }

      const ref = `#/webhooks/${name}/${method}`

      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore']) {
        return
      }

      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          const { tag } = getTag(tagsMap, tagName)
          tagsMap
            .get(tagName)
            ?.entries.push(
              createWebhookEntry(ref, method, name, operation.summary ?? name, titlesMap, getWebhookId, tag),
            )
        })
      }
      // Add to untagged
      else {
        untagged.push(createWebhookEntry(ref, method, name, operation.summary ?? name, titlesMap, getWebhookId))
      }
    })
  })

  return untagged
}
