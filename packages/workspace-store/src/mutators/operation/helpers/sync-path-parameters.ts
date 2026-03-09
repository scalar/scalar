import { findVariables } from '@scalar/helpers/regex/find-variables'

import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { getParameterPositions } from '@/mutators/operation/helpers/get-parameter-position'
import type { ParameterObject } from '@/schemas/v3.1/strict/parameter'
import type { ReferenceType } from '@/schemas/v3.1/strict/reference'

// We use a minimal parameter object becuase we use this function during bundling and we don't want to prevalidate the parameters
export type MinimalParameterObject = Pick<ParameterObject, 'name' | 'in'>

/**
 * Synchronizes path parameters when a path string changes.
 *
 * Behavior:
 * - Preserves as much of the existing parameter configuration as possible when the set of path variables
 *   changes due to a path update.
 * - If a parameter with the same name exists in the new path, its configuration is preserved in place.
 * - If a parameter appears at the same position as an old parameter (name changed), the old parameter's
 *   configuration is kept and its name is updated in place.
 * - Any newly required parameters (variables present in the new path but not in the old path) are appended
 *   as new minimal parameter objects.
 * - Parameters that are no longer present in the new path are dropped.
 *
 * ⚠️ This function mutates parameter objects in the `existingParameters` array in place
 *     (i.e., reused objects may have their `name` updated).
 *
 * Only parameters that did not previously exist are returned (i.e., newly created parameters).
 * To get the correct full parameters array for your operation, combine the possibly-mutated
 * `existingParameters` with the result of this function, for example:
 *
 * @example
 * ```ts
 * // Given:
 * // - oldPath: '/users/{userId}'
 * // - newPath: '/users/{id}/posts/{postId}'
 * // - existingParameters: [ { name: 'userId', in: 'path' } ]
 *
 * const extraParams = syncParametersForPathChange(
 *   '/users/{id}/posts/{postId}',
 *   '/users/{userId}',
 *   existingParameters
 * )
 *
 * // At this point:
 * // - existingParameters[0].name === 'id'   // was mutated in place (renamed)
 * // - extraParams === [ { name: 'postId', in: 'path' } ]
 *
 * const finalParams = [
 *   ...existingParameters, // (now with 'id')
 *   ...extraParams         // 'postId'
 * ]
 * // Use `finalParams` as your new operation.parameters
 * ```
 */
export const syncParametersForPathChange = <T extends MinimalParameterObject>(
  newPath: string,
  oldPath: string,
  existingParameters: ReferenceType<T>[],
  resolve: (node: ReferenceType<T>) => MinimalParameterObject,
): ReferenceType<T>[] => {
  // Extract path parameter names from both paths
  const oldPathParams = findVariables(oldPath, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )
  const newPathParams = findVariables(newPath, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )

  const oldPositions = getParameterPositions(oldPath, oldPathParams)
  const newPositions = getParameterPositions(newPath, newPathParams)

  // Keep a map of path parameters by name for quick lookup (references unchanged objects)
  const pathParameters: Record<string, ReferenceType<T>> = {}

  // Populate the map with the existing path parameters
  for (const param of existingParameters) {
    const resolved = resolve(param)
    if (resolved?.in === 'path') {
      pathParameters[resolved.name] = param
    }
  }

  // Keep track of old parameters that we have already used
  const usedOldParams = new Set<string>()
  // Keep track of path parameter objects we keep after sync
  const usedPathParameters = new Set<ReferenceType<T>>()
  // These are only truly new parameters created in this run
  const newPathParameters: T[] = []

  for (const newParamName of newPathParams) {
    // Case 1: Parameter with same name exists - preserve its config, and mark as used
    if (pathParameters[newParamName]) {
      usedOldParams.add(newParamName)
      usedPathParameters.add(pathParameters[newParamName])
      continue
    }

    // Case 2: Check for parameter at same position (likely a rename)
    const newParamPosition = newPositions[newParamName]
    const oldParamAtPosition = oldPathParams.find(
      (oldParam) => oldPositions[oldParam] === newParamPosition && !usedOldParams.has(oldParam),
    )

    // If found, mutate old parameter's name and mark as used
    if (oldParamAtPosition && pathParameters[oldParamAtPosition] !== undefined) {
      const oldParam = pathParameters[oldParamAtPosition]
      if (oldParam) {
        // Change its name in-place
        resolve(oldParam).name = newParamName
        usedPathParameters.add(oldParam)
      }
      usedOldParams.add(oldParamAtPosition)
      continue
    }

    // Case 3: New parameter - create a new minimal parameter object
    newPathParameters.push({
      in: 'path',
      name: newParamName,
    } as T)
  }

  const result: ReferenceType<T>[] = []

  // Push the raw parameters to enure we are not pushing proxies
  for (const param of existingParameters) {
    const resolved = resolve(param)
    const rawParam = unpackProxyObject(param, { depth: 1 })
    if (resolved?.in !== 'path') {
      result.push(rawParam)
    }

    // Only adda the parameter if HAS not been used in the old path
    // This we we ensure to drop parameters that are no longer present in the new path
    if (usedPathParameters.has(param)) {
      result.push(rawParam)
    }
  }

  // Only return newly created parameter objects—call site should combine with possibly-mutated originals
  return result.concat(newPathParameters)
}
