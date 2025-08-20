import { isDefined } from '@scalar/helpers/array/is-defined'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { OperationObject, PathItemObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'

/** Combine pathItem and operation parameters into a single, dereferenced parameter array */
export const combineParams = (
  pathParams: PathItemObject['parameters'] = [],
  operationParams: OperationObject['parameters'] = [],
): ParameterObject[] => {
  const allParams = [...pathParams, ...operationParams].map((param) => getResolvedRef(param)).filter(isDefined)

  // Use a Map to ensure unique in+name combinations
  // Operation parameters take precedence over path parameters
  const uniqueParams = new Map<string, ParameterObject>()

  for (const param of allParams) {
    const key = `${param.in}:${param.name}`
    uniqueParams.set(key, param)
  }

  return Array.from(uniqueParams.values())
}
