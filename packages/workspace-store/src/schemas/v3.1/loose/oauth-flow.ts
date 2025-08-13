import { Type, type Static } from '@sinclair/typebox'

import { compose } from '@/schemas/compose'

/** Common properties used across all OAuth flows */
const OAuthFlowCommonSchema = Type.Object({
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  refreshUrl: Type.Optional(Type.String()),
  /** The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
  scopes: Type.Optional(Type.Record(Type.String(), Type.String())),
})

/** Configuration for the OAuth Implicit flow */
export const OAuthFlowImplicitSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.Optional(Type.String()),
  }),
)

/** Configuration for the OAuth Resource Owner Password flow */
export const OAuthFlowPasswordSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.Optional(Type.String()),
  }),
)

/** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
export const OAuthFlowClientCredentialsSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.Optional(Type.String()),
  }),
)

/** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
export const OAuthFlowAuthorizationCodeSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.Optional(Type.String()),
    /** The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.Optional(Type.String()),
  }),
)

/** Union of all OAuth flow schemas */
export const OAuthFlowObjectSchema = Type.Union([
  OAuthFlowImplicitSchema,
  OAuthFlowPasswordSchema,
  OAuthFlowClientCredentialsSchema,
  OAuthFlowAuthorizationCodeSchema,
])

export type OAuthFlowObject = Static<typeof OAuthFlowObjectSchema>
export type OAuthFlowImplicit = Static<typeof OAuthFlowImplicitSchema>
export type OAuthFlowPassword = Static<typeof OAuthFlowPasswordSchema>
export type OAuthFlowClientCredentials = Static<typeof OAuthFlowClientCredentialsSchema>
export type OAuthFlowAuthorizationCode = Static<typeof OAuthFlowAuthorizationCodeSchema>
