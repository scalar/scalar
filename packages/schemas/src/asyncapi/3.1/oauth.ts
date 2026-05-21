import { object, optional, record, string } from '@scalar/validation'

import { recursiveRef } from './reference'

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

export const asyncApiOAuthFlowsObject = object(
  {
    implicit: optional(recursiveRef(asyncApiOAuthFlowObject)),
    password: optional(recursiveRef(asyncApiOAuthFlowObject)),
    clientCredentials: optional(recursiveRef(asyncApiOAuthFlowObject)),
    authorizationCode: optional(recursiveRef(asyncApiOAuthFlowObject)),
  },
  { typeName: 'AsyncApiOAuthFlowsObject' },
)
