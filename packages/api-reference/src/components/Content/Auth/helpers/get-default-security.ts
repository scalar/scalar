import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { MergedSecuritySchemes } from '@scalar/workspace-store/request-example'
import type {
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Extracts the default scopes for a security scheme.
 * Only OAuth2 schemes can have default scopes via the x-default-scopes extension.
 */
export const getDefaultScopes = (scheme: SecuritySchemeObject | undefined): string[] => {
  if (!scheme || scheme.type !== 'oauth2') {
    return []
  }

  return scheme['x-default-scopes'] ?? []
}

/**
 * Hydrates an existing security requirement with configured default scopes.
 * Explicit scopes from the OpenAPI requirement take precedence over x-default-scopes.
 */
const hydrateSecurityRequirement = (
  requirement: SecurityRequirementObject,
  securitySchemes: MergedSecuritySchemes,
): SecurityRequirementObject => {
  const hydratedRequirement: SecurityRequirementObject = {}

  for (const [schemeName, scopes] of Object.entries(unpackProxyObject(requirement, { depth: 1 }) ?? requirement)) {
    if (Array.isArray(scopes) && scopes.length > 0) {
      hydratedRequirement[schemeName] = scopes
      continue
    }

    const scheme = getResolvedRef(securitySchemes[schemeName])
    hydratedRequirement[schemeName] = getDefaultScopes(scheme)
  }

  return hydratedRequirement
}

/**
 * Processes a single scheme name and adds it to the accumulator with its default scopes.
 */
const addSchemeToRequirement = (
  acc: SecurityRequirementObject,
  schemeName: string,
  securitySchemes: MergedSecuritySchemes,
): void => {
  const scheme = getResolvedRef(securitySchemes[schemeName])
  acc[schemeName] = getDefaultScopes(scheme)
}

/**
 * Converts the preferred security scheme configuration into a SecurityRequirementObject.
 * Handles both flat arrays and nested arrays (for complex auth scenarios).
 */
const buildSecurityRequirementFromPreferred = (
  preferredSecurityScheme: string | (string | string[])[],
  securitySchemes: MergedSecuritySchemes,
): SecurityRequirementObject => {
  if (!Array.isArray(preferredSecurityScheme)) {
    const scheme = getResolvedRef(securitySchemes[preferredSecurityScheme])
    return { [preferredSecurityScheme]: getDefaultScopes(scheme) }
  }

  const requirement: SecurityRequirementObject = {}

  for (const item of preferredSecurityScheme) {
    if (Array.isArray(item)) {
      // Handle nested arrays for complex auth (e.g., [['oauth2', 'apiKey'], 'basic'])
      for (const schemeName of item) {
        addSchemeToRequirement(requirement, schemeName, securitySchemes)
      }
    } else {
      addSchemeToRequirement(requirement, item, securitySchemes)
    }
  }

  return requirement
}

/**
 * Determines the default security scheme to use for an operation.
 *
 * Priority order:
 * 1. User-configured preferred security scheme (if provided)
 * 2. First security requirement from the OpenAPI spec
 * 3. null (no security required)
 */
export const getDefaultSecurity = (
  securityRequirements: SecurityRequirementObject[],
  preferredSecurityScheme: AuthenticationConfiguration['preferredSecurityScheme'],
  securitySchemes: MergedSecuritySchemes,
): SecurityRequirementObject | null => {
  if (preferredSecurityScheme) {
    return buildSecurityRequirementFromPreferred(preferredSecurityScheme, securitySchemes)
  }

  const firstRequirement = securityRequirements[0]
  if (firstRequirement) {
    return hydrateSecurityRequirement(firstRequirement, securitySchemes)
  }

  return null
}
