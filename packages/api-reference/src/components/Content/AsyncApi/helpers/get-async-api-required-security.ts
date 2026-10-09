import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { getAsyncApiSecurityRequirements } from '@scalar/workspace-store/channel-example'

import { type RequiredSecurity, getRequiredSecurity } from '@/features/Operation/helpers/get-required-security'

/**
 * Build the required-security model for an AsyncAPI operation so the shared
 * operation security section can render its alternatives and OAuth / OpenID Connect scopes.
 *
 * AsyncAPI declares security on the operation (and its traits) as a list of scheme
 * references carrying scopes. `getAsyncApiSecurityRequirements` normalises that into the
 * same OR-alternative shape the OpenAPI path uses, so we hand it to `getRequiredSecurity`
 * and reuse the exact grouping and de-duplication logic.
 *
 * Scheme definitions are resolved separately by the operation security component.
 * Server-level security belongs to the channel connection and is excluded here.
 */
export const getAsyncApiRequiredSecurity = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject | null | undefined,
  operationName?: string,
): RequiredSecurity =>
  getRequiredSecurity(
    { security: getAsyncApiSecurityRequirements(document, operation, null, { operationName }) },
    { components: undefined },
  )
