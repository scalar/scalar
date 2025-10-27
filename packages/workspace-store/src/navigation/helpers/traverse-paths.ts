import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { traverseOperationExamples } from '@/navigation/helpers/traverse-examples'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import { XScalarStabilityValues } from '@/schemas/extensions/operation/x-scalar-stability'
import type { ParentTag, TraversedExample, TraversedOperation } from '@/schemas/navigation'
import type { OpenApiDocument, OperationObject } from '@/schemas/v3.1/strict/openapi-document'

import { getTag } from './get-tag'

export const isDeprecatedOperation = (operation: OperationObject) => {
  return operation.deprecated || operation['x-scalar-stability'] === XScalarStabilityValues.Deprecated
}

/**
 * Creates a traversed operation entry from an OpenAPI operation object.
 *
 * @param ref - JSON pointer reference to the operation in the OpenAPI document
 * @param operation - The OpenAPI operation object
 * @param method - HTTP method of the operation
 * @param path - API path of the operation, defaults to 'Unknown'
 * @param tag - Tag object associated with the operation
 * @param entitiesMap - Map to store operation IDs and titles for mobile header navigation
 * @param getOperationId - Function to generate unique IDs for operations
 * @returns A traversed operation entry with ID, title, path, method and reference
 */
const createOperationEntry = ({
  ref,
  operation,
  method,
  path,
  generateId,
  parentId,
  parentTag,
}: {
  ref: string
  operation: OperationObject
  method: HttpMethod
  path: string
  parentTag: ParentTag
  generateId: TraverseSpecOptions['generateId']
  parentId: string
}): TraversedOperation => {
  const id = generateId({
    type: 'operation',
    operation,
    parentTag,
    method: method,
    path: path,
    parentId: parentId,
  })
  const title = operation.summary?.trim() ? operation.summary : path

  const isDeprecated = isDeprecatedOperation(operation)

  const examples: TraversedExample[] = traverseOperationExamples(operation).map((example) => ({
    type: 'example',
    id: generateId({
      type: 'example',
      parentId: id,
      name: example,
    }),
    title: example,
    name: example,
  }))

  const entry = {
    id,
    title,
    path,
    method,
    ref,
    type: 'operation',
    isDeprecated,
    children: examples.length ? examples : undefined,
  } satisfies TraversedOperation

  return entry
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
 * @param entitiesMap - Map to store operation IDs and titles for mobile header navigation
 * @param getOperationId - Function to generate unique IDs for operations
 * @returns Map of tag names to arrays of traversed operations
 */
export const traversePaths = ({
  document,
  tagsMap,
  generateId,
  documentId,
}: {
  document: OpenApiDocument
  /** Map of tags and their entries */
  tagsMap: TagsMap
  /** Function used to generate unique IDs for operations */
  generateId: TraverseSpecOptions['generateId']
  /** Document ID */
  documentId: string
}) => {
  // Traverse paths
  Object.entries(document.paths ?? {}).forEach(([path, pathItemObject]) => {
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
          const { tag, id: tagId } = getTag({
            tagsMap,
            name: tagName,
            documentId,
            generateId,
          })
          tagsMap.get(tagName)?.entries.push(
            createOperationEntry({
              ref,
              operation,
              method,
              path,
              parentTag: { tag, id: tagId },
              generateId,
              parentId: tagId,
            }),
          )
        })
      }
      // Add to default tag
      else {
        const { tag, id: tagId } = getTag({
          tagsMap,
          name: 'default',
          documentId,
          generateId,
        })
        tagsMap.get('default')?.entries.push(
          createOperationEntry({
            ref,
            operation,
            method,
            path,
            parentTag: { tag, id: tagId },
            generateId,
            parentId: tagId,
          }),
        )
      }
    })
  })
}
