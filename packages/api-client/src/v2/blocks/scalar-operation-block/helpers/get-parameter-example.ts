import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getParameterContentValue } from './get-parameter-content'

/**
 * Extract example from parameter object
 */
export const getParameterExample = (parameter: ParameterObject, exampleKey: string) => {
  if ('examples' in parameter && parameter.examples) {
    return getResolvedRef(parameter.examples[exampleKey])
  }

  const content = getParameterContentValue(parameter)

  if (content?.examples) {
    return getResolvedRef(content.examples[exampleKey])
  }

  return undefined
}
