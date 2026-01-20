import type { ErrorResponse } from '@/libs/errors'

/**
 * OpenID Connect Discovery Document
 * Represents the metadata returned from the .well-known/openid-configuration endpoint
 *
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
export type OpenIDConnectDiscovery = {
  /** URL of the OAuth 2.0 Authorization Endpoint */
  authorization_endpoint?: string
  /** URL of the OAuth 2.0 Token Endpoint */
  token_endpoint?: string
  /** URL of the UserInfo Endpoint */
  userinfo_endpoint?: string
  /** URL of the JSON Web Key Set document */
  jwks_uri?: string
  /** List of OAuth 2.0 scope values that this server supports */
  scopes_supported?: string[]
  /** List of OAuth 2.0 grant type values that this server supports */
  grant_types_supported?: string[]
  /** URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier */
  issuer?: string
  /** List of the OAuth 2.0 response_type values that this OP supports */
  response_types_supported?: string[]
  /** List of Claim Names that the OpenID Provider may be able to supply values for */
  claims_supported?: string[]
  /** Boolean value specifying whether the OP supports use of the claims parameter */
  claims_parameter_supported?: boolean
}

/**
 * OIDC Claims Request structure for the claims parameter.
 * Allows requesting specific claims to be returned in the ID Token or UserInfo response.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#ClaimsParameter
 */
export type OIDCClaimsRequest = {
  /** Claims requested to be returned in the ID Token */
  id_token?: Record<string, OIDCClaimConfig | null>
  /** Claims requested to be returned from the UserInfo Endpoint */
  userinfo?: Record<string, OIDCClaimConfig | null>
}

/**
 * Configuration for an individual claim request.
 * null means the claim is requested voluntarily.
 */
export type OIDCClaimConfig = {
  /** Indicates whether the claim is essential (must be returned) */
  essential?: boolean
  /** Specific value the claim must have */
  value?: string
  /** List of acceptable values for the claim */
  values?: string[]
}

/**
 * Valid OIDC response types.
 * OIDC extends OAuth 2.0 response types with support for id_token.
 */
export type OIDCResponseType =
  | 'code'
  | 'token'
  | 'id_token'
  | 'code id_token'
  | 'code token'
  | 'id_token token'
  | 'code id_token token'

/**
 * The required scope for OpenID Connect requests.
 * If this scope is present, the request is an OIDC request; otherwise, it is a standard OAuth 2.0 request.
 */
export const OPENID_SCOPE = 'openid'

/**
 * Standard OIDC scopes that can be requested in addition to 'openid'.
 */
export const STANDARD_OIDC_SCOPES = ['openid', 'profile', 'email', 'address', 'phone'] as const

/**
 * Determines if a request is an OpenID Connect request based on the scopes.
 * A request is considered OIDC if it includes the 'openid' scope.
 *
 * @param scopes - Array of scope strings or a space-separated scope string
 * @returns true if the request is an OIDC request
 */
export const isOIDCRequest = (scopes: string[] | string): boolean => {
  const scopeArray = Array.isArray(scopes) ? scopes : scopes.split(' ').filter(Boolean)
  return scopeArray.some((scope) => scope.toLowerCase() === OPENID_SCOPE)
}

/**
 * Ensures the 'openid' scope is included in the scopes array for OIDC requests.
 * If 'openid' is not present, it is added at the beginning.
 *
 * @param scopes - Array of scope strings
 * @returns Array of scopes with 'openid' included
 */
export const ensureOpenIDScope = (scopes: string[]): string[] => {
  if (isOIDCRequest(scopes)) {
    return scopes
  }
  return [OPENID_SCOPE, ...scopes]
}

/**
 * Validates that the response_type is valid for OIDC.
 * For OIDC requests (with openid scope), certain response types require an ID token to be returned.
 *
 * @param responseType - The response_type parameter value
 * @param isOIDC - Whether this is an OIDC request (has openid scope)
 * @returns true if the response_type is valid for the request type
 */
