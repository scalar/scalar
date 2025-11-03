import type { OpenAPIV3 } from '@scalar/openapi-types'

/**
 * Check whether the given security scheme key is in the `security` configuration for this operation.
 */
export function isAuthenticationRequired(security?: OpenAPIV3.SecurityRequirementObject[]): boolean {
  // If security is not defined, auth is not required.
  if (!security) {
    return false
  }

  // Don't require auth if security is just an empty array []
  if (Array.isArray(security) && !security.length) {
    return false
  }

  // Includes empty object = auth is not required
  if ((security ?? []).some((securityRequirement) => !Object.keys(securityRequirement).length)) {
    return false
  }

  return true
}
