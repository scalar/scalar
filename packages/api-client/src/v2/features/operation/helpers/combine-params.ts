import { isDefined } from '@scalar/helpers/array/is-defined'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ParameterObject,
  PathItemObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Combine pathItem and operation parameters into a single, dereferenced parameter array */
export const combineParams = (
  pathParams: PathItemObject['parameters'] = [],
  operationParams: OperationObject['parameters'] = [],
): ParameterObject[] => {
  const allParams = [...pathParams, ...operationParams]
    .map((param) => getResolvedRef(param))
    // For unresolved params, coercion is going to generate a template object with an empty name, we don't want to include those
    .filter((e) => isDefined(e) && e.name)

  // Use a Map to ensure unique in+name combinations
  // Operation parameters take precedence over path parameters
  const uniqueParams = new Map<string, ParameterObject>()

  for (const param of allParams) {
    const key = `${param.in}:${param.name}`
    uniqueParams.set(key, param)
  }

  return Array.from(uniqueParams.values())
}
