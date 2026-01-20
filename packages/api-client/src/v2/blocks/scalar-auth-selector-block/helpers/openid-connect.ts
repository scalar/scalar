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
}

/**
 * Fetches the OpenID Connect discovery document from the specified URL.
 * Supports both full discovery URLs and issuer URLs.
 *
 * @param url - The OpenID Connect discovery URL or issuer URL
 * @returns The discovery document or an error
 */
export const fetchOpenIDConnectDiscovery = async (
  url: string,
): Promise<ErrorResponse<OpenIDConnectDiscovery>> => {
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
        new Error(
          `Failed to fetch OpenID Connect discovery document: ${response.status} ${response.statusText}`,
        ),
        null,
      ]
    }

    const data = (await response.json()) as OpenIDConnectDiscovery

    // Validate that we have the essential fields
    if (!data.authorization_endpoint && !data.token_endpoint) {
      return [
        new Error(
          'Invalid OpenID Connect discovery document: missing required endpoints',
        ),
        null,
      ]
    }

    return [null, data]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [
      new Error('Failed to fetch OpenID Connect discovery document'),
      null,
    ]
  }
}
