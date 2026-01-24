import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject, PathItemObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Combine pathItem and operation parameters into a single, dereferenced parameter array */
export const combineParams = (
  pathParams: PathItemObject['parameters'] = [],
  operationParams: OperationObject['parameters'] = [],
): OperationObject['parameters'] => {
  const operationKeys = operationParams.flatMap((unresolvedParam) => {
    const param = getResolvedRef(unresolvedParam)
    if (!param) {
      return []
    }

    return `${param.in}:${param.name}`
  })
  const operationSet = new Set<string>(operationKeys)

  /** We must ensure we do not include any path params which exist in the operation */
  const filteredPathParams = pathParams.filter((unresolvedParam) => {
    const param = getResolvedRef(unresolvedParam)
    if (!param) {
      return false
    }
    return !operationSet.has(`${param.in}:${param.name}`)
  })

  return [...filteredPathParams, ...operationParams]
}
