import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getParameterContentValue } from './get-parameter-content'

/**
 * Extract the schema from the parameter object
 */
export const getParameterSchema = (parameter: ParameterObject) => {
  if ('schema' in parameter && parameter.schema) {
    return getResolvedRef(parameter.schema)
  }

  return getResolvedRef(getParameterContentValue(parameter)?.schema)
}
