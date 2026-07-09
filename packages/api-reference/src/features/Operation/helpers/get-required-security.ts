import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isNonOptionalSecurityRequirement } from '@scalar/workspace-store/helpers/is-non-optional-security-requirement'
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

/**
 * One alternative in the security requirement list.
 * All schemes within a group must be satisfied simultaneously (AND semantics).
 */
export type RequiredSecurityGroup = {
  schemes: RequiredSecurityScheme[]
}

export type RequiredSecurity = {
  state: RequiredSecurityState
  /**
   * Each element is one alternative (OR semantics). Within each group, all schemes
   * must be satisfied simultaneously (AND semantics). Empty when `state === 'none'`.
   *
   * Mirrors the OpenAPI `security` array structure:
   * - outer array  → OR  (satisfy any one group)
   * - inner object → AND (all schemes in a group are required together)
   */
  requirements: RequiredSecurityGroup[]
}

/**
 * Determine whether an operation requires authentication, using `operation.security ?? document.security`
 * as the source of truth. Operation-level `security` fully overrides document-level — including `security: []`,
 * which explicitly opts the operation out of auth.
 *
 * OpenAPI encodes "auth is optional" by including an empty requirement object `{}`. Whenever `{}`
 * appears — whether alongside real requirements or as the only entry — auth is treated as optional (state: 'optional').
 */
export const getRequiredSecurity = (
  operation: Pick<OperationObject, 'security'> | null | undefined,
  document: Pick<OpenApiDocument, 'security' | 'components'>,
): RequiredSecurity => {
  const securityList = operation?.security ?? document.security ?? []
  const definedSchemes = document.components?.securitySchemes ?? {}

  let hasEmpty = false
  const groups: RequiredSecurityGroup[] = []

  for (const requirement of securityList) {
    if (!isNonOptionalSecurityRequirement(requirement)) {
      hasEmpty = true
      continue
    }

    const schemes: RequiredSecurityScheme[] = Object.entries(requirement).map(([name, scopes]) => ({
      name,
      scheme: getResolvedRef(definedSchemes[name]),
      scopes: scopes.filter((s) => s.length > 0),
    }))

    if (schemes.length > 0) {
      groups.push({ schemes })
    }
  }

  if (groups.length === 0) {
    return { state: hasEmpty ? 'optional' : 'none', requirements: [] }
  }

  return {
    state: hasEmpty ? 'optional' : 'required',
    requirements: groups,
  }
}

/**
 * Required OAuth scopes grouped by security alternative (OR).
 *
 * Each returned array is the de-duplicated set of scopes for one alternative, kept in
 * declaration order. Scopes are only collected for OAuth2 / OpenID Connect schemes, so
 * alternatives without any scopes (for example API-key-only auth) are omitted and the
 * result is empty when the operation requires no OAuth scopes.
 *
 * Grouping is preserved intentionally: unioning scopes across alternatives would imply
 * that mutually exclusive scope sets are all required at once, which misstates OpenAPI
 * OR semantics.
 */
export const getRequiredScopeGroups = (requiredSecurity: RequiredSecurity): string[][] => {
  const groups: string[][] = []

  for (const group of requiredSecurity.requirements) {
    const collected = new Set<string>()

    for (const scheme of group.schemes) {
      for (const scope of scheme.scopes) {
        collected.add(scope)
      }
    }

    if (collected.size > 0) {
      groups.push([...collected])
    }
  }

  return groups
}
