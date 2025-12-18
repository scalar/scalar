import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/openapi-document'

/** Type guard to determine if a security requirement is non-optional */
export const isNonOptionalSecurityRequirement = (
  securityRequirement: SecurityRequirementObject | undefined,
): securityRequirement is Record<string, string[]> => {
  return securityRequirement !== undefined && Object.keys(securityRequirement).length > 0
}
