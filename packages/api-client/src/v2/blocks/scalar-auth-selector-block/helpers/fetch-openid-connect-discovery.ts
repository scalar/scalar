import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'

import type { ErrorResponse } from '@/libs/errors'

/**
 * OpenID Connect Discovery Document
 * Represents the metadata returned from the .well-known/openid-configuration endpoint
 *
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
export type OpenIDConnectDiscovery = {
  /** URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier */
  issuer?: string
  /** URL of the OAuth 2.0 Authorization Endpoint */
  authorization_endpoint?: string
  /** URL of the OAuth 2.0 Device Authorization Endpoint (RFC 8628) */
  device_authorization_endpoint?: string
  /** URL of the OAuth 2.0 Token Endpoint */
  token_endpoint?: string
  /** URL of the UserInfo Endpoint */
  userinfo_endpoint?: string
  /** URL of the OAuth 2.0 revocation endpoint */
  revocation_endpoint?: string
  /** URL of the OAuth 2.0 introspection endpoint */
  introspection_endpoint?: string
  /** URL of the Dynamic Client Registration endpoint */
  registration_endpoint?: string
  /** URL of the JSON Web Key Set document */
  jwks_uri?: string
  /** URL of the OAuth 2.0 pushed authorization request endpoint (RFC 9126) */
  pushed_authorization_request_endpoint?: string
  /** Mapping of endpoint aliases for mutual-TLS (RFC 8705) */
  mtls_endpoint_aliases?: Record<string, string>
  /** List of OAuth 2.0 scope values that this server supports */
  scopes_supported?: string[]
  /** List of OAuth 2.0 response_type values that this OP supports */
  response_types_supported?: string[]
  /** List of OAuth 2.0 response_mode values that this OP supports */
  response_modes_supported?: string[]
  /** List of OAuth 2.0 grant type values that this server supports */
  grant_types_supported?: string[]
  /** Supported subject identifier types */
  subject_types_supported?: string[]
  /** Supported ID Token signing algorithms */
  id_token_signing_alg_values_supported?: string[]
  /** Supported ID Token JWE key management algorithms */
  id_token_encryption_alg_values_supported?: string[]
  /** Supported ID Token JWE content encryption algorithms */
  id_token_encryption_enc_values_supported?: string[]
  /** Supported UserInfo signing algorithms */
  userinfo_signing_alg_values_supported?: string[]
  /** Supported UserInfo JWE key management algorithms */
  userinfo_encryption_alg_values_supported?: string[]
  /** Supported UserInfo JWE content encryption algorithms */
  userinfo_encryption_enc_values_supported?: string[]
  /** Supported request object signing algorithms */
  request_object_signing_alg_values_supported?: string[]
  /** Supported request object JWE key management algorithms */
  request_object_encryption_alg_values_supported?: string[]
  /** Supported request object JWE content encryption algorithms */
  request_object_encryption_enc_values_supported?: string[]
  /** Supported token endpoint authentication methods */
  token_endpoint_auth_methods_supported?: string[]
  /** Supported token endpoint authentication signing algorithms */
  token_endpoint_auth_signing_alg_values_supported?: string[]
  /** Supported revocation endpoint authentication methods */
  revocation_endpoint_auth_methods_supported?: string[]
  /** Supported revocation endpoint authentication signing algorithms */
  revocation_endpoint_auth_signing_alg_values_supported?: string[]
  /** Supported introspection endpoint authentication methods */
  introspection_endpoint_auth_methods_supported?: string[]
  /** Supported introspection endpoint authentication signing algorithms */
  introspection_endpoint_auth_signing_alg_values_supported?: string[]
  /** Supported PKCE code challenge methods (RFC 7636) */
  code_challenge_methods_supported?: string[]
  /** Supported display parameter values */
  display_values_supported?: string[]
  /** Supported claim types */
  claim_types_supported?: string[]
  /** List of Claim Names that the OpenID Provider may be able to supply values for */
  claims_supported?: string[]
  /** Supported Authentication Context Class Reference values */
  acr_values_supported?: string[]
  /** Supported BCP47 language tags for claims */
  claims_locales_supported?: string[]
  /** Supported BCP47 language tags for UI */
  ui_locales_supported?: string[]
  /** URL of a human-readable service documentation page */
  service_documentation?: string
  /** URL of the OP policy page */
  op_policy_uri?: string
  /** URL of the OP terms of service page */
  op_tos_uri?: string
  /** Boolean value specifying whether the OP supports use of the claims parameter */
  claims_parameter_supported?: boolean
  /** Boolean value specifying whether the OP supports use of the request parameter */
  request_parameter_supported?: boolean
  /** Boolean value specifying whether the OP supports use of the request_uri parameter */
  request_uri_parameter_supported?: boolean
  /** Boolean value specifying whether request_uri registration is required */
  require_request_uri_registration?: boolean
  /** Boolean indicating support for authorization response iss parameter */
  authorization_response_iss_parameter_supported?: boolean
  /** Supported DPoP signing algorithms (RFC 9449) */
  dpop_signing_alg_values_supported?: string[]
}

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
