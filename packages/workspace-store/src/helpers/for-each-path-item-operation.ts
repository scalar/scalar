import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObjectLike } from '@scalar/helpers/object/is-object'
import { preventPollution } from '@scalar/helpers/object/prevent-pollution'
import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'

import { type NodeInput, getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import type { OperationObject } from '@/schemas/v3.2/strict/operation'
import type { PathItemObject } from '@/schemas/v3.2/strict/path-item'

/**
 * How many `$ref` hops to follow before treating a chain as circular.
 *
 * Real documents chain two or three deep at the very most, so anything past this is a reference
 * cycle rather than a deep chain, and following it would never terminate.
 */
const MAX_REF_HOPS = 10

/** Fixed OpenAPI fields use lowercase keys; mixed-case wire methods belong in additionalOperations. */
const isFixedOperationKey = (method: string): method is HttpMethod =>
  method === method.toLowerCase() && isHttpMethod(method)

/**
 * Whether a merged path item still carries an unfollowed hop.
 *
 * `mergeSiblingReferences` spreads the resolved target over the siblings. When that target is itself
 * a reference, the spread carries its `$ref-value` across as a real key, which is the signal that
 * one more hop is waiting. A fully resolved path item never has one: the `$ref` sibling is kept (it
 * is what the author wrote) but nothing resolves through it any more.
 */
const hasUnfollowedRef = (pathItem: PathItemObject | undefined): boolean =>
  isObjectLike(pathItem) && Object.hasOwn(pathItem, '$ref-value')

/**
 * Resolves a path item (or webhook path item), merging sibling properties alongside `$ref`.
 *
 * References are followed through chains, not just one hop. Bundling a split-file document does not
 * inline its external references — it moves each target into the `x-ext` bucket and rewrites the
 * reference to point there — so a file that is itself only a `$ref` to another file bundles into a
 * bucket entry holding a `$ref` to a second bucket entry. Stopping after one hop leaves that path
 * item unresolved, and its operations reach neither the sidebar nor the generated chunks.
 */
export const getResolvedPathItem = (pathItem: NodeInput<PathItemObject> | undefined): PathItemObject | undefined => {
  if (!pathItem || typeof pathItem !== 'object') {
    return undefined
  }

  let resolved = getResolvedRef(pathItem, mergeSiblingReferences)

  // `hop` counts resolutions already performed, the one above included, so the cap is the total.
  for (let hop = 1; hasUnfollowedRef(resolved); hop++) {
    if (hop >= MAX_REF_HOPS) {
      // Give up rather than spin, and drop the hop that was never followed: `$ref-value` is meant to
      // be virtual, so leaving a real one behind would serialize the half-resolved target into the
      // stored document.
      //
      // Copied rather than deleted from, so resolving stays free of side effects. A caller reaches
      // this with `document.paths[somePath]`, and a document is free to name a path `__proto__` —
      // which makes that lookup `Object.prototype`. Mutating whatever arrives is not worth the risk
      // when dropping a key costs a destructure.
      const { '$ref-value': _unfollowed, ...withoutUnfollowedRef }: Record<string, unknown> = resolved

      console.warn(
        `Stopped resolving "${resolved.$ref}" after ${MAX_REF_HOPS} hops.\n\nThis reference most likely points at itself, directly or through another reference.`,
      )

      return withoutUnfollowedRef
    }

    resolved = getResolvedRef(resolved, mergeSiblingReferences)
  }

  return resolved
}

/**
 * Returns an operation from a path item, resolving $ref wrappers on the path item first.
 */
export const getPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  method: string,
): NodeInput<OperationObject> | undefined => {
  const resolvedPathItem = getResolvedPathItem(pathItem)
  if (!resolvedPathItem) {
    return undefined
  }

  if (isFixedOperationKey(method)) {
    return resolvedPathItem[method]
  }
  const operations = resolvedPathItem.additionalOperations
  return operations && Object.hasOwn(operations, method) ? operations[method] : undefined
}

/**
 * Assigns an operation on a path item, including when the path item is a $ref wrapper.
 */
export const setPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  method: string,
  operation: OperationObject,
): void => {
  if (!pathItem || typeof pathItem !== 'object') {
    return
  }

  const target = '$ref' in pathItem && '$ref-value' in pathItem ? (pathItem['$ref-value'] ?? pathItem) : pathItem

  if (isFixedOperationKey(method)) {
    target[method] = operation
  } else {
    preventPollution(method)
    target.additionalOperations ??= {}
    target.additionalOperations[method] = operation
  }
}

/**
 * Every node a path item's operations can live on, following the `$ref` chain.
 *
 * A reference can carry an operation on its dereferenced value and as a sibling override alongside
 * the `$ref`, at any depth, and `getResolvedPathItem` merges all of them. Anything that writes to a
 * path item therefore has to see the same set of nodes that reading it does.
 */
const pathItemRefChain = (pathItem: NodeInput<PathItemObject>): Record<string, unknown>[] => {
  const chain: Record<string, unknown>[] = []
  let node: unknown = pathItem

  while (isObjectLike(node) && !chain.includes(node) && chain.length < MAX_REF_HOPS) {
    chain.push(node)

    if (!('$ref' in node) || !('$ref-value' in node)) {
      break
    }

    node = node['$ref-value']
  }

  return chain
}

/**
 * Deletes an operation from a path item, including when the path item is a $ref wrapper.
 *
 * Every hop is cleared, not just the first. `getResolvedPathItem` resolves through chains — which
 * bundling a split-file document produces — and gives a sibling precedence over the value it
 * resolves to, so a copy left anywhere along the chain keeps surfacing after the delete.
 */
export const deletePathItemOperation = (pathItem: NodeInput<PathItemObject> | undefined, method: string): void => {
  if (!pathItem || typeof pathItem !== 'object') {
    return
  }

  for (const node of pathItemRefChain(pathItem)) {
    if (isFixedOperationKey(method)) {
      delete node[method]
    } else if (isObjectLike(node.additionalOperations)) {
      delete node.additionalOperations[method]
      if (Object.keys(node.additionalOperations).length === 0) {
        delete node.additionalOperations
      }
    }
  }
}

/**
 * Invokes a callback for each HTTP method operation on a path item, resolving $ref wrappers first.
 */
export const forEachPathItemOperation = (
  pathItem: NodeInput<PathItemObject> | undefined,
  callback: (method: string, operation: NodeInput<OperationObject>) => void,
): void => {
  const resolvedPathItem = getResolvedPathItem(pathItem)
  if (!resolvedPathItem) {
    return
  }

  for (const [key, operation] of Object.entries(resolvedPathItem)) {
    if (!isFixedOperationKey(key) || operation === undefined) {
      continue
    }

    callback(key, operation as NodeInput<OperationObject>)
  }

  for (const [method, operation] of Object.entries(resolvedPathItem.additionalOperations ?? {})) {
    if (
      operation !== undefined &&
      !isFixedOperationKey(method) &&
      !(method === method.toUpperCase() && isHttpMethod(method))
    ) {
      callback(method, operation)
    }
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

/** JSON pointer suffix for an operation within its Path Item Object. */
export const getPathItemOperationKey = (method: string): string =>
  isFixedOperationKey(method) ? method : `additionalOperations/${escapeJsonPointer(method)}`
