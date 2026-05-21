import { object, optional, record, string } from '@scalar/validation'

import { normalRef } from './reference'

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
    implicit: optional(normalRef(asyncApiOAuthFlowObject)),
    password: optional(normalRef(asyncApiOAuthFlowObject)),
    clientCredentials: optional(normalRef(asyncApiOAuthFlowObject)),
    authorizationCode: optional(normalRef(asyncApiOAuthFlowObject)),
  },
  { typeName: 'AsyncApiOAuthFlowsObject' },
)
