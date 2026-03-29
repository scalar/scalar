import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Determines if the authentication is optional */
export const isAuthOptional = (securityRequirements: NonNullable<OpenApiDocument['security']>): boolean => {
  const hasComplexRequirement = securityRequirements.some((requirement) => Object.keys(requirement).length > 1)
  const hasEmptyRequirement = securityRequirements.some((requirement) => Object.keys(requirement).length === 0)

  return hasEmptyRequirement && !hasComplexRequirement
}
