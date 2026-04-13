import type { ExampleObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Determines if a parameter is disabled
 *
 * First we explicitly check if its been disabled via the `x-disabled` extension.
 * Then we check if its an optional parameter and not a path parameter.
 *
 * @param param - The parameter to check.
 * @param example - The example to check.
 * @returns true if the parameter is disabled, false otherwise.
 */
export const isParamDisabled = (
  param: ParameterObject,
  example: ExampleObject | undefined,
  defaultDisabled: boolean = true,
) => {
  const xDisabled = example?.['x-disabled']

  // If x-disabled is explicitly set (true or false), use that value
  if (typeof xDisabled === 'boolean') {
    return xDisabled
  }

  // If the parameter is not disabled by default, return false
  if (!defaultDisabled) {
    return false
  }

  // Otherwise, disable optional parameters (except path parameters which are always required)
  return !param.required && param.in !== 'path'
}
