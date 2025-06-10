import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { getTag } from './get-tag'
import type { TraversedOperation, TraverseSpecOptions } from '@/schemas/traverse-schema/types'
import { escapeJsonPointer } from '@scalar/openapi-parser'

/**
 * Creates a traversed operation entry from an OpenAPI operation object.
 *
 * @param ref - JSON pointer reference to the operation in the OpenAPI document
 * @param operation - The OpenAPI operation object
 * @param method - HTTP method of the operation
 * @param path - API path of the operation, defaults to 'Unknown'
 * @param tag - Tag object associated with the operation
 * @param titlesMap - Map to store operation IDs and titles for mobile header navigation
 * @param getOperationId - Function to generate unique IDs for operations
 * @returns A traversed operation entry with ID, title, path, method and reference
 */
const createOperationEntry = (
  ref: string,
  operation: OpenAPIV3_1.OperationObject,
  method: OpenAPIV3_1.HttpMethods,
  path = 'Unknown',
  tag: OpenAPIV3_1.TagObject,
  titlesMap: Map<string, string>,
  getOperationId: TraverseSpecOptions['getOperationId'],
): TraversedOperation => {
  const id = getOperationId({ ...operation, method, path }, tag)
  titlesMap.set(id, operation.summary ?? path)

  return {
    id,
    title: operation.summary ?? path,
    path,
    method: method,
    ref,
    type: 'operation',
  }
}

/**
 * Traverses the paths in an OpenAPI document to build a map of operations organized by tags.
 *
 * This function processes each path and its operations to:
 * - Filter out internal operations (marked with x-internal) and operations to ignore (marked with x-scalar-ignore)
 * - Group operations by their tags
 * - Create a default tag group for untagged operations
 * - Generate unique references and IDs for each operation
 *
 * TODO: filter out internal and scalar-ignore tags
 *
 * @param content - The OpenAPI document to traverse
 * @param tagsDict - Dictionary mapping tag names to their OpenAPI tag objects
 * @param titlesMap - Map to store operation IDs and titles for mobile header navigation
 * @param getOperationId - Function to generate unique IDs for operations
 * @returns Map of tag names to arrays of traversed operations
 */
export const traversePaths = (
  content: OpenAPIV3_1.Document,
  /** Dictionary of tags from the spec */
  tagsDict: Map<string, OpenAPIV3_1.TagObject>,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getOperationId: TraverseSpecOptions['getOperationId'],
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

      const ref = `#/paths/${escapeJsonPointer(path)}/${method}`

      // Traverse tags
      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          if (!tagsMap.has(tagName)) {
            tagsMap.set(tagName, [])
          }
          const tag = getTag(tagsDict, tagName)
          tagsMap.get(tagName)?.push(createOperationEntry(ref, operation, method, path, tag, titlesMap, getOperationId))
        })
      }
      // Add to default tag
      else {
        const tag = getTag(tagsDict, 'default')
        tagsMap.get('default')?.push(createOperationEntry(ref, operation, method, path, tag, titlesMap, getOperationId))
      }
    })
  })

  return tagsMap
}
