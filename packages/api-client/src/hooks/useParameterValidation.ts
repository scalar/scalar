import type { RequestExample } from '@scalar/oas-utils/entities/spec'

export function useParameterValidation() {
  const validateParameters = (example: Partial<RequestExample> | null, invalidParams: Set<string>) => {
    // Clear previous invalid parameter state
    invalidParams.clear()

    if (!example) return invalidParams

    // Validate parameters and add to invalidParams if invalid
    const paramTypes = ['path', 'query', 'headers', 'cookies'] as const
    paramTypes.some((paramType) => {
      return example.parameters?.[paramType]?.some((param) => {
        if (param.required && param.value === '') {
          invalidParams.add(param.key)
        }
      })
    })

    return invalidParams
  }

  return {
    validateParameters,
  }
}
