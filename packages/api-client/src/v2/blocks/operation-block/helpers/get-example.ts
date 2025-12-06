import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Grabs the example from both schema based and content based parameters */
export const getExample = (param: ParameterObject, exampleKey: string, contentType: string) => {
  if ('content' in param) {
    return getResolvedRef(param.content?.[contentType]?.examples?.[exampleKey])
  }
  if ('examples' in param) {
    return getResolvedRef(param.examples?.[exampleKey])
  }
  return undefined
}
