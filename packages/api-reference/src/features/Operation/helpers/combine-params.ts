import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { OperationObject, PathItemObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import { isResolvedRef, type Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'

/** Combine pathItem and operation parameters into a single, dereferenced parameter array */
export const combineParams = (
  pathParams: PathItemObject['parameters'] = [],
  operationParams: Dereference<OperationObject>['parameters'] = [],
): ParameterObject[] => {
  const allParams = [...pathParams, ...operationParams].filter(isResolvedRef<ParameterObject>)

  // Use a Map to ensure unique in+name combinations
  // Operation parameters take precedence over path parameters
  const uniqueParams = new Map<string, ParameterObject>()

  for (const param of allParams) {
    const key = `${param.in}:${param.name}`
    uniqueParams.set(key, param)
  }

  return Array.from(uniqueParams.values())
}
