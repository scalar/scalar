import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XScalarCredentialsLocationSchema } from '@/schemas/extensions/security/x-scalar-credentials-location'
import { XScalarSecurityBody } from '@/schemas/extensions/security/x-scalar-security-body'
import { XScalarSecurityQuery } from '@/schemas/extensions/security/x-scalar-security-query'
import {
  XScalarSecretClientIdSchema,
  XScalarSecretClientSecretSchema,
  XScalarSecretHTTPSchema,
  XScalarSecretRedirectUriSchema,
  XScalarSecretTokenSchema,
} from '@/schemas/extensions/security/x-scalar-security-secrets'
import { XTokenName } from '@/schemas/extensions/security/x-tokenName'
import { XusePkceSchema } from '@/schemas/extensions/security/x-use-pkce'

/** Common properties used across all OAuth flows */
const OAuthFlowCommonSchema = compose(
  Type.Object({
    /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    refreshUrl: Type.String(),
    /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
    scopes: Type.Record(Type.String(), Type.String()),
  }),
  XScalarSecretClientIdSchema,
  XScalarSecretTokenSchema,
  XScalarSecurityQuery,
  XScalarSecurityBody,
  XTokenName,
  XScalarCredentialsLocationSchema,
)

/** Configuration for the OAuth Implicit flow */
export const OAuthFlowImplicitSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.String(),
  }),
  XScalarSecretRedirectUriSchema,
)

/** Configuration for the OAuth Resource Owner Password flow */
export const OAuthFlowPasswordSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
  XScalarSecretHTTPSchema,
  XScalarSecretClientSecretSchema,
)

/** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
export const OAuthFlowClientCredentialsSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
  }),
  XScalarSecretClientSecretSchema,
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
  XScalarSecretClientSecretSchema,
  XScalarSecretRedirectUriSchema,
  XusePkceSchema,
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
