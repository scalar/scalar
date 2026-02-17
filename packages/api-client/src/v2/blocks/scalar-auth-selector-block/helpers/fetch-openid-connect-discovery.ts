import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { type Static, Type } from '@scalar/typebox'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

import type { ErrorResponse } from '@/libs/errors'

/**
 * OpenID Connect Discovery Document (subset)
 * Represents the metadata fields consumed by the auth selector flow conversion.
 *
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
const OpenIDConnectDiscoverySchema = Type.Object({
  /** URL of the OAuth 2.0 Authorization Endpoint */
  authorization_endpoint: Type.Optional(Type.String()),
  /** URL of the OAuth 2.0 Token Endpoint */
  token_endpoint: Type.Optional(Type.String()),
  /** List of OAuth 2.0 scope values that this server supports */
  scopes_supported: Type.Optional(Type.Array(Type.String())),
  /** List of OAuth 2.0 grant type values that this server supports */
  grant_types_supported: Type.Optional(Type.Array(Type.String())),
  /** Supported PKCE code challenge methods (RFC 7636) */
  code_challenge_methods_supported: Type.Optional(Type.Array(Type.String())),
})

export type OpenIDConnectDiscovery = Static<typeof OpenIDConnectDiscoverySchema>

/**
 * The required scope for OpenID Connect requests.
 * If this scope is present, the request is an OIDC request; otherwise, it is a standard OAuth 2.0 request.
 */
export const OPENID_SCOPE = 'openid'

/**
 * Fetches the OpenID Connect discovery document from the specified URL.
 * Supports both full discovery URLs and issuer URLs.
 *
 * @param url - The OpenID Connect discovery URL or issuer URL
 * @returns The discovery document or an error
 */
export const fetchOpenIDConnectDiscovery = async (
  url: string,
  proxyUrl: string,
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

    const proxiedUrl = redirectToProxy(proxyUrl, discoveryUrl)
    const response = await fetch(proxiedUrl)

    if (!response.ok) {
      return [
        new Error(`Failed to fetch OpenID Connect discovery document: ${response.status} ${response.statusText}`),
        null,
      ]
    }

    const data = coerceValue(OpenIDConnectDiscoverySchema, await response.json())

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
