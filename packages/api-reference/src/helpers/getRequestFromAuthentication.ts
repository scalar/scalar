import type { HarRequest } from 'httpsnippet-lite'

import type { AuthenticationState } from '../types'

export function getRequestFromAuthentication(
  authentication: AuthenticationState,
): Partial<HarRequest> {
  const headers = []
  const queryString = []
  const cookies = []

  // Authentication
  if (authentication.securitySchemeKey) {
    // We’re using a parsed Swagger file here, so let’s get rid of the `ReferenceObject` type
    const securityScheme =
      authentication.securitySchemes?.[authentication.securitySchemeKey]

    if (securityScheme) {
      // API Key
      if (securityScheme.type === 'apiKey') {
        // Header
        if (securityScheme.in === 'header') {
          headers.push({
            name: securityScheme.name,
            value: authentication.apiKey.token,
          })
        }
        // Cookie
        else if (securityScheme.in === 'cookie') {
          // TODO: Should we add a dedicated cookie section?
          cookies.push({
            name: securityScheme.name,
            value: authentication.apiKey.token,
          })
        }
        // Query
        else if (securityScheme.in === 'query') {
          queryString.push({
            name: securityScheme.name,
            value: authentication.apiKey.token,
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
          headers.push({
            name: 'Authorization',
            value: `Bearer ${authentication.http.bearer.token}`,
          })
        }
      }
      // TODO: oauth2
      // TODO: openIdConnect
    }
  }

  return { headers, queryString, cookies }
}
