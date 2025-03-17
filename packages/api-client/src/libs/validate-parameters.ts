import type { RequestExample } from '@scalar/oas-utils/entities/spec'

/**
 * Validate required parameters from an example
 */
export const validateParameters = (example: Partial<RequestExample> | null) => {
  const invalidParams = new Set<string>()
  if (!example) {
    return invalidParams
  }

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
