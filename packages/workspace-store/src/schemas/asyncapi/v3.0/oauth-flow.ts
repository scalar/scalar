import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import {
  type XScalarCredentialsLocation,
  XScalarCredentialsLocationSchema,
} from '@/schemas/extensions/security/x-scalar-credentials-location'
import {
  type XScalarSecurityBody,
  XScalarSecurityBodySchema,
} from '@/schemas/extensions/security/x-scalar-security-body'
import {
  type XScalarSecurityQuery,
  XScalarSecurityQuerySchema,
} from '@/schemas/extensions/security/x-scalar-security-query'
import {
  type XScalarSecretClientId,
  XScalarSecretClientIdSchema,
  type XScalarSecretClientSecret,
  XScalarSecretClientSecretSchema,
  type XScalarSecretHTTP,
  XScalarSecretHTTPSchema,
  type XScalarSecretRedirectUri,
  XScalarSecretRedirectUriSchema,
  type XScalarSecretToken,
  XScalarSecretTokenSchema,
} from '@/schemas/extensions/security/x-scalar-security-secrets'
import { type XTokenName, XTokenNameSchema } from '@/schemas/extensions/security/x-tokenName'
import { type XusePkce, XusePkceSchema } from '@/schemas/extensions/security/x-use-pkce'

/**
 * Common properties used across all AsyncAPI OAuth flows.
 * Note: AsyncAPI uses availableScopes instead of scopes.
 */
const OAuthFlowCommonSchema = compose(
  Type.Object({
    /** The URL to be used for obtaining refresh tokens. This MUST be in the form of an absolute URL. */
    refreshUrl: Type.Optional(Type.String()),
    /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. */
    availableScopes: Type.Record(Type.String(), Type.String()),
  }),
  XScalarSecretClientIdSchema,
  XScalarSecretTokenSchema,
  XScalarSecurityQuerySchema,
  XScalarSecurityBodySchema,
  XTokenNameSchema,
  XScalarCredentialsLocationSchema,
)

/**
 * Common properties used across all AsyncAPI OAuth flows.
 * Note: AsyncAPI uses availableScopes instead of scopes.
 */
type OAuthFlowCommon = {
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of an absolute URL. */
  refreshUrl?: string
  /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. */
  availableScopes: Record<string, string>
} & XScalarSecretClientId &
  XScalarSecretToken &
  XScalarSecurityQuery &
  XScalarSecurityBody &
  XTokenName &
  XScalarCredentialsLocation

/** Configuration for the OAuth Implicit flow */
export const OAuthFlowImplicitSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
    authorizationUrl: Type.String(),
  }),
  XScalarSecretRedirectUriSchema,
)

/** Configuration for the OAuth Implicit flow */
export type OAuthFlowImplicit = OAuthFlowCommon & {
  /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
  authorizationUrl: string
} & XScalarSecretRedirectUri

/** Configuration for the OAuth Resource Owner Protected Credentials flow */
export const OAuthFlowPasswordSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
    tokenUrl: Type.String(),
  }),
  XScalarSecretHTTPSchema,
  XScalarSecretClientSecretSchema,
)

/** Configuration for the OAuth Resource Owner Protected Credentials flow */
export type OAuthFlowPassword = OAuthFlowCommon & {
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
  tokenUrl: string
} & XScalarSecretHTTP &
  XScalarSecretClientSecret

/** Configuration for the OAuth Client Credentials flow */
export const OAuthFlowClientCredentialsSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
    tokenUrl: Type.String(),
  }),
  XScalarSecretClientSecretSchema,
)

/** Configuration for the OAuth Client Credentials flow */
export type OAuthFlowClientCredentials = OAuthFlowCommon & {
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
  tokenUrl: string
} & XScalarSecretClientSecret

/** Configuration for the OAuth Authorization Code flow */
export const OAuthFlowAuthorizationCodeSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
    authorizationUrl: Type.String(),
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
    tokenUrl: Type.String(),
  }),
  XScalarSecretClientSecretSchema,
  XScalarSecretRedirectUriSchema,
  XusePkceSchema,
)

/** Configuration for the OAuth Authorization Code flow */
export type OAuthFlowAuthorizationCode = OAuthFlowCommon & {
  /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
  authorizationUrl: string
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
  tokenUrl: string
} & XScalarSecretClientSecret &
  XScalarSecretRedirectUri &
  XusePkce

/** Union of all OAuth flow schemas */
export const OAuthFlowObjectSchemaDefinition = Type.Union([
  OAuthFlowImplicitSchema,
  OAuthFlowPasswordSchema,
  OAuthFlowClientCredentialsSchema,
  OAuthFlowAuthorizationCodeSchema,
])

export type OAuthFlow = OAuthFlowImplicit | OAuthFlowPassword | OAuthFlowClientCredentials | OAuthFlowAuthorizationCode
