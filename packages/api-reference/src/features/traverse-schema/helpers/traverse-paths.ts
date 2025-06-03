import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { TraversedOperation } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import { getTag } from './get-tag'

const createOperationEntry = (
  operation: OpenAPIV3_1.OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  path = 'Unknown',
  tag: OpenAPIV3_1.TagObject,
  titlesMap: Map<string, string>,
  getOperationId: UseNavState['getOperationId'],
): TraversedOperation => {
  const id = getOperationId({ ...operation, method, path }, tag)
  titlesMap.set(id, operation.summary ?? path)

  return {
    id,
    title: operation.summary ?? path,
    path,
    method: method,
    operation,
  }
}

const defaultTag = { name: 'default' }

/**
 * Traverse the paths of the spec and build a map of tags and operations
 *
 * Default tag is to match what we have now we can improve later
 * TODO: filter out internal and scalar-ignore tags
 */
export const traversePaths = (
  content: OpenAPIV3_1.Document,
  /** Dictionary of tags from the spec */
  tagsDict: Map<string, OpenAPIV3_1.TagObject>,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getOperationId: UseNavState['getOperationId'],
): Map<string, TraversedOperation[]> => {
  const tagsMap = new Map<string, TraversedOperation[]>([['default', []]])

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
          if (!tagsMap.has(tagName)) {
            tagsMap.set(tagName, [])
          }
          const tag = getTag(tagsDict, tagName)
          tagsMap.get(tagName)?.push(createOperationEntry(operation, method, path, tag, titlesMap, getOperationId))
        })
      }
      // Add to default tag
      else {
        tagsMap
          .get('default')
          ?.push(createOperationEntry(operation, method, path, defaultTag, titlesMap, getOperationId))
      }
    })
  })

  return tagsMap
}
