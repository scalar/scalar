import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectKeys } from '@scalar/helpers/object/object-keys'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isDeprecatedOperation } from '@/navigation/helpers/traverse-paths'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { ParentTag, TraversedWebhook } from '@/schemas/navigation'
import type { OpenApiDocument, OperationObject, TagObject } from '@/schemas/v3.1/strict/openapi-document'

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
const createWebhookEntry = ({
  ref,
  method,
  name,
  title,
  generateId,
  parentTag,
  webhook,
  isDeprecated,
  parentId,
}: {
  ref: string
  method: HttpMethod
  webhook: OperationObject
  name: string
  title: string
  generateId: TraverseSpecOptions['generateId']
  tag?: TagObject
  parentId: string
  parentTag?: ParentTag
  isDeprecated?: boolean
}): TraversedWebhook => {
  const id = generateId({
    type: 'webhook',
    name,
    method,
    webhook: webhook,
    parentTag,
    parentId: parentId,
  })

  const entry = {
    id,
    title,
    name,
    ref,
    method: method,
    type: 'webhook',
    isDeprecated,
  } satisfies TraversedWebhook

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
export const traverseWebhooks = ({
  document,
  tagsMap,
  generateId,
  untaggedWebhooksParentId,
  documentId,
}: {
  /** Openapi document */
  document: OpenApiDocument
  /** The tag map from from traversing paths */
  tagsMap: TagsMap
  generateId: TraverseSpecOptions['generateId']
  untaggedWebhooksParentId: string
  documentId: string
}): TraversedWebhook[] => {
  const untagged: TraversedWebhook[] = []

  // Traverse webhooks
  Object.entries(document.webhooks ?? {}).forEach(([name, pathItemObject]) => {
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
          const { tag, id: tagId } = getTag({ tagsMap, name: tagName, documentId, generateId })
          tagsMap.get(tagName)?.entries.push(
            createWebhookEntry({
              ref,
              method,
              name,
              title: operation.summary ?? name,
              webhook: operation,
              generateId: generateId,
              parentTag: { tag, id: tagId },
              parentId: tagId,
              isDeprecated: isDeprecatedOperation(operation),
            }),
          )
        })
      }
      // Add to untagged
      else {
        untagged.push(
          createWebhookEntry({
            ref,
            method,
            name,
            title: operation.summary ?? name,
            generateId,
            isDeprecated: isDeprecatedOperation(operation),
            webhook: operation,
            parentId: untaggedWebhooksParentId,
          }),
        )
      }
    })
  })

  return untagged
}
