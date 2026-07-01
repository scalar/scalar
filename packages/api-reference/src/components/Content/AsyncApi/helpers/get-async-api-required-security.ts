import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { getAsyncApiSecurityRequirements } from '@scalar/workspace-store/channel-example'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'

import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

/**
 * Build a `RequiredSecurity` for an AsyncAPI operation so it can render with the shared
 * `SecurityRequirementBadge`.
 *
 * AsyncAPI 3.x `security` is a flat list of Security Scheme Objects (or `$ref`s to them) of which
 * exactly one MUST be satisfied — i.e. OR alternatives, each a single scheme, with no AND grouping
 * and no OpenAPI-style optional `{}` entry. We reuse `getAsyncApiSecurityRequirements` (which maps
 * each entry to its `{ schemeName: scopes }` form) and resolve each scheme name back to its
 * definition for display.
 *
 * This surfaces operation-level security only. Server-level requirements are intentionally not
 * folded in here: the effective server depends on the operation's channel, which is not resolved at
 * this call site, so the `server` argument is omitted.
 */
export const getAsyncApiRequiredSecurity = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject | null | undefined,
): RequiredSecurity => {
  const requirements = getAsyncApiSecurityRequirements(document, operation)

  const components = document.components ? getResolvedRef(document.components) : undefined
  const definedSchemes = components?.securitySchemes ?? {}

  const groups = requirements.map((requirement) => ({
    schemes: Object.entries(requirement).map(([name, scopes]) => ({
      name,
      // The badge only reads `scheme.type` (rendered as text), so the AsyncAPI scheme shape is
      // compatible even though its `type` enum differs from OpenAPI's.
      scheme: getResolvedRef(definedSchemes[name]) as SecuritySchemeObject | undefined,
      // Scopes come straight from a loosely-validated AsyncAPI document, so guard against
      // non-string entries (for example `null` from malformed YAML) before reading `.length`.
      scopes: (scopes ?? []).filter((scope) => typeof scope === 'string' && scope.length > 0),
    })),
  }))

  return {
    state: groups.length > 0 ? 'required' : 'none',
    requirements: groups,
  }
}
