import type { HarRequest } from 'httpsnippet-lite'
import type { OpenAPIV3 } from 'openapi-types'

import type { AuthenticationState } from '../types'

/**
 * Check whether the given security scheme key is in the `security` configuration for this operation.
 **/
function authenticationRequired(
  security?: OpenAPIV3.SecurityRequirementObject[],
): boolean {
  // If security is not defined, auth is not required.
  if (!security) {
    return false
  }

  // Don’t require auth if security is just an empty array []
  if (Array.isArray(security) && !security.length) {
    return false
  }

  // Includes empty object = auth is not required
  if (
    (security ?? []).some(
      (securityRequirement) => !Object.keys(securityRequirement).length,
    )
  ) {
    return false
  }

  return true
}

/**
 * Get the request object from the authentication state.
 */
export function getRequestFromAuthentication(
  authentication: AuthenticationState,
  security?: OpenAPIV3.SecurityRequirementObject[],
): Partial<HarRequest> {
  const headers: HarRequest['headers'] = []
  const queryString: HarRequest['queryString'] = []
  const cookies: HarRequest['cookies'] = []

  // Check whether auth is required
  if (!authentication.securitySchemeKey || !authenticationRequired(security)) {
    return { headers, queryString, cookies }
  }

  // We’re using a parsed Swagger file here, so let’s get rid of the `ReferenceObject` type
  const securityScheme =
    authentication.securitySchemes?.[authentication.securitySchemeKey]

  if (securityScheme) {
    // API Key
    if (securityScheme.type === 'apiKey') {
      // Header
      if (securityScheme.in === 'header') {
        const token = authentication.apiKey.token.length
          ? authentication.apiKey.token
          : 'YOUR_TOKEN'

        headers.push({
          name: securityScheme.name,
          value: token,
        })
      }
      // Cookie
      else if (securityScheme.in === 'cookie') {
        // TODO: Should we add a dedicated cookie section?
        const token = authentication.apiKey.token.length
          ? authentication.apiKey.token
          : 'YOUR_TOKEN'

        cookies.push({
          name: securityScheme.name,
          value: token,
        })
      }
      // Query
      else if (securityScheme.in === 'query') {
        const token = authentication.apiKey.token.length
          ? authentication.apiKey.token
          : 'YOUR_TOKEN'

        queryString.push({
          name: securityScheme.name,
          value: token,
        })
      }
    }
    // HTTP Header Auth
    else if (
      securityScheme.type === 'http' ||
      securityScheme.type === 'basic'
    ) {
      // Basic Auth
      if (
        securityScheme.type === 'basic' ||
        securityScheme.scheme === 'basic'
      ) {
        headers.push({
          name: 'Authorization',
          value: `Basic ${Buffer.from(
            `${authentication.http.basic.username}:${authentication.http.basic.password}`,
          ).toString('base64')}`,
        })
      }
      // Bearer Auth
      else if (securityScheme.scheme === 'bearer') {
        const token = authentication.http.bearer.token.length
          ? authentication.http.bearer.token
          : 'YOUR_SECRET_TOKEN'

        headers.push({
          name: 'Authorization',
          value: `Bearer ${token}`,
        })
      }
    }
    // TODO: oauth2
    // TODO: openIdConnect
  }

  return { headers, queryString, cookies }
}
