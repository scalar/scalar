import { object, optional, string } from '@scalar/validation'

export const XScalarSecretToken = object(
  {
    'x-scalar-secret-token': string(),
  },
  {
    typeName: 'XScalarSecretToken',
    typeComment: 'Persisted OAuth access token (sensitive)',
  },
)

export const XScalarSecretRefreshToken = object(
  {
    'x-scalar-secret-refresh-token': optional(string()),
  },
  {
    typeName: 'XScalarSecretRefreshToken',
    typeComment: 'Persisted OAuth refresh token (sensitive)',
  },
)

export const XScalarAuthUrl = object(
  {
    'x-scalar-secret-auth-url': optional(string()),
  },
  {
    typeName: 'XScalarAuthUrl',
    typeComment: 'Persisted OAuth authorization URL override',
  },
)

export const XScalarTokenUrl = object(
  {
    'x-scalar-secret-token-url': optional(string()),
  },
  {
    typeName: 'XScalarTokenUrl',
    typeComment: 'Persisted OAuth token URL override',
  },
)

export const XScalarSecretHTTP = object(
  {
    'x-scalar-secret-username': string(),
    'x-scalar-secret-password': string(),
  },
  {
    typeName: 'XScalarSecretHTTP',
    typeComment: 'Persisted HTTP basic credentials (sensitive)',
  },
)

export const XScalarSecretClientSecret = object(
  {
    'x-scalar-secret-client-secret': string(),
  },
  {
    typeName: 'XScalarSecretClientSecret',
    typeComment: 'Persisted OAuth client secret (sensitive)',
  },
)

export const XScalarSecretClientId = object(
  {
    'x-scalar-secret-client-id': string(),
  },
  {
    typeName: 'XScalarSecretClientId',
    typeComment: 'Persisted OAuth client ID',
  },
)

export const XScalarSecretRedirectUri = object(
  {
    'x-scalar-secret-redirect-uri': string(),
  },
  {
    typeName: 'XScalarSecretRedirectUri',
    typeComment: 'Persisted OAuth redirect URI',
  },
)
