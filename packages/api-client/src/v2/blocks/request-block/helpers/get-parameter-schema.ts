import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject, SchemaObject } from '@scalar/types/openapi/3.1'

import { getParameterContentValue } from './get-parameter-content'

/**
 * Extract the schema from the parameter object
 */
export const getParameterSchema = (parameter: ParameterObject): SchemaObject | undefined => {
  if ('schema' in parameter && parameter.schema) {
    return getResolvedRef(parameter.schema)
  }

  return getResolvedRef(getParameterContentValue(parameter)?.schema)
}
