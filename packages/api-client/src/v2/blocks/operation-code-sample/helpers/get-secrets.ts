import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecretsAuth } from '@scalar/workspace-store/entities/auth/schema'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode } from 'js-base64'

/** Extract secrets from security schemes */
export const getSecrets = (
  securitySchemes: { scheme: SecuritySchemeObject; name: string }[],
  authStore: AuthStore,
  documentSlug: string,
): string[] => {
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

  return securitySchemes
    .flatMap(({ scheme, name: schemeName }) => {
      if (scheme.type === 'apiKey') {
        const secret = getSecret(schemeName, 'apiKey')
        return secret?.['x-scalar-secret-token'] ?? ''
      }
      if (scheme?.type === 'http') {
        const secret = getSecret(schemeName, 'http')
        return [
          secret?.['x-scalar-secret-token'] ?? '',
          secret?.['x-scalar-secret-username'] ?? '',
          secret?.['x-scalar-secret-password'] ?? '',
          encode(`${secret?.['x-scalar-secret-username'] ?? ''}:${secret?.['x-scalar-secret-password'] ?? ''}`),
        ]
      }
      if (scheme.type === 'oauth2') {
        return getFlowSecretToken(schemeName)
      }

      return []
    })
    .filter(Boolean)
}
