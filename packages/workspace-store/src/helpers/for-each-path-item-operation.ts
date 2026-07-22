import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import { type NodeInput, getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'
import type { PathItemObject } from '@/schemas/v3.1/strict/path-item'

type PathItemOperationPointer = [method: string] | ['additionalOperations', method: string]

const fixedPathItemMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'query'] as const

type FixedPathItemMethod = (typeof fixedPathItemMethods)[number]

const isFixedPathItemMethod = (method: string): method is FixedPathItemMethod =>
  fixedPathItemMethods.includes(method.toLowerCase() as FixedPathItemMethod)

const getFixedMethod = (method: string): FixedPathItemMethod | undefined => {
  const normalized = method.toLowerCase()

  return isFixedPathItemMethod(normalized) ? normalized : undefined
}

const getAdditionalOperation = (pathItem: PathItemObject, method: string): NodeInput<OperationObject> | undefined =>
  pathItem.additionalOperations?.[method] ??
  pathItem.additionalOperations?.[method.toUpperCase()] ??
  pathItem.additionalOperations?.[method.toLowerCase()]

/**
 * Resolves a path item (or webhook path item), merging sibling properties alongside `$ref`.
 */
export const getResolvedPathItem = (pathItem: NodeInput<PathItemObject> | undefined): PathItemObject | undefined => {
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

  const fixedMethod = getFixedMethod(method)

  if (fixedMethod) {
    return resolvedPathItem[fixedMethod]
  }

  return getAdditionalOperation(resolvedPathItem, method)
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

  const fixedMethod = getFixedMethod(method)

  if ('$ref' in pathItem && '$ref-value' in pathItem) {
    const refValue = pathItem['$ref-value']
    if (refValue) {
      if (fixedMethod) {
        refValue[fixedMethod] = operation
      } else {
        refValue.additionalOperations = {
          ...refValue.additionalOperations,
          [method]: operation,
        }
      }
      return
    }
  }

  if (fixedMethod) {
    pathItem[fixedMethod] = operation
  } else {
    pathItem.additionalOperations = {
      ...pathItem.additionalOperations,
      [method]: operation,
    }
  }
}

/**
 * Deletes an operation from a path item, including when the path item is a $ref wrapper.
 */
export const deletePathItemOperation = (pathItem: NodeInput<PathItemObject> | undefined, method: HttpMethod): void => {
  if (!pathItem || typeof pathItem !== 'object') {
    return
  }

  const fixedMethod = getFixedMethod(method)

  // A $ref wrapper can carry the operation on its dereferenced value and/or as a sibling override
  // alongside the `$ref`. Since mergeSiblingReferences gives the sibling precedence, both copies
  // must be removed, otherwise getResolvedPathItem keeps exposing the operation after deletion.
  if ('$ref' in pathItem && '$ref-value' in pathItem) {
    const refValue = pathItem['$ref-value']
    if (refValue) {
      if (fixedMethod) {
        delete refValue[fixedMethod]
      } else {
        delete refValue.additionalOperations?.[method]
      }
    }
  }

  if (fixedMethod) {
    delete pathItem[fixedMethod]
  } else {
    delete pathItem.additionalOperations?.[method]
  }
}

/**
 * Invokes a callback for each HTTP method operation on a path item, resolving $ref wrappers first.
 */
export const forEachPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  callback: (method: HttpMethod, operation: NodeInput<OperationObject>, pointer: PathItemOperationPointer) => void,
): void => {
  const resolvedPathItem = getResolvedPathItem(pathItem)
  if (!resolvedPathItem) {
    return
  }

  for (const [key, operation] of Object.entries(resolvedPathItem)) {
    if (!isFixedPathItemMethod(key) || operation === undefined) {
      continue
    }

    callback(key, operation as NodeInput<OperationObject>, [key])
  }

  for (const [key, operation] of Object.entries(resolvedPathItem.additionalOperations ?? {})) {
    const fixedMethod = getFixedMethod(key)

    if ((fixedMethod && resolvedPathItem[fixedMethod]) || operation === undefined) {
      continue
    }

    callback(key, operation as NodeInput<OperationObject>, ['additionalOperations', key])
  }
}

/**
 * Returns whether a path item has no remaining keys after resolving $ref wrappers.
 *
 * Used when cleaning up after deleting an operation: a path entry is only removed once nothing is
 * left, so path-level metadata (`parameters`, `summary`, `servers`) and $ref wrappers are preserved
 * even when every HTTP method has been removed.
 */
export const pathItemIsEmpty = (pathItem: NodeInput<PathItemObject> | undefined): boolean => {
  const resolvedPathItem = getResolvedPathItem(pathItem)

  return !resolvedPathItem || Object.keys(resolvedPathItem).length === 0
}
