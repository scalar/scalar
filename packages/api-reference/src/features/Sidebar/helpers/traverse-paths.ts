import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

// TODO: do we want to nest callbacks under the operation object?
const createOperationEntry = (
  operation: OpenAPIV3_1.OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  path = 'Unknown',
  tag: OpenAPIV3_1.TagObject,
  getOperationId: UseNavState['getOperationId'],
): SidebarEntry => ({
  id: getOperationId({ ...operation, method, path }, tag),
  title: operation.summary ?? path,
  httpVerb: method,
  deprecated: operation.deprecated ?? false,
})

const defaultTag = { name: 'default' }

/**
 * Traverse the paths of the spec and build a map of tags and operations
 *
 * Default tag is to match what we have now we can improve later
 * TODO: filter out internal and scalar-ignore tags
 */
export const traversePaths = (
  content: OpenAPIV3_1.Document,
  /** The tag dictionary of tags from the spec */
  tagsDict: Record<string, OpenAPIV3_1.TagObject>,
  getOperationId: UseNavState['getOperationId'],
): Map<string, SidebarEntry[]> => {
  const tagMap = new Map<string, SidebarEntry[]>([['default', []]])

  // Traverse paths
  Object.entries(content.paths ?? {}).forEach(([path, pathItem]) => {
    const pathEntries = Object.entries(pathItem ?? {}) as [OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject][]

    // Traverse operations
    pathEntries.forEach(([method, operation]) => {
      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore']) {
        return
      }

      // Traverse tags
      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          if (!tagMap.has(tagName)) {
            tagMap.set(tagName, [])
          }

          // Ensure the tag exists in the spec
          const tag = tagsDict[tagName]
          if (tag) {
            tagMap.get(tagName)?.push(createOperationEntry(operation, method, path, tag, getOperationId))
          }
          // We push to default
          else {
            console.warn(`
              Tag ${tagName} not found in the schema, please ensure it is defined in the tags array.
              
              https://spec.openapis.org/oas/latest.html#tag-object
              `)
            tagMap.get('default')?.push(createOperationEntry(operation, method, path, defaultTag, getOperationId))
          }
        })
      }
      // Add to default tag
      else {
        tagMap.get('default')?.push(createOperationEntry(operation, method, path, defaultTag, getOperationId))
      }
    })
  })

  return tagMap
}
