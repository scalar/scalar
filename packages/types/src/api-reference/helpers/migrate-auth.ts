import type { AuthenticationConfiguration } from '@/api-reference/authentication-configuration.ts'
import type { AuthenticationState, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@/legacy/reference-config.ts'
import type { Entries } from 'type-fest'

/** Upgrade the authentication config from the old to version 2 */
export const transformAuth = (
  auth: AuthenticationState = {},
  securitySchemes:
    | OpenAPIV2.SecurityDefinitionsObject
    | OpenAPIV3.ComponentsObject['securitySchemes']
    | OpenAPIV3_1.ComponentsObject['securitySchemes'] = {},
): AuthenticationConfiguration => {
  if (!auth || Object.keys(auth).length === 0) {
    return {}
  }

  const securitySchemesEntries = Object.entries(securitySchemes) as Entries<typeof securitySchemes>

  // We have security schemes
  const result: AuthenticationConfiguration & {
    securitySchemes: NonNullable<AuthenticationConfiguration['securitySchemes']>
  } = {
    securitySchemes: {},
  }

  // Handle HTTP Basic auth
  if (auth.http?.basic) {
    const basicScheme = securitySchemesEntries.find(
      ([_, scheme]) => scheme.type === 'http' && scheme.scheme === 'basic',
    )
    if (basicScheme) {
      const [key] = basicScheme
      result.securitySchemes[key] = {
        type: 'http',
        scheme: 'basic',
        username: auth.http.basic.username,
        password: auth.http.basic.password,
      }
    }
  }

  // Handle HTTP Bearer auth
  if (auth.http?.bearer) {
    const bearerScheme = securitySchemesEntries.find(
      ([_, scheme]) => scheme.type === 'http' && scheme.scheme === 'bearer',
    )
    if (bearerScheme) {
      const [key] = bearerScheme
      result.securitySchemes[key] = {
        type: 'http',
        scheme: 'bearer',
        token: auth.http.bearer.token,
      }
    }
  }

  // Handle API Key auth
  if (auth.apiKey) {
    const apiKeyScheme = securitySchemesEntries.find(([_, scheme]) => scheme.type === 'apiKey')
    if (apiKeyScheme) {
      const [key, scheme] = apiKeyScheme
      result.securitySchemes[key] = {
        type: 'apiKey',
        in: scheme.in,
        name: scheme.name,
        value: auth.apiKey.token,
      }
    }
  }

  // Handle OAuth2
  if (auth.oAuth2) {
    const oauth2Scheme = securitySchemesEntries.find(([_, scheme]) => scheme.type === 'oauth2')
    if (oauth2Scheme) {
      const [key, scheme] = oauth2Scheme
      const flows: any = {}

      if (scheme.flows?.password) {
        flows.password = {
          type: 'password',
          tokenUrl: scheme.flows.password.tokenUrl,
          selectedScopes: auth.oAuth2.scopes,
          token: auth.oAuth2.accessToken,
          username: auth.oAuth2.username,
          password: auth.oAuth2.password,
          'x-scalar-client-id': auth.oAuth2.clientId,
        }
      }

      if (scheme.flows?.implicit) {
        flows.implicit = {
          type: 'implicit',
          authorizationUrl: scheme.flows.implicit.authorizationUrl,
          selectedScopes: auth.oAuth2.scopes,
          token: auth.oAuth2.accessToken,
          'x-scalar-client-id': auth.oAuth2.clientId,
        }
      }

      result.securitySchemes[key] = {
        type: 'oauth2',
        flows,
      }
    }
  }

  // Handle preferred security scheme
  if (auth.preferredSecurityScheme) {
    result.preferredSecurityScheme = auth.preferredSecurityScheme
  }

  return result
}
