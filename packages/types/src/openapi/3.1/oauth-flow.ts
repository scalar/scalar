import type { XScalarCredentialsLocation } from '@scalar/types/extensions/security/x-scalar-credentials-location'
import type { XScalarSecurityBody } from '@scalar/types/extensions/security/x-scalar-security-body'
import type { XScalarSecurityQuery } from '@scalar/types/extensions/security/x-scalar-security-query'
import type {
  XScalarAuthUrl,
  XScalarTokenUrl,
} from '@scalar/types/extensions/security/x-scalar-security-secrets'
import type { XTokenName } from '@scalar/types/extensions/security/x-tokenName'
import type { XusePkce } from '@scalar/types/extensions/security/x-use-pkce'

/** Common properties used across all OAuth flows */
type OAuthFlowCommon = {
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  refreshUrl: string
  /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
  scopes: Record<string, string>
} & XScalarSecurityQuery &
  XScalarSecurityBody &
  XTokenName &
  XScalarTokenUrl &
  XScalarAuthUrl

/** Configuration for the OAuth Implicit flow */
export type OAuthFlowImplicit = OAuthFlowCommon & {
  /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  authorizationUrl: string
}

/** Configuration for the OAuth Resource Owner Password flow */
export type OAuthFlowPassword = OAuthFlowCommon & {
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  tokenUrl: string
} & XScalarCredentialsLocation

/** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
export type OAuthFlowClientCredentials = OAuthFlowCommon & {
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  tokenUrl: string
} & XScalarCredentialsLocation

/** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
export type OAuthFlowAuthorizationCode = OAuthFlowCommon & {
  /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  authorizationUrl: string
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  tokenUrl: string
} & XusePkce &
  XScalarCredentialsLocation

export type OAuthFlow = OAuthFlowImplicit | OAuthFlowPassword | OAuthFlowClientCredentials | OAuthFlowAuthorizationCode
