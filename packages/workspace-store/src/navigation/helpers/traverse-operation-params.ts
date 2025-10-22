import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { TraverseSpecOptions } from '@/navigation/types'
import type { TraversedEntryParameter } from '@/schemas/navigation'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'

/**
 * Traverses the parameters of an OpenAPI operation, resolving any $ref if present on each parameter
 * and returning an array of navigation entries for each parameter.
 *
 * @param operation - The OpenAPI operation object to traverse.
 * @param generateId - Function to generate a unique ID for each parameter.
 * @param parentId - The parent navigation entry ID.
 * @returns An array of TraversedEntryParameter objects representing the operation parameters.
 */
export const traverseOperationParams = ({
  operation,
  generateId,
  parentId,
}: {
  operation: OperationObject
  generateId: TraverseSpecOptions['generateId']
  parentId: string
}) => {
  const result: TraversedEntryParameter[] = []
  const params = operation.parameters ?? []

  for (const param of params) {
    // Resolve the parameter in case it is a $ref
    const resolvedParam = getResolvedRef(param)

    result.push({
      type: 'parameter',
      id: generateId({
        type: 'parameter',
        parameter: resolvedParam,
        parentId,
      }),
      in: resolvedParam.in,
      name: resolvedParam.name,
      title: resolvedParam.name,
    })
  }

  return result
}
