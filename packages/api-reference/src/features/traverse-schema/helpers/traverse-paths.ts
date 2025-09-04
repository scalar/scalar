import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { TraversedEntry, TraversedOperation } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import { httpMethods } from '@scalar/helpers/http/http-methods'
import type { OperationObject, TagObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getTag } from './get-tag'

const createOperationEntry = (
  operation: OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  path = 'Unknown',
  tag: TagObject,
  titlesMap: Map<string, string>,
  getOperationId: UseNavState['getOperationId'],
): TraversedOperation => {
  const id = getOperationId({ ...operation, method, path }, tag)
  const title = operation.summary?.trim() ? operation.summary : path

  titlesMap.set(id, title)

  return {
    id,
    title,
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
  tagsMap: Map<string, { tag: TagObject; entries: TraversedEntry[] }>,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getOperationId: UseNavState['getOperationId'],
) => {
  // Traverse paths
  Object.entries(content.paths ?? {}).forEach(([path, pathItem]) => {
    const pathEntries = Object.entries(pathItem ?? {}) as [OpenAPIV3_1.HttpMethods, OperationObject][]

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
