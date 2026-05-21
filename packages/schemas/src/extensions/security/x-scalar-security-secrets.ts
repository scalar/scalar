import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarSecretToken = object(
  {
    'x-scalar-secret-token': string({
      typeComment: 'Persisted OAuth access token',
    }),
  },
  {
    typeName: 'XScalarSecretToken',
    typeComment: typeCommentWithExample(
      'Persisted OAuth access token (sensitive). Do not export when exporting the document.',
      { language: 'yaml', body: 'x-scalar-secret-token: eyJhbG...' },
    ),
  },
)

export const XScalarSecretRefreshToken = object(
  {
    'x-scalar-secret-refresh-token': optional(string({ typeComment: 'Persisted OAuth refresh token' })),
  },
  {
    typeName: 'XScalarSecretRefreshToken',
    typeComment: 'Persisted OAuth refresh token (sensitive). Do not export when exporting the document.',
  },
)

export const XScalarAuthUrl = object(
  {
    'x-scalar-secret-auth-url': optional(string({ typeComment: 'Override for the OAuth authorization endpoint URL' })),
  },
  {
    typeName: 'XScalarAuthUrl',
    typeComment: 'Persisted OAuth authorization URL override. Do not export when exporting the document.',
  },
)

export const XScalarTokenUrl = object(
  {
    'x-scalar-secret-token-url': optional(string({ typeComment: 'Override for the OAuth token endpoint URL' })),
  },
  {
    typeName: 'XScalarTokenUrl',
    typeComment: 'Persisted OAuth token URL override. Do not export when exporting the document.',
  },
)

export const XScalarSecretHTTP = object(
  {
    'x-scalar-secret-username': string({ typeComment: 'HTTP basic auth username' }),
    'x-scalar-secret-password': string({ typeComment: 'HTTP basic auth password' }),
  },
  {
    typeName: 'XScalarSecretHTTP',
    typeComment: typeCommentWithExample(
      'Persisted HTTP basic credentials (sensitive). Do not export when exporting the document.',
      {
        language: 'yaml',
        body: `x-scalar-secret-username: api-user
x-scalar-secret-password: secret`,
      },
    ),
  },
)

export const XScalarSecretClientSecret = object(
  {
    'x-scalar-secret-client-secret': string({ typeComment: 'OAuth client secret' }),
  },
  {
    typeName: 'XScalarSecretClientSecret',
    typeComment: 'Persisted OAuth client secret (sensitive). Do not export when exporting the document.',
  },
)

export const XScalarSecretClientId = object(
  {
    'x-scalar-secret-client-id': string({ typeComment: 'OAuth client ID' }),
  },
  {
    typeName: 'XScalarSecretClientId',
    typeComment: 'Persisted OAuth client ID. Do not export when exporting the document.',
  },
)

export const XScalarSecretRedirectUri = object(
  {
    'x-scalar-secret-redirect-uri': string({ typeComment: 'OAuth redirect URI registered for this client' }),
  },
  {
    typeName: 'XScalarSecretRedirectUri',
    typeComment: 'Persisted OAuth redirect URI. Do not export when exporting the document.',
  },
)
