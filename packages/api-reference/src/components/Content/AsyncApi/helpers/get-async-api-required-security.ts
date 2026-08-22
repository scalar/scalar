import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { getAsyncApiSecurityRequirements } from '@scalar/workspace-store/channel-example'

import { type RequiredSecurity, getRequiredSecurity } from '@/features/Operation/helpers/get-required-security'

/**
 * Build the required-security model for an AsyncAPI operation so the shared
 * `OperationScopes` section can render its OAuth / OpenID Connect scopes.
 *
 * AsyncAPI declares security on the operation (and its traits) as a list of scheme
 * references carrying scopes. `getAsyncApiSecurityRequirements` normalises that into the
 * same OR-alternative shape the OpenAPI path uses, so we hand it to `getRequiredSecurity`
 * and reuse the exact grouping and de-duplication logic.
 *
 * Only the scopes are needed for this section, so the scheme objects are left unresolved
 * (an empty component set). Server-level security is intentionally excluded: it belongs to
 * the channel connection, not a single operation.
 */
export const getAsyncApiRequiredSecurity = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject | null | undefined,
): RequiredSecurity =>
  getRequiredSecurity({ security: getSanitizedSecurityRequirements(document, operation) }, { components: undefined })

/**
 * Normalised security requirements with non-string scopes removed.
 *
 * AsyncAPI documents are only loosely validated, so a `scopes:` list can contain nulls (a bare
 * `-` in YAML) or numbers. `getRequiredSecurity` filters scopes with `s.length > 0`, which throws
 * on a null, so the guard has to happen before the shared helper sees the list.
 */
const getSanitizedSecurityRequirements = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject | null | undefined,
) =>
  getAsyncApiSecurityRequirements(document, operation, null).map((requirement) =>
    Object.fromEntries(
      Object.entries(requirement).map(([name, scopes]) => [
        name,
        (scopes ?? []).filter((scope): scope is string => typeof scope === 'string'),
      ]),
    ),
  )
