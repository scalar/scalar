import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import { escapeJsonPointer } from '@scalar/json-magic/utils/escape-json-pointer'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { TraversedOperation } from '@/schemas/navigation'
import type { OpenApiDocument, OperationObject, TagObject } from '@/schemas/v3.1/strict/openapi-document'

import { getTag } from './get-tag'

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
  operation: OperationObject,
  method: string,
  path = 'Unknown',
  tag: TagObject,
  titlesMap: Map<string, string>,
  getOperationId: TraverseSpecOptions['getOperationId'],
): TraversedOperation => {
  const id = getOperationId({ ...operation, method, path }, tag)
  const title = operation.summary?.trim() ? operation.summary : path

  titlesMap.set(id, title)

  return {
    id,
    title,
    path,
    method,
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
  content: OpenApiDocument,
  /** Map of tags and their entries */
  tagsMap: TagsMap,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getOperationId: TraverseSpecOptions['getOperationId'],
) => {
  // Traverse paths
  Object.entries(content.paths ?? {}).forEach(([path, pathItemObject]) => {
    const pathKeys = objectKeys(pathItemObject ?? {}).filter((key) => isHttpMethod(key))

    pathKeys.forEach((method) => {
      const _operation = pathItemObject?.[method]
      const operation = getResolvedRef(_operation)
      if (!operation) {
        return
      }

      // Skip if the operation is internal or scalar-ignore
      if (operation['x-internal'] || operation['x-scalar-ignore'] || !isHttpMethod(method)) {
        return
      }

      const ref = `#/paths/${escapeJsonPointer(path)}/${method}`

      // Traverse tags
      if (operation.tags?.length) {
        operation.tags.forEach((tagName: string) => {
          const { tag } = getTag(tagsMap, tagName)
          tagsMap
            .get(tagName)
            ?.entries.push(createOperationEntry(ref, operation, method, path, tag, titlesMap, getOperationId))
        })
      }
      // Add to default tag
      else {
        const { tag } = getTag(tagsMap, 'default')
        tagsMap
          .get('default')
          ?.entries.push(createOperationEntry(ref, operation, method, path, tag, titlesMap, getOperationId))
      }
    })
  })
}