export const isValidOIDCResponseType = (responseType: string, isOIDC: boolean): boolean => {
  const validOAuth2ResponseTypes = ['code', 'token']
  const validOIDCResponseTypes: OIDCResponseType[] = [
    'code',
    'token',
    'id_token',
    'code id_token',
    'code token',
    'id_token token',
    'code id_token token',
  ]

  if (isOIDC) {
    return validOIDCResponseTypes.includes(responseType as OIDCResponseType)
  }
  return validOAuth2ResponseTypes.includes(responseType)
}

/**
 * Builds the response_type parameter for OIDC requests.
 * Can combine multiple response types as needed.
 *
 * @param options - Configuration for which response types to include
 * @returns The space-separated response_type string
 */
export const buildOIDCResponseType = (options: { code?: boolean; token?: boolean; idToken?: boolean }): string => {
  const types: string[] = []

  if (options.code) {
    types.push('code')
  }
  if (options.idToken) {
    types.push('id_token')
  }
  if (options.token) {
    types.push('token')
  }

  return types.join(' ')
}

/**
 * Builds the claims parameter for OIDC requests.
 * The claims parameter allows requesting specific user profile details in the ID Token or UserInfo response.
 *
 * @param claims - The claims request object
 * @returns JSON string representation of the claims parameter, or null if no claims are specified
 */
export const buildClaimsParameter = (claims: OIDCClaimsRequest): string | null => {
  if (!claims.id_token && !claims.userinfo) {
    return null
  }

  // Filter out empty objects
  const filteredClaims: OIDCClaimsRequest = {}

  if (claims.id_token && Object.keys(claims.id_token).length > 0) {
    filteredClaims.id_token = claims.id_token
  }
  if (claims.userinfo && Object.keys(claims.userinfo).length > 0) {
    filteredClaims.userinfo = claims.userinfo
  }

  if (Object.keys(filteredClaims).length === 0) {
    return null
  }

  return JSON.stringify(filteredClaims)
}

/**
 * Parses a claims parameter string back into an OIDCClaimsRequest object.
 *
 * @param claimsString - The JSON string representation of claims
 * @returns The parsed claims request, or null if invalid
 */
export const parseClaimsParameter = (claimsString: string): OIDCClaimsRequest | null => {
  try {
    const parsed = JSON.parse(claimsString) as OIDCClaimsRequest
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Fetches the OpenID Connect discovery document from the specified URL.
 * Supports both full discovery URLs and issuer URLs.
 *
 * @param url - The OpenID Connect discovery URL or issuer URL
 * @returns The discovery document or an error
 */
export const fetchOpenIDConnectDiscovery = async (url: string): Promise<ErrorResponse<OpenIDConnectDiscovery>> => {
  try {
    // If the URL does not end with the well-known path, append it
    let discoveryUrl = url.trim()

    if (!discoveryUrl) {
      return [new Error('URL cannot be empty'), null]
    }

    // Remove trailing slash if present
    if (discoveryUrl.endsWith('/')) {
      discoveryUrl = discoveryUrl.slice(0, -1)
    }

    // If the URL does not already include the well-known path, append it
    if (!discoveryUrl.includes('/.well-known/openid-configuration')) {
      discoveryUrl = `${discoveryUrl}/.well-known/openid-configuration`
    }

    const response = await fetch(discoveryUrl)

    if (!response.ok) {
      return [
        new Error(`Failed to fetch OpenID Connect discovery document: ${response.status} ${response.statusText}`),
        null,
      ]
    }

    const data = (await response.json()) as OpenIDConnectDiscovery

    // Validate that we have the essential fields
    if (!data.authorization_endpoint && !data.token_endpoint) {
      return [new Error('Invalid OpenID Connect discovery document: missing required endpoints'), null]
    }

    return [null, data]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [new Error('Failed to fetch OpenID Connect discovery document'), null]
  }
}
