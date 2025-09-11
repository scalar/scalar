import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectKeys } from '@scalar/helpers/object/object-keys'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isDeprecatedOperation } from '@/navigation/helpers/traverse-paths'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type {
  OpenApiDocument,
  TagObject,
  TraversedEntry,
  TraversedWebhook,
} from '@/schemas/v3.1/strict/openapi-document'

import { getTag } from './get-tag'

/** Creates a traversed webhook entry from an OpenAPI webhook object.
 *
 * @param ref - JSON pointer reference to the webhook in the OpenAPI document
 * @param method - HTTP method of the webhook
 * @param name - Name of the webhook, defaults to 'Unknown'
 * @param title - Title of the webhook, defaults to 'Unknown'
 * @param entitiesMap - Map to store webhook IDs and titles for mobile header navigation
 * @param getWebhookId - Function to generate unique IDs for webhooks
 * @param tag - Optional tag object associated with the webhook
 * @returns A traversed webhook entry with ID, title, name, method and reference
 */
const createWebhookEntry = (
  ref: string,
  method: string,
  name = 'Unknown',
  title = 'Unknown',
  entitiesMap: Map<string, TraversedEntry>,
  getWebhookId: TraverseSpecOptions['getWebhookId'],
  tag?: TagObject,
  isDeprecated?: boolean,
): TraversedWebhook => {
  const id = getWebhookId({ name, method }, tag)

  const entry = {
    id,
    title,
    name,
    ref,
    method: method,
    type: 'webhook',
    isDeprecated,
  } satisfies TraversedWebhook

  // Store the id to the entity for fast lookup
  entitiesMap.set(id, entry)

  return entry
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
 * @param entitiesMap - Map to store webhook IDs and titles for mobile header navigation
 * @param getWebhookId - Function to generate unique IDs for webhooks
 * @returns Array of untagged webhook entries
 */
export const traverseWebhooks = (
  content: OpenApiDocument,
  /** The tag map from from traversing paths */
  tagsMap: TagsMap,
  /** Map of titles for the mobile title */
  entitiesMap: Map<string, TraversedEntry>,
  getWebhookId: TraverseSpecOptions['getWebhookId'],
): TraversedWebhook[] => {
  const untagged: TraversedWebhook[] = []

  // Traverse webhooks
  Object.entries(content.webhooks ?? {}).forEach(([name, pathItemObject]) => {
    const pathKeys = objectKeys(pathItemObject ?? {}).filter((key) => isHttpMethod(key))

    pathKeys.forEach((method) => {
      const _operation = pathItemObject?.[method]
      const operation = getResolvedRef(_operation)
      if (!operation) {
        return
      }

      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore']) {
        return
      }

      const ref = `#/webhooks/${name}/${method}`

      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          const { tag } = getTag(tagsMap, tagName)
          tagsMap
            .get(tagName)
            ?.entries.push(
              createWebhookEntry(
                ref,
                method,
                name,
                operation.summary ?? name,
                entitiesMap,
                getWebhookId,
                tag,
                isDeprecatedOperation(operation),
              ),
            )
        })
      }
      // Add to untagged
      else {
        untagged.push(
          createWebhookEntry(
            ref,
            method,
            name,
            operation.summary ?? name,
            entitiesMap,
            getWebhookId,
            undefined,
            isDeprecatedOperation(operation),
          ),
        )
      }
    })
  })

  return untagged
}
