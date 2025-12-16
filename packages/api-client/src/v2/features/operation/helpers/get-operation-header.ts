import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'

/**
 * Retrieves a parameter from an operation's parameters by name and type ('in').
 * This is typically used to find a particular header, query, path, or cookie parameter.
 *
 * @param operation - The operation object containing the parameters array.
 * @param name - The name of the parameter to search for (case-insensitive).
 * @param type - The parameter location (e.g., 'header', 'query', 'path', 'cookie').
 * @returns The found parameter object, or null if not found.
 */
export const getOperationHeader = ({
  operation,
  name,
  type,
}: {
  operation: OperationObject
  name: string
  type: ParameterObject['in']
}) => {
  return (
    operation.parameters?.find((param) => {
      const resolvedParam = getResolvedRef(param)
      return resolvedParam.in === type && resolvedParam.name.toLowerCase() === name.toLowerCase()
    }) ?? null
  )
}
