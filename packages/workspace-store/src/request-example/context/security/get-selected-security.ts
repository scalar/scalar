import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isAuthOptional } from './is-auth-optional'

type DefaultScopeScheme = {
  type?: string
  'x-default-scopes'?: string[]
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
 * Resolves which security selection to use for an operation.
 * Priority: operation-level selection, then document-level selection, then a default.
 * When neither level has a selection, returns the first security requirement unless
 * authentication is optional or there are no requirements, in which case returns no selection.
 */
export const getSelectedSecurity = (
  documentSelectedSecurity: SelectedSecurity | undefined,
  operationSelectedSecurity: SelectedSecurity | undefined,
  securityRequirements: NonNullable<OpenApiDocument['security']> = [],
  securitySchemes: Record<string, DefaultScopeScheme | undefined> = {},
): SelectedSecurity => {
  // Operation level security
  if (operationSelectedSecurity) {
    return operationSelectedSecurity
  }
  // Document level security
  if (documentSelectedSecurity) {
    return documentSelectedSecurity
  }

  const isOptional = isAuthOptional(securityRequirements)
  const firstRequirement = securityRequirements[0]

  // No need to default if auth is optional
  if (isOptional || !firstRequirement) {
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
