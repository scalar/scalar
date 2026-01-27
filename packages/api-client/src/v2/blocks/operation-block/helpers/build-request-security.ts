import { objectKeys } from '@scalar/helpers/object/object-keys'
import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecretsAuth } from '@scalar/workspace-store/entities/auth/schema'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type {
  OpenApiDocument,
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode } from 'js-base64'

/**
 * Get the selected security schemes from security requirements.
 * Takes security requirement objects and resolves them to actual security scheme objects.
 */
export const getSecuritySchemes = (
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes'],
  selectedSecurity: SecurityRequirementObject[],
): { scheme: SecuritySchemeObject; name: string }[] =>
  selectedSecurity.flatMap((scheme) =>
    objectKeys(scheme).flatMap((key) => {
      const scheme = getResolvedRef(securitySchemes?.[key])
      if (scheme) {
        return { scheme, name: key }
      }

      return []
    }),
  ) ?? []

/**
 * Generates the headers, cookies and query params for selected security schemes
 * In the future we can add customization for where the security is applied
 */
export const buildRequestSecurity = (
  /** Currently selected security for the current operation */
  selectedSecuritySchemes: { scheme: SecuritySchemeObject; name: string }[],
  authStore: AuthStore,
  documentName: string,
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** Include this parameter to set the placeholder for empty tokens */
  emptyTokenPlaceholder = '',
): { headers: Record<string, string>; cookies: XScalarCookie[]; urlParams: URLSearchParams } => {
  const headers: Record<string, string> = {}
  const cookies: XScalarCookie[] = []
  const urlParams = new URLSearchParams()

  const getSecret = <Type extends SecretsAuth[string]['type']>(
    name: string,
    type: Type,
  ): (SecretsAuth[string] & { type: Type }) | undefined => {
    const secret = authStore.getAuthSecrets(documentName, name)
    if (secret?.type !== type) {
      return undefined
    }

    return secret as SecretsAuth[string] & { type: Type }
  }

  const getFlowSecretToken = (schemaName: string) => {
    const secrets = authStore.getAuthSecrets(documentName, schemaName)

    if (secrets?.type !== 'oauth2') {
      return
    }

    return (
      secrets.authorizationCode?.['x-scalar-secret-token'] ??
      secrets.implicit?.['x-scalar-secret-token'] ??
      secrets.clientCredentials?.['x-scalar-secret-token'] ??
      secrets.password?.['x-scalar-secret-token']
    )
  }

  selectedSecuritySchemes.forEach(({ scheme, name: schemeName }) => {
    // Api key
    if (scheme.type === 'apiKey') {
      const secret = getSecret(schemeName, 'apiKey')

      const name = replaceEnvVariables(scheme.name, env)
      const value = replaceEnvVariables(secret?.['x-scalar-secret-token'] ?? '', env) || emptyTokenPlaceholder

      if (scheme.in === 'header') {
        headers[name] = value
      }
      if (scheme.in === 'query') {
        urlParams.append(name, value)
      }
      if (scheme.in === 'cookie') {
        cookies.push(
          coerceValue(xScalarCookieSchema, {
            name,
            value,
            path: '/',
          }),
        )
      }
    }

    // HTTP
    if (scheme.type === 'http') {
      const secret = getSecret(schemeName, 'http')
      if (scheme.scheme === 'basic') {
        const username = replaceEnvVariables(secret?.['x-scalar-secret-username'] ?? '', env)
        const password = replaceEnvVariables(secret?.['x-scalar-secret-password'] ?? '', env)
        const value = `${username}:${password}`

        headers['Authorization'] = `Basic ${value === ':' ? 'username:password' : encode(value)}`
      } else {
        const value = replaceEnvVariables(secret?.['x-scalar-secret-token'] ?? '', env)
        headers['Authorization'] = `Bearer ${value || emptyTokenPlaceholder}`
      }
    }

    // OAuth2
    if (scheme.type === 'oauth2') {
      const token = replaceEnvVariables(getFlowSecretToken(schemeName) ?? '', env)

      headers['Authorization'] = `Bearer ${token || emptyTokenPlaceholder}`
    }
  })

  return { headers, cookies, urlParams }
}
