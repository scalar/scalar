import type { SidebarEntry } from '@/hooks/useSidebar'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

type TraversedResults = { tagged: Map<string, SidebarEntry[]>; untagged: SidebarEntry[] }

/** Handles creating entries for operations */
// TODO: do we want to nest callbacks under the operation object?
const createOperationEntry = (
  operation: OpenAPIV3_1.OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  path = 'Unknown',
): SidebarEntry => ({
  title: operation.summary ?? path,
  method: method,
  deprecated: operation.deprecated ?? false,
})

/** Traverse the paths of the spec and build a map of tags and operations */
export const traversePaths = (content: OpenAPIV3_1.Document): TraversedResults => {
  const tagMap = new Map<string, SidebarEntry[]>()
  const untagged: SidebarEntry[] = []

  // Traverse paths
  Object.entries(content.paths ?? {}).forEach(([path, pathItem]) => {
    const pathEntries = Object.entries(pathItem ?? {}) as [OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject][]

    // Traverse operations
    pathEntries.forEach(([method, operation]) => {
      // Traverse tags
      if (operation.tags?.length) {
        operation.tags.forEach((tag: string) => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, [])
          }

          tagMap.get(tag)?.push(createOperationEntry(operation, method, path))
        })
      }
      // Add to untagged
      else {
        untagged.push(createOperationEntry(operation, method, path))
      }
    })
  })

  return { tagged: tagMap, untagged }
}

/** Handles creating entries for webhooks */
const createWebhookEntry = (
  operation: OpenAPIV3_1.OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  title = 'Unknown',
): SidebarEntry => ({
  title,
  method: method,
  deprecated: operation.deprecated ?? false,
})

/** When traversing webhooks, we pass in the tags in from operations to save on memory */
const traverseWebhooks = (content: OpenAPIV3_1.Document, tagMap: Map<string, SidebarEntry[]>): TraversedResults => {
  const untagged: SidebarEntry[] = []

  // Traverse webhooks
  Object.entries(content.webhooks ?? {}).forEach(([name, pathItemObject]) => {
    const pathEntries = Object.entries(pathItemObject ?? {}) as [OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject][]

    pathEntries.forEach(([method, operation]) => {
      if (operation.tags?.length) {
        operation.tags.forEach((tag: string) => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, [])
          }

          tagMap.get(tag)?.push(createWebhookEntry(operation, method, name))
        })
      }
      // Add to untagged
      else {
        untagged.push(createWebhookEntry(operation, method, name))
      }
    })
  })

  return { tagged: tagMap, untagged }
}

/** Handles creating entries for schemas */
const createSchemaEntry = (schema: OpenAPIV3_1.SchemaObject, title = 'Unknown'): SidebarEntry => ({
  title,
  deprecated: false,
})

const traverseSchemas = (content: OpenAPIV3_1.Document): SidebarEntry[] => {
  const schemas = content.components?.schemas ?? {}
  const untagged: SidebarEntry[] = []

  // For loop has over 2x the performance of forEach here
  for (const name in schemas) {
    untagged.push(createSchemaEntry(schemas[name], name))
  }

  return untagged
}

/**
 * Exploring creating the sidebar with only one traversal of the spec
 *
 * We do some irregular things here such as passing the same map and array around to save on performance
 * */
export const createSidebarAmrit = (content: OpenAPIV3_1.Document) => {
  // Traverse info

  const operations = traversePaths(content)
  const webhooks = traverseWebhooks(content, operations.tagged)
  const schemas = traverseSchemas(content)

  /** Map of all tags built from operations + webhooks */

  return { operations, webhooks, schemas }
}
