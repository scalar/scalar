import type { AuthenticationState } from '@scalar/oas-utils'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import type { HarRequest } from 'httpsnippet-lite'

import { encodeStringAsBase64 } from './encodeStringAsBase64'

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
  operationSecurity?: (
    | OpenAPIV3.SecurityRequirementObject
    | OpenAPIV3_1.SecurityRequirementObject
  )[],
): Partial<HarRequest> {
  const headers: HarRequest['headers'] = []
  const queryString: HarRequest['queryString'] = []
  const cookies: HarRequest['cookies'] = []

  // Check whether auth is required
  // Custom Security required for users that add auth on the client with none in the spec
  if (
    !authentication.customSecurity &&
    (!authentication.preferredSecurityScheme ||
      !authenticationRequired(operationSecurity))
  ) {
    return { headers, queryString, cookies }
  }

  // Check if the (globally) selected security scheme is allowed for the operation
  const operationAllowsSelectedSecurityScheme = operationSecurity?.some(
    (securityRequirement) =>
      authentication.preferredSecurityScheme &&
      Object.keys(securityRequirement).includes(
        authentication.preferredSecurityScheme,
      ),
  )

  // If the (globally) selected security scheme is not allowed for the operation, use the first available security scheme.
  const operationSecurityKey =
    operationAllowsSelectedSecurityScheme || authentication.customSecurity
      ? authentication.preferredSecurityScheme
      : Object.keys(operationSecurity?.[0] ?? {}).pop()

  // We’re using a parsed OpenAPI file here, so let’s get rid of the `ReferenceObject` type
  const securityScheme =
    authentication.securitySchemes?.[operationSecurityKey ?? '']

  if (securityScheme) {
    // API Key
    if ('type' in securityScheme && securityScheme.type === 'apiKey') {
      // Header
      if ('in' in securityScheme && securityScheme.in === 'header') {
        const token = authentication.apiKey.token?.length
          ? authentication.apiKey.token
          : 'YOUR_TOKEN'

        headers.push({
          name: 'name' in securityScheme ? securityScheme.name : '',
          value: token,
        })
      }
      // Cookie
      else if ('in' in securityScheme && securityScheme.in === 'cookie') {
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
      else if ('in' in securityScheme && securityScheme.in === 'query') {
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
      'type' in securityScheme &&
      // @ts-ignore
      (securityScheme.type === 'http' || securityScheme.type === 'basic')
    ) {
      // Basic Auth
      if (
        'type' in securityScheme &&
        // @ts-ignore
        (securityScheme.type === 'basic' ||
          (securityScheme.type === 'http' && securityScheme.scheme === 'basic'))
      ) {
        const { username, password } = authentication.http.basic

        const token = getBase64Token(username, password)

        headers.push({
          name: 'Authorization',
          value: `Basic ${token}`.trim(),
        })
      }
      // Bearer Auth
      else if (
        'type' in securityScheme &&
        securityScheme.type === 'http' &&
        securityScheme.scheme === 'bearer'
      ) {
        const token = authentication.http.bearer.token.length
          ? authentication.http.bearer.token
          : 'YOUR_SECRET_TOKEN'

        headers.push({
          name: 'Authorization',
          value: `Bearer ${token}`,
        })
      }
    }
    // Oauth2
    else if (
      'type' in securityScheme &&
      securityScheme.type.toLowerCase() === 'oauth2'
    ) {
      const token = authentication.oAuth2.accessToken || 'YOUR_SECRET_TOKEN'

      headers.push({
        name: 'Authorization',
        value: `Bearer ${token}`,
      })
    }
    // TODO: openIdConnect
  }

  return { headers, queryString, cookies }
}

export function getBase64Token(username: string, password: string) {
  return username?.length || password?.length
    ? encodeStringAsBase64(`${username}:${password}`)
    : ''
}

export function getSecretCredentialsFromAuthentication(
  authentication: AuthenticationState,
) {
  return [
    authentication.apiKey.token,
    authentication.http.bearer.token,
    authentication.oAuth2.accessToken,
    // The basic auth token is the base64 encoded username and password
    getBase64Token(
      authentication.http.basic.username,
      authentication.http.basic.password,
    ),
    // The plain text password shouldn’t appear anyway, but just in case
    authentication.http.basic.password,
  ].filter(Boolean)
}
