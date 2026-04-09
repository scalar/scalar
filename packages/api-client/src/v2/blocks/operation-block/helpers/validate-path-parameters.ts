import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExample } from '@scalar/workspace-store/request-example'
import type { ParameterObject, ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isParamDisabled } from '@/v2/blocks/request-block/helpers/is-param-disabled'

type ValidatePathParametersResult = { ok: true } | { ok: false; invalidParams: string[] }

/** Treats undefined, null, and blank/whitespace strings as empty. */
const isEmptyParamValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true
  }
  if (typeof value === 'string') {
    return value.trim() === ''
  }
  return false
}

/**
 * Validates that all required path parameters have non-empty values.
 *
 * Path parameters are always required per the OpenAPI specification.
 * Returns the names of any path parameters that are missing values.
 */
export const validatePathParameters = (
  parameters: ReferenceType<ParameterObject>[] = [],
  exampleKey: string = 'default',
): ValidatePathParametersResult => {
  const invalidParams: string[] = []

  for (const referencedParam of parameters) {
    const param = getResolvedRef(referencedParam)
    if (param.in !== 'path') {
      continue
    }

    const example = getExample(param, exampleKey, undefined)
    if (isParamDisabled(param, example)) {
      continue
    }

    if (isEmptyParamValue(example?.value)) {
      invalidParams.push(param.name)
    }
  }

  return invalidParams.length > 0 ? { ok: false, invalidParams } : { ok: true }
}
