import { object, optional, record, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

export const asyncApiOAuthFlowObject = object(
  {
    authorizationUrl: optional(
      string({
        typeComment: 'REQUIRED for implicit and authorizationCode flows. The authorization URL (absolute URL).',
      }),
    ),
    tokenUrl: optional(
      string({
        typeComment:
          'REQUIRED for password, clientCredentials, and authorizationCode flows. The token URL (absolute URL).',
      }),
    ),
    refreshUrl: optional(
      string({
        typeComment: 'The URL to be used for obtaining refresh tokens. This MUST be in the form of an absolute URL.',
      }),
    ),
    availableScopes: optional(
      record(string(), string(), {
        typeComment: 'REQUIRED for OAuth2 flows. Map of scope name to a short description.',
      }),
    ),
  },
  { typeName: 'AsyncApiOAuthFlowObject' },
)

/**
 * Builds the OAuth Flows Object schema for {@link generateSchema}.
 *
 * **Not a reference union:** The flows container is always inline. Each flow property
 * (`implicit`, `password`, and so on) is `OAuth Flow Object | Reference Object` via `maybeRef`.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiOAuthFlowsObject = (maybeRef: MaybeRefFn) =>
  object(
    {
      implicit: optional(maybeRef(asyncApiOAuthFlowObject)),
      password: optional(maybeRef(asyncApiOAuthFlowObject)),
      clientCredentials: optional(maybeRef(asyncApiOAuthFlowObject)),
      authorizationCode: optional(maybeRef(asyncApiOAuthFlowObject)),
    },
    { typeName: 'AsyncApiOAuthFlowsObject' },
  )

export const asyncApiOAuthFlowsObject = createAsyncApiOAuthFlowsObject(normalRef)
