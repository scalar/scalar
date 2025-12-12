import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExampleObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Grabs the example from both schema based and content based parameters */
export const getExample = (param: ParameterObject, exampleKey: string, contentType: string): ExampleObject | null => {
  // Content based parameters
  if ('content' in param) {
    return getResolvedRef(param.content?.[contentType]?.examples?.[exampleKey]) ?? null
  }

  // Schema based parameters
  if ('examples' in param) {
    if (param.examples?.[exampleKey]) {
      return getResolvedRef(param.examples?.[exampleKey])
    }
  }

  // Fallback to default
  if ('schema' in param) {
    const defaultValue = getResolvedRef(param.schema)?.default
    if (typeof defaultValue !== 'undefined') {
      return { value: defaultValue }
    }
  }

  return null
}
