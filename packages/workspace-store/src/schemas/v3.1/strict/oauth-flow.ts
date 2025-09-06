import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XScalarSecretTokenSchema } from '@/schemas/extensions/security/x-scalar-security-secrets'

/** Common properties used across all OAuth flows */
const OAuthFlowCommonSchema = Type.Object({
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  refreshUrl: Type.Optional(Type.String()),
  /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
  scopes: Type.Record(Type.String(), Type.String()),
})

/** Configuration for the OAuth Implicit flow */
export const OAuthFlowImplicitSchema = compose(
  OAuthFlowCommonSchema,
  XScalarSecretTokenSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.String(),
  }),
)

/** Configuration for the OAuth Resource Owner Password flow */
export const OAuthFlowPasswordSchema = compose(
  OAuthFlowCommonSchema,
  XScalarSecretTokenSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
)

/** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
export const OAuthFlowClientCredentialsSchema = compose(
  OAuthFlowCommonSchema,
  XScalarSecretTokenSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
)

/** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
export const OAuthFlowAuthorizationCodeSchema = compose(
  OAuthFlowCommonSchema,
  XScalarSecretTokenSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.String(),
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
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
