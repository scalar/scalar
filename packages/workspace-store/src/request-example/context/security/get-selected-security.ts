import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  SecurityRequirementObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isAuthOptional } from './is-auth-optional'

type DefaultScopeScheme = {
  type?: string
  'x-default-scopes'?: string[]
}

/** Extracts the default scopes for a security scheme (only OAuth2 schemes support this) */
const getDefaultScopes = (scheme: DefaultScopeScheme | undefined): string[] => {
  if (!scheme || scheme.type !== 'oauth2') {
    return []
  }
  return scheme['x-default-scopes'] ?? []
}

const applyDefaultScopes = (
  requirement: NonNullable<OpenApiDocument['security']>[number],
  securitySchemes: Record<string, DefaultScopeScheme | undefined>,
): NonNullable<OpenApiDocument['security']>[number] => {
  let didApplyDefaultScopes = false

  const hydratedRequirement = Object.fromEntries(
    Object.entries(requirement).map(([name, scopes]) => {
      if (Array.isArray(scopes) && scopes.length > 0) {
        return [name, scopes]
      }

      const scheme = getResolvedRef(securitySchemes[name])
      const defaultScopes = scheme?.type === 'oauth2' ? scheme['x-default-scopes'] : undefined
      if (Array.isArray(defaultScopes) && defaultScopes.length > 0) {
        didApplyDefaultScopes = true
        return [name, [...defaultScopes]]
      }

      return [name, scopes]
    }),
  )

  return didApplyDefaultScopes ? hydratedRequirement : requirement
}

/**
 * Builds a security requirement from the preferred security scheme configuration.
 * Handles both string and array formats for complex auth scenarios.
 */
const buildSecurityRequirementFromPreferred = (
  preferredSecurityScheme: string | (string | string[])[],
  securitySchemes: Record<string, DefaultScopeScheme | undefined>,
): SecurityRequirementObject => {
  if (!Array.isArray(preferredSecurityScheme)) {
    const scheme = getResolvedRef(securitySchemes[preferredSecurityScheme])
    return { [preferredSecurityScheme]: getDefaultScopes(scheme) }
  }

  const requirement: SecurityRequirementObject = {}

  for (const item of preferredSecurityScheme) {
    if (Array.isArray(item)) {
      for (const schemeName of item) {
        const scheme = getResolvedRef(securitySchemes[schemeName])
        requirement[schemeName] = getDefaultScopes(scheme)
      }
    } else {
      const scheme = getResolvedRef(securitySchemes[item])
      requirement[item] = getDefaultScopes(scheme)
    }
  }

  return requirement
}

/**
 * Resolves which security selection to use for an operation.
 *
 * Priority order:
 * 1. Operation-level selection (if set)
 * 2. Document-level selection (if set)
 * 3. Preferred security scheme from configuration (if provided)
 * 4. First security requirement from the OpenAPI spec
 * 5. No selection (if auth is optional or no requirements exist)
 */
export const getSelectedSecurity = (
  documentSelectedSecurity: SelectedSecurity | undefined,
  operationSelectedSecurity: SelectedSecurity | undefined,
  securityRequirements: NonNullable<OpenApiDocument['security']> = [],
  securitySchemes: Record<string, DefaultScopeScheme | undefined> = {},
  preferredSecurityScheme?: AuthenticationConfiguration['preferredSecurityScheme'],
): SelectedSecurity => {
  // Operation level security takes highest priority
  if (operationSelectedSecurity) {
    return operationSelectedSecurity
  }

  // Document level security is next
  if (documentSelectedSecurity) {
    return documentSelectedSecurity
  }

  const isOptional = isAuthOptional(securityRequirements)

  // No need to default if auth is optional and no preferred scheme
  if (isOptional && !preferredSecurityScheme) {
    return {
      selectedIndex: -1,
      selectedSchemes: [],
    }
  }

  // Use preferred security scheme if configured
  if (preferredSecurityScheme) {
    const requirement = buildSecurityRequirementFromPreferred(preferredSecurityScheme, securitySchemes)

    return {
      selectedIndex: 0,
      selectedSchemes: [requirement],
    }
  }

  const firstRequirement = securityRequirements[0]

  // No requirements and no preferred scheme
  if (!firstRequirement) {
    return {
      selectedIndex: -1,
      selectedSchemes: [],
    }
  }

  // Default to the first requirement
  const hydratedRequirement = applyDefaultScopes(firstRequirement, securitySchemes)

  return {
    selectedIndex: 0,
    selectedSchemes: [hydratedRequirement],
  }
}
