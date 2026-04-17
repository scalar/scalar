import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'

export type RequiredSecurityState = 'required' | 'optional' | 'none'

export type RequiredSecurityScheme = {
  /** Scheme key as declared in `components.securitySchemes`. */
  name: string
  /** Resolved scheme object. `undefined` if the referenced scheme isn't defined on the document. */
  scheme: SecuritySchemeObject | undefined
  /** Scopes required by the operation for this scheme (OAuth2 / OpenID Connect). Empty otherwise. */
  scopes: string[]
}

export type RequiredSecurity = {
  state: RequiredSecurityState
  /**
   * Flattened list of schemes referenced by the operation's security requirements.
   * Empty when `state === 'none'`. Resolved schemes are looked up in `document.components.securitySchemes`.
   * If the same scheme appears in multiple requirements, its scopes are unioned.
   */
  schemes: RequiredSecurityScheme[]
}

/**
 * Determine whether an operation requires authentication, using `operation.security ?? document.security`
 * as the source of truth. Operation-level `security` fully overrides document-level — including `security: []`,
 * which explicitly opts the operation out of auth.
 *
 * OpenAPI encodes "auth is optional" by including an empty requirement object `{}` alongside at least one
 * real requirement. If the only requirement is `{}`, auth is not required (state: 'none').
 */
export const getRequiredSecurity = (
  operation: Pick<OperationObject, 'security'> | null | undefined,
  document: Pick<OpenApiDocument, 'security' | 'components'>,
): RequiredSecurity => {
  const requirements = operation?.security ?? document.security ?? []

  if (requirements.length === 0) {
    return { state: 'none', schemes: [] }
  }

  const hasEmpty = requirements.some((requirement) => Object.keys(requirement).length === 0)
  const nonEmpty = requirements.filter((requirement) => Object.keys(requirement).length > 0)

  if (nonEmpty.length === 0) {
    return { state: 'none', schemes: [] }
  }

  const definedSchemes = document.components?.securitySchemes ?? {}
  const scopesByName = new Map<string, Set<string>>()
  for (const requirement of nonEmpty) {
    for (const [name, scopes] of Object.entries(requirement)) {
      const set = scopesByName.get(name) ?? new Set<string>()
      if (Array.isArray(scopes)) {
        for (const scope of scopes) {
          if (typeof scope === 'string' && scope.length > 0) {
            set.add(scope)
          }
        }
      }
      scopesByName.set(name, set)
    }
  }

  const schemes: RequiredSecurityScheme[] = [...scopesByName.entries()].map(([name, scopes]) => ({
    name,
    scheme: getResolvedRef(definedSchemes[name]),
    scopes: [...scopes],
  }))

  return {
    state: hasEmpty ? 'optional' : 'required',
    schemes,
  }
}
