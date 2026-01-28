import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode } from 'js-base64'

import {
  getFlowsSecretToken,
  getSecrets as getSecretsHelper,
} from '@/v2/blocks/scalar-auth-selector-block/helpers/get-secrets'

/** Extract secrets from security schemes */
export const getSecrets = (
  securitySchemes: { scheme: SecuritySchemeObject; name: string }[],
  authStore: AuthStore,
  documentSlug: string,
): string[] => {
  return securitySchemes
    .flatMap(({ scheme, name: schemeName }) => {
      if (scheme.type === 'apiKey') {
        const secret = getSecretsHelper({ schemeName, type: 'apiKey', authStore, documentSlug })
        return secret?.['x-scalar-secret-token'] ?? ''
      }
      if (scheme.type === 'http') {
        const secret = getSecretsHelper({ schemeName, type: 'http', authStore, documentSlug })
        return [
          secret?.['x-scalar-secret-token'] ?? '',
          secret?.['x-scalar-secret-username'] ?? '',
          secret?.['x-scalar-secret-password'] ?? '',
          encode(`${secret?.['x-scalar-secret-username'] ?? ''}:${secret?.['x-scalar-secret-password'] ?? ''}`),
        ]
      }
      if (scheme.type === 'oauth2') {
        return getFlowsSecretToken({ schemeName, authStore, documentSlug })
      }

      return []
    })
    .filter(Boolean)
}
