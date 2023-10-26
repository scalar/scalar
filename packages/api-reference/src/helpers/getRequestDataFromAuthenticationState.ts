import type { Query } from '@scalar/api-client'
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

import type { AuthenticationState, Header } from '../types'

export function getRequestDataFromAuthenticationState(
  authentication: AuthenticationState,
): { headers: Header[]; query: Query[] } {
  const headers = []
  const query = []

  // Authentication
  // TODO: Prefill AuthState, not the headers
  if (authentication.securitySchemeKey) {
    // We’re using a parsed Swagger file here, so let’s get rid of the `ReferenceObject` type
    // @ts-ignore
    const securityScheme = authentication.securitySchemes?.[
      authentication.securitySchemeKey
    ] as
      | OpenAPIV2.SecuritySchemeObject
      | OpenAPIV3.SecuritySchemeObject
      | OpenAPIV3_1.SecuritySchemeObject

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
          headers.push({
            name: 'Cookie',
            value: `${securityScheme.name}=${authentication.apiKey.token}`,
          })
        }
        // Query
        else if (securityScheme.in === 'query') {
          query.push({
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

  return { headers, query }
}
