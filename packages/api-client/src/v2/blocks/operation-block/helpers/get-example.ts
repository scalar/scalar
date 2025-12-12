import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Grabs the example from both schema based and content based parameters */
export const getExample = (param: ParameterObject, exampleKey: string, contentType: string) => {
  // Content based parameters
  if ('content' in param) {
    return getResolvedRef(param.content?.[contentType]?.examples?.[exampleKey])
  }

  // Schema based parameters
  if ('examples' in param) {
    if (param.examples?.[exampleKey]) {
      return getResolvedRef(param.examples?.[exampleKey])
    }

    // Fallback to default
    const defaultValue = getResolvedRef(param.schema)?.default
    if (defaultValue) {
      return { value: defaultValue }
    }
  }

  return undefined
}
