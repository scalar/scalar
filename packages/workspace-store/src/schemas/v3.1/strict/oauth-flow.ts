import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

/** Common properties used across all OAuth flows */
const OAuthFlowCommonSchema = Type.Object({
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  refreshUrl: Type.Optional(Type.String()),
  /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
  scopes: Type.Record(Type.String(), Type.String()),
  /** Extension to save the client Id associated with an oauth flow */
  'x-scalar-client-id': Type.String(),
  /** The auth token */
  'x-scalar-secret-token': Type.Optional(Type.String()),
  /** Additional query parameters for the OAuth authorization request. Example: { prompt: 'consent', audience: 'scalar' }. */
  'x-scalar-security-query': Type.Record(Type.String(), Type.String()),
  /** Additional body parameters for the OAuth token request. Example: { audience: 'foo' }. */
  'x-scalar-security-body': Type.Record(Type.String(), Type.String()),
  /** Extension to specify custom token name in the response (defaults to 'access_token') */
  'x-tokenName': Type.Optional(Type.String()),
})

/** Configuration for the OAuth Implicit flow */
export const OAuthFlowImplicitSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.String(),
  }),
  Type.Object({
    'x-scalar-redirect-uri': Type.String(),
  }),
)

/** Configuration for the OAuth Resource Owner Password flow */
export const OAuthFlowPasswordSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
  Type.Object({
    'x-scalar-client-secret': Type.String(),
    'x-scalar-username': Type.String(),
    'x-scalar-password': Type.String(),
    'x-scalar-credentials-location': Type.Union([Type.Literal('header'), Type.Literal('body')]),
  }),
)

/** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
export const OAuthFlowClientCredentialsSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
  Type.Object({
    'x-scalar-client-secret': Type.String(),
    'x-scalar-credentials-location': Type.Union([Type.Literal('header'), Type.Literal('body')]),
  }),
)

/** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
export const OAuthFlowAuthorizationCodeSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.String(),
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
  Type.Object({
    'x-scalar-client-secret': Type.String(),
    'x-scalar-redirect-uri': Type.String(),
    'x-usePkce': Type.Union([Type.Literal('no'), Type.Literal('SHA-256'), Type.Literal('plain')]),
    'x-scalar-credentials-location': Type.Union([Type.Literal('header'), Type.Literal('body')]),
  }),
)

/** Union of all OAuth flow schemas */
export const OAuthFlowObjectSchemaDefinition = Type.Union([
  OAuthFlowImplicitSchema,
  OAuthFlowPasswordSchema,
  OAuthFlowClientCredentialsSchema,
  OAuthFlowAuthorizationCodeSchema,
])

export type OAuthFlowImplicit = Static<typeof OAuthFlowImplicitSchema>
export type OAuthFlowPassword = Static<typeof OAuthFlowPasswordSchema>
export type OAuthFlowClientCredentials = Static<typeof OAuthFlowClientCredentialsSchema>
export type OAuthFlowAuthorizationCode = Static<typeof OAuthFlowAuthorizationCodeSchema>

export type OAuthFlow = OAuthFlowImplicit | OAuthFlowPassword | OAuthFlowClientCredentials | OAuthFlowAuthorizationCode
