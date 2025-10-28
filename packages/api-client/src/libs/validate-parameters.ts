import type { RequestExample } from '@scalar/oas-utils/entities/spec'

export type ValidationResult = {
  invalidParams: Set<string>
  hasBlockingErrors: boolean
}

/**
 * Validate required parameters from an example.
 *
 * Returns both the set of invalid parameter keys and a flag indicating
 * if there are blocking errors (empty required path parameters) that
 * should prevent the request from being sent.
 */
export const validateParameters = (example: Partial<RequestExample> | null): ValidationResult => {
  const result = {
    invalidParams: new Set<string>(),
    hasBlockingErrors: false,
  }

  if (!example) {
    return result
  }

  // Check path parameters separately - these are blocking
  example.parameters?.path?.forEach((param) => {
    if (param.enabled && param.value.trim() === '') {
      result.invalidParams.add(param.key)
      result.hasBlockingErrors = true
    }
  })

  // Validate other parameters - these are non-blocking
  const nonBlockingParamTypes = ['query', 'headers', 'cookies'] as const
  nonBlockingParamTypes.forEach((paramType) => {
    example.parameters?.[paramType]?.forEach((param) => {
      if (param.required && param.value === '') {
        result.invalidParams.add(param.key)
      }
    })
  })

  return result
}
