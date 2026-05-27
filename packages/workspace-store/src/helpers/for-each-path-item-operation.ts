import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'

import { type NodeInput, getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'
import type { PathItemObject } from '@/schemas/v3.1/strict/path-item'

/**
 * Resolves a path item (or webhook path item), merging sibling properties alongside `$ref`.
 */
export const getResolvedPathItem = (
  pathItem: NodeInput<PathItemObject> | undefined,
): PathItemObject | undefined => {
  if (!pathItem || typeof pathItem !== 'object') {
    return undefined
  }

  return getResolvedRef(pathItem, mergeSiblingReferences)
}

/**
 * Returns an operation from a path item, resolving $ref wrappers on the path item first.
 */
export const getPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  method: HttpMethod,
): NodeInput<OperationObject> | undefined => {
  const resolvedPathItem = getResolvedPathItem(pathItem)
  if (!resolvedPathItem) {
    return undefined
  }

  return resolvedPathItem[method]
}

/**
 * Assigns an operation on a path item, including when the path item is a $ref wrapper.
 */
export const setPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  method: HttpMethod,
  operation: OperationObject,
): void => {
  if (!pathItem || typeof pathItem !== 'object') {
    return
  }

  if ('$ref' in pathItem && '$ref-value' in pathItem) {
    pathItem['$ref-value'][method] = operation
    return
  }

  pathItem[method] = operation
}

/**
 * Deletes an operation from a path item, including when the path item is a $ref wrapper.
 */
export const deletePathItemOperation = (pathItem: NodeInput<PathItemObject> | undefined, method: HttpMethod): void => {
  if (!pathItem || typeof pathItem !== 'object') {
    return
  }

  if ('$ref' in pathItem && '$ref-value' in pathItem) {
    delete pathItem['$ref-value'][method]
    return
  }

  delete pathItem[method]
}

/**
 * Invokes a callback for each HTTP method operation on a path item, resolving $ref wrappers first.
 */
export const forEachPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  callback: (method: HttpMethod, operation: NodeInput<OperationObject>) => void,
): void => {
  const resolvedPathItem = getResolvedPathItem(pathItem)
  if (!resolvedPathItem) {
    return
  }

  for (const [key, operation] of Object.entries(resolvedPathItem)) {
    if (!isHttpMethod(key) || operation === undefined) {
      continue
    }

    callback(key, operation as NodeInput<OperationObject>)
  }
}

/**
 * Returns whether a path item has any HTTP method operations after resolving $ref wrappers.
 */
export const pathItemHasOperations = (pathItem: NodeInput<PathItemObject> | undefined): boolean => {
  let hasOperation = false

  forEachPathItemOperation(pathItem, () => {
    hasOperation = true
  })

  return hasOperation
}
