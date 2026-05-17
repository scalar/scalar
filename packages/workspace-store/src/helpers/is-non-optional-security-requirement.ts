import type { SecurityRequirementObject } from '@scalar/types/openapi/3.1'

/** Type guard to determine if a security requirement is non-optional */
export const isNonOptionalSecurityRequirement = (
  securityRequirement: SecurityRequirementObject | undefined,
): securityRequirement is Record<string, string[]> => {
  return securityRequirement !== undefined && Object.keys(securityRequirement).length > 0
}
