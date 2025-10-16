import { fetchWithProxyFallback } from './fetch-with-proxy-fallback'

/**
 * OIDC Discovery Document structure based on OpenID Connect Discovery 1.0 spec
 * https://openid.net/specs/openid-connect-discovery-1_0.html
 */
export type OidcDiscoveryDocument = {
  /** REQUIRED. URL of the OAuth 2.0 Authorization Endpoint */
  authorization_endpoint: string
  /** REQUIRED. URL of the OAuth 2.0 Token Endpoint */
  token_endpoint: string
  /** RECOMMENDED. JSON array containing a list of the OAuth 2.0 Grant Type values that this OP supports */
  grant_types_supported?: string[]
  /** RECOMMENDED. JSON array containing a list of the OAuth 2.0 [RFC6749] scope values that this server supports */
  scopes_supported?: string[]
}

/**
 * OAuth2 flow configuration extracted from OIDC discovery
 */
export type OidcToOAuth2Flow = {
  authorizationUrl: string
  tokenUrl: string
  scopes: Record<string, string>
}

/**
 * Result of OIDC discovery transformation
 */
export type OidcDiscoveryResult = {
  /** OAuth2 flows generated from the discovery document */
  flows: {
    authorizationCode?: OidcToOAuth2Flow
    implicit?: OidcToOAuth2Flow
    clientCredentials?: OidcToOAuth2Flow
    password?: OidcToOAuth2Flow
  }
}

/**
 * Fetches and parses an OpenID Connect discovery document from the well-known URL.
 *
 * @param openIdConnectUrl - The URL to the OIDC discovery document (typically /.well-known/openid-configuration)
 * @param proxyUrl - Optional proxy URL for CORS handling
 * @returns Parsed OIDC discovery document
 * @throws Error if the fetch fails or the response is invalid
 *
 * @example
 * const discovery = await fetchOidcDiscovery(
 *   'https://auth.example.com/.well-known/openid-configuration'
 * )
 * console.log(discovery.authorization_endpoint)
 */
export async function fetchOidcDiscovery(openIdConnectUrl: string, proxyUrl?: string): Promise<OidcDiscoveryDocument> {
  try {
    const response = await fetchWithProxyFallback(openIdConnectUrl, { proxyUrl })

    if (!response.ok) {
      throw new Error(`Failed to fetch OIDC discovery document from ${openIdConnectUrl} (Status: ${response.status})`)
    }

    const discovery = (await response.json()) as OidcDiscoveryDocument

    // Validate required fields per OIDC spec
    if (!discovery.authorization_endpoint || !discovery.token_endpoint) {
      throw new Error('Invalid OIDC discovery document: missing required authorization_endpoint or token_endpoint')
    }

    return discovery
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching OIDC discovery document'

    throw new Error(`OIDC Discovery failed: ${message}`)
  }
}

/**
 * Converts OIDC scopes array to OAuth2 scopes object format.
 *
 * @param scopesSupported - Array of supported scopes from OIDC discovery
 * @returns OAuth2 scopes object with scope names as descriptions
 */
function convertScopesToOAuth2Format(scopesSupported?: string[]): Record<string, string> {
  if (!scopesSupported || scopesSupported.length === 0) {
    return {}
  }

  return scopesSupported.reduce(
    (acc, scope) => {
      acc[scope] = scope
      return acc
    },
    {} as Record<string, string>,
  )
}

/**
 * Creates an OAuth2 flow configuration from OIDC discovery data.
 *
 * @param discovery - The OIDC discovery document
 * @returns OAuth2 flow configuration
 */
function createOAuth2Flow(discovery: OidcDiscoveryDocument): OidcToOAuth2Flow {
  return {
    authorizationUrl: discovery.authorization_endpoint,
    tokenUrl: discovery.token_endpoint,
    scopes: convertScopesToOAuth2Format(discovery.scopes_supported),
  }
}

/**
 * Transforms an OIDC discovery document into OAuth2 flows based on supported grant types.
 *
 * This function maps OIDC grant types to OAuth2 flow types:
 * - authorization_code → authorizationCode
 * - implicit → implicit
 * - client_credentials → clientCredentials
 * - password → password
 *
 * @param discovery - The OIDC discovery document
 * @returns OAuth2 flows configuration
 *
 * @example
 * const result = transformOidcToOAuth2(discovery)
 * // result.flows.authorizationCode will exist if 'authorization_code' is in grant_types_supported
 */
export function transformOidcToOAuth2(discovery: OidcDiscoveryDocument): OidcDiscoveryResult {
  const grantTypes = discovery.grant_types_supported || []
  const flows: OidcDiscoveryResult['flows'] = {}

  // Map OIDC grant types to OAuth2 flows
  if (grantTypes.includes('authorization_code')) {
    flows.authorizationCode = createOAuth2Flow(discovery)
  }

  if (grantTypes.includes('implicit')) {
    flows.implicit = createOAuth2Flow(discovery)
  }

  if (grantTypes.includes('client_credentials')) {
    flows.clientCredentials = createOAuth2Flow(discovery)
  }

  if (grantTypes.includes('password')) {
    flows.password = createOAuth2Flow(discovery)
  }

  return { flows }
}
