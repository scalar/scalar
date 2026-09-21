import type { ExampleObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/**
 * Determines if a parameter is disabled
 *
 * First we explicitly check if its been disabled via the `x-disabled` extension.
 * Populated examples are enabled unless explicitly disabled. Empty optional parameters stay disabled.
 *
 * @param param - The parameter to check.
 * @param example - The example to check.
 * @param defaultDisabled - When true (default), empty optional parameters are treated as disabled unless explicitly enabled. When false, only parameters explicitly marked `x-disabled: true` are disabled.
 * @returns true if the parameter is disabled, false otherwise.
 */
export const isParamDisabled = (
  param: ParameterObject,
  example: ExampleObject | undefined,
  defaultDisabled: boolean = true,
): boolean => {
  const xDisabled = example?.['x-disabled']

  // If x-disabled is explicitly set (true or false), use that value
  if (typeof xDisabled === 'boolean') {
    return xDisabled
  }

  // Keep the editor, generated snippets, and outgoing requests aligned for pre-populated values.
  const hasValue = example?.value !== undefined && example.value !== '' && example.value !== null
  if (!defaultDisabled || hasValue) {
    return false
  }

  // Otherwise, disable optional parameters (except path parameters which are always required)
  return !param.required && param.in !== 'path'
}
