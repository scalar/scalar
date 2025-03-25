import type { AuthenticationConfiguration } from '@/api-reference/authentication-configuration.ts'
import type { Oauth2FlowPayload } from '@/entities/security-scheme.ts'
import type { AuthenticationState, OpenAPIV2, OpenAPIV3_1 } from '@/legacy/reference-config.ts'
import type { Entries } from 'type-fest'

/** Migrates scope array to an object */
const migrateScopes = (scopes: string[] | undefined) => {
  if (!scopes) {
    return {}
  }

  return scopes.reduce(
    (acc, scope) => {
      acc[scope] = ''
      return acc
    },
    {} as Record<string, string>,
  )
}

/** Upgrade the authentication config from the old to version 2 */
export const migrateAuth = (
  auth: AuthenticationState = {},
  securitySchemes: Record<string, OpenAPIV2.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject> = {},
): AuthenticationConfiguration => {
  if (!auth || Object.keys(auth).length === 0) {
    return {}
  }

  console.warn(
    `DEPRECATION WARNING: It looks like you're using legacy authentication config. Please migrate to use the updated config. See https://github.com/scalar/scalar/blob/main/documentation/configuration.md#authentication-partial`,
  )

  const securitySchemesEntries = Object.entries(securitySchemes) as Entries<typeof securitySchemes>

  // We have security schemes
  const result: AuthenticationConfiguration & {
    securitySchemes: NonNullable<AuthenticationConfiguration['securitySchemes']>
  } = {
    securitySchemes: {},
  }

  // Handle HTTP Basic auth
  if (auth.http?.basic) {
    const basicScheme = securitySchemesEntries.find(([_, scheme]) => {
      // Handle OpenAPIV3
      if ('type' in scheme) {
        return scheme.type === 'http' && scheme.scheme === 'basic'
      }
      // Handle OpenAPIV2
      if ('type' in scheme && scheme.type === 'basic') {
        return true
      }
      return false
    })
    if (basicScheme) {
      const [key] = basicScheme
      result.securitySchemes[key] = {
        type: 'http',
        scheme: 'basic',
        nameKey: key,
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
        nameKey: key,
        token: auth.http.bearer.token,
      }
    }
  }

  // Handle API Key auth
  if (auth.apiKey) {
    const apiKeyScheme = securitySchemesEntries.find(([_, scheme]) => scheme.type === 'apiKey')
    if (apiKeyScheme) {
      const [key, scheme] = apiKeyScheme as [string, OpenAPIV2.SecuritySchemeApiKey | OpenAPIV3_1.ApiKeySecurityScheme]
      result.securitySchemes[key] = {
        type: 'apiKey',
        value: auth.apiKey.token,
        nameKey: key,
        name: scheme.name,
        // @ts-expect-error This will get parsed
        in: scheme.in,
      }
    }
  }

  // Handle OAuth2
  if (auth.oAuth2) {
    const oauth2Scheme = securitySchemesEntries.find(([_, scheme]) => scheme.type === 'oauth2')
    if (oauth2Scheme) {
      const [key, scheme] = oauth2Scheme
      const flows: Record<string, Oauth2FlowPayload> = {}

      // OpenAPIV3
      if ('flows' in scheme) {
        if (scheme.flows?.password) {
          flows.password = {
            type: 'password',
            tokenUrl: scheme.flows.password.tokenUrl,
            scopes: migrateScopes(auth.oAuth2.scopes),
            selectedScopes: auth.oAuth2.scopes,
            token: auth.oAuth2.accessToken,
            username: auth.oAuth2.username,
            password: auth.oAuth2.password,
            'x-scalar-client-id': auth.oAuth2.clientId ?? '',
          }
        }

        if (scheme.flows?.implicit) {
          flows.implicit = {
            type: 'implicit',
            authorizationUrl: scheme.flows.implicit.authorizationUrl,
            scopes: migrateScopes(auth.oAuth2.scopes),
            selectedScopes: auth.oAuth2.scopes,
            token: auth.oAuth2.accessToken,
            'x-scalar-client-id': auth.oAuth2.clientId ?? '',
          }
        }
      }
      // OpenAPIV2
      else {
        const v2Scheme = scheme as OpenAPIV2.SecuritySchemeOauth2
        if (v2Scheme.flow === 'password') {
          flows.password = {
            type: 'password',
            tokenUrl: v2Scheme.tokenUrl,
            scopes: migrateScopes(auth.oAuth2.scopes),
            selectedScopes: auth.oAuth2.scopes,
            token: auth.oAuth2.accessToken,
            username: auth.oAuth2.username,
            password: auth.oAuth2.password,
            'x-scalar-client-id': auth.oAuth2.clientId ?? '',
          }
        }

        if (v2Scheme.flow === 'implicit') {
          flows.implicit = {
            type: 'implicit',
            authorizationUrl: v2Scheme.authorizationUrl,
            scopes: migrateScopes(auth.oAuth2.scopes),
            selectedScopes: auth.oAuth2.scopes,
            token: auth.oAuth2.accessToken,
            'x-scalar-client-id': auth.oAuth2.clientId ?? '',
          }
        }
      }

      result.securitySchemes[key] = {
        type: 'oauth2',
        flows,
        nameKey: key,
      }
    }
  }

  // Handle preferred security scheme
  if (auth.preferredSecurityScheme) {
    result.preferredSecurityScheme = auth.preferredSecurityScheme
  }

  return result
}
