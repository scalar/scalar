import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Handles creating entries for webhooks */
const createWebhookEntry = (
  operation: OpenAPIV3_1.OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  name = 'Unknown',
  getWebhookId: UseNavState['getWebhookId'],
  tag?: OpenAPIV3_1.TagObject,
): SidebarEntry => ({
  id: getWebhookId({ name, method }, tag),
  title: name,
  httpVerb: method,
  deprecated: operation.deprecated ?? false,
})

/** When traversing webhooks, we pass in the tags in from operations to save on memory */
export const traverseWebhooks = (
  content: OpenAPIV3_1.Document,
  /** The tag map from from traversing paths */
  tagsMap: Map<string, SidebarEntry[]>,
  /** The tag dictionary of tags from the spec */
  tagsDict: Record<string, OpenAPIV3_1.TagObject>,
  getWebhookId: UseNavState['getWebhookId'],
): SidebarEntry[] => {
  const untagged: SidebarEntry[] = []

  // Traverse webhooks
  Object.entries(content.webhooks ?? {}).forEach(([name, pathItemObject]) => {
    const pathEntries = Object.entries(pathItemObject ?? {}) as [OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject][]

    pathEntries.forEach(([method, operation]) => {
      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore']) {
        return
      }

      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          if (!tagsMap.has(tagName)) {
            tagsMap.set(tagName, [])
          }

          // Ensure the tag exists in the spec
          const tag = tagsDict[tagName]
          if (tag) {
            tagsMap.get(tagName)?.push(createWebhookEntry(operation, method, name, getWebhookId, tag))
          }

          // Push to untagged
          else {
            console.warn(`
              Tag ${tagName} not found in the schema, please ensure it is defined in the tags array.
              
              https://spec.openapis.org/oas/latest.html#tag-object
              `)
            untagged.push(createWebhookEntry(operation, method, name, getWebhookId))
          }
        })
      }
      // Add to untagged
      else {
        untagged.push(createWebhookEntry(operation, method, name, getWebhookId))
      }
    })
  })

  return untagged
}
