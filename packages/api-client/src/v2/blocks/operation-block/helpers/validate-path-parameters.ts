import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject, ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isParamDisabled } from '@/v2/blocks/request-block/helpers/is-param-disabled'

import { getExample } from './get-example'

/**
 * Validates that all required path parameters have non-empty values.
 *
 * Path parameters are always required per the OpenAPI specification.
 * Returns the names of any path parameters that are missing values.
 */
export const validatePathParameters = (
  parameters: ReferenceType<ParameterObject>[] = [],
  exampleKey: string = 'default',
): string[] => {
  const emptyParams: string[] = []

  for (const referencedParam of parameters) {
    const param = getResolvedRef(referencedParam)

    if (param.in !== 'path') {
      continue
    }

    const example = getExample(param, exampleKey, undefined)

    // If disabled, skip validation
    if (isParamDisabled(param, example)) {
      continue
    }

    // Check if the example value is empty
    const value = example?.value
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      emptyParams.push(param.name)
    }
  }

  return emptyParams
}
