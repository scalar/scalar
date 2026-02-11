/**
 * Common properties used across all AsyncAPI OAuth flows.
 * Note: AsyncAPI uses availableScopes instead of scopes.
 */
type OAuthFlowCommon = {
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of an absolute URL. */
  refreshUrl?: string
  /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. */
  availableScopes: Record<string, string>
}

/** Configuration for the OAuth Implicit flow */
export type OAuthFlowImplicitObject = OAuthFlowCommon & {
  /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
  authorizationUrl: string
}

/** Configuration for the OAuth Resource Owner Protected Credentials flow */
export type OAuthFlowPasswordObject = OAuthFlowCommon & {
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
  tokenUrl: string
}

/** Configuration for the OAuth Client Credentials flow */
export type OAuthFlowClientCredentialsObject = OAuthFlowCommon & {
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
  tokenUrl: string
}

/** Configuration for the OAuth Authorization Code flow */
export type OAuthFlowAuthorizationCodeObject = OAuthFlowCommon & {
  /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
  authorizationUrl: string
  /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
  tokenUrl: string
}

export type OAuthFlowObject =
  | OAuthFlowImplicitObject
  | OAuthFlowPasswordObject
  | OAuthFlowClientCredentialsObject
  | OAuthFlowAuthorizationCodeObject
