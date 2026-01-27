import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecretsAuth } from '@scalar/workspace-store/entities/auth/schema'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'
import { encode } from 'js-base64'

type ProcessedSecuritySchemesReturn = {
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}

/**
 * Process security schemes into whichever parameters they are applicable to
 *
 * TODO: we probably want to be able to disable YOUR_SECRET_TOKEN placeholder text + or allow it to be customzied
 */
export const processSecuritySchemes = (
  securitySchemes: { scheme: SecuritySchemeObject; name: string }[],
  authStore: AuthStore,
  documentSlug: string,
): ProcessedSecuritySchemesReturn => {
  const result: ProcessedSecuritySchemesReturn = {
    headers: [],
    queryString: [],
    cookies: [],
  }

  const getSecret = <Type extends SecretsAuth[string]['type']>(
    name: string,
    type: Type,
  ): (SecretsAuth[string] & { type: Type }) | undefined => {
    const secret = authStore.getAuthSecrets(documentSlug, name)
    if (secret?.type !== type) {
      return undefined
    }

    return secret as SecretsAuth[string] & { type: Type }
  }

  const getFlowSecretToken = (name: string) => {
    const secret = getSecret(name, 'oauth2')
    return [
      secret?.authorizationCode?.['x-scalar-secret-token'] ??
        secret?.implicit?.['x-scalar-secret-token'] ??
        secret?.clientCredentials?.['x-scalar-secret-token'] ??
        secret?.password?.['x-scalar-secret-token'],
    ].filter((token) => token !== undefined)
  }

  for (const { scheme, name: schemeName } of securitySchemes) {
    const secret = getSecret(schemeName, 'apiKey')
    // Handle apiKey type
    if (scheme.type === 'apiKey') {
      const value = secret?.['x-scalar-secret-token'] ?? 'YOUR_SECRET_TOKEN'
      if (!scheme.name) {
        continue
      }

      const param = { name: scheme.name, value }

      switch (scheme.in) {
        case 'header':
          result.headers.push(param)
          break
        case 'query':
          result.queryString.push(param)
          break
        case 'cookie':
          result.cookies.push(param)
          break
      }
      continue
    }

    // Handle http type
    if (scheme.type === 'http') {
      const secret = getSecret(schemeName, 'http')
      if (scheme.scheme === 'basic') {
        const username = secret?.['x-scalar-secret-username'] ?? ''
        const password = secret?.['x-scalar-secret-password'] ?? ''

        const value = `${username}:${password}`
        const auth = value === ':' ? 'username:password' : encode(value)

        result.headers.push({
          name: 'Authorization',
          value: `Basic ${auth}`,
        })
      } else if (scheme.scheme === 'bearer') {
        const token = secret?.['x-scalar-secret-token'] ?? 'YOUR_SECRET_TOKEN'

        result.headers.push({
          name: 'Authorization',
          value: `Bearer ${token}`,
        })
      }
      continue
    }

    // Handle oauth2 type
    if (scheme.type === 'oauth2' && scheme.flows) {
      // Find the first flow with a token
      const token = getFlowSecretToken(schemeName)[0] || 'YOUR_SECRET_TOKEN'

      result.headers.push({
        name: 'Authorization',
        value: `Bearer ${token}`,
      })
    }
  }

  return result
}
