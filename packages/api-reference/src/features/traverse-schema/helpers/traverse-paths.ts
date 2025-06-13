import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { TraversedEntry, TraversedOperation } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import { getTag } from './get-tag'
import { httpMethods } from '@scalar/helpers/http/http-methods'

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

/**
 * Traverse the paths of the spec and build a map of tags and operations
 *
 * Default tag is to match what we have now we can improve later
 */
export const traversePaths = (
  content: OpenAPIV3_1.Document,
  /** Map of tags and their entries */
  tagsMap: Map<string, { tag: OpenAPIV3_1.TagObject; entries: TraversedEntry[] }>,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getOperationId: UseNavState['getOperationId'],
) => {
  // Traverse paths
  Object.entries(content.paths ?? {}).forEach(([path, pathItem]) => {
    const pathEntries = Object.entries(pathItem ?? {}) as [OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject][]

    // Traverse operations
    pathEntries.forEach(([method, operation]) => {
      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore'] || !httpMethods.has(method)) {
        return
      }

      // Traverse tags
      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          const { tag } = getTag(tagsMap, tagName)
          tagsMap
            .get(tagName)
            ?.entries.push(createOperationEntry(operation, method, path, tag, titlesMap, getOperationId))
        })
      }
      // Add to default tag
      else {
        const { tag } = getTag(tagsMap, 'default')
        tagsMap
          .get('default')
          ?.entries.push(createOperationEntry(operation, method, path, tag, titlesMap, getOperationId))
      }
    })
  })
}
