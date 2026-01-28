import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecretsApiKey, SecretsHttp, SecretsOAuth } from '@scalar/workspace-store/entities/auth/schema'

import { getSecrets } from '@/v2/blocks/scalar-auth-selector-block/helpers/get-secrets'

/**
 * Mapping of field names to their corresponding x-scalar-secret extension names.
 */
const SECRET_FIELD_MAPPINGS = {
  clientSecret: 'x-scalar-secret-client-secret',
  password: 'x-scalar-secret-password',
  token: 'x-scalar-secret-token',
  username: 'x-scalar-secret-username',
  value: 'x-scalar-secret-token',
  'x-scalar-client-id': 'x-scalar-secret-client-id',
  'x-scalar-redirect-uri': 'x-scalar-secret-redirect-uri',
} as const

/**
 * Extracts secret fields from a security scheme configuration.
 * Maps original field names to their x-scalar-secret extension equivalents.
 */
const extractSecretFields = (input: Record<string, unknown>): Record<string, string> => {
  return objectEntries(SECRET_FIELD_MAPPINGS).reduce<Record<string, string>>((result, [field, secretField]) => {
    const value = input[field]
    if (value !== undefined && typeof value === 'string') {
      result[secretField] = value
    }
    return result
  }, {})
}

export const extractSecuritySchemeSecrets = ({
  documentSlug,
  authStore,
  configSecuritySchemes,
  documentSecuritySchemes = {},
}: {
  documentSlug: string
  authStore: AuthStore
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes']
  documentSecuritySchemes?: Record<string, any>
}) => {
  objectEntries(configSecuritySchemes ?? {}).forEach(([nameKey, scheme]) => {
    /** Get the type from the document security scheme if not present in config */
    const schemeType = scheme.type ?? documentSecuritySchemes[nameKey]?.type

    if (schemeType === 'apiKey') {
      const secrets = getSecrets({ schemeName: nameKey, type: 'apiKey', authStore, documentSlug })

      const newSecrets: SecretsApiKey = {
        type: 'apiKey',
        'x-scalar-secret-token': '',
        ...(secrets ?? {}),
        ...extractSecretFields(scheme),
      }

      authStore.setAuthSecrets(documentSlug, nameKey, newSecrets)
    }

    if (schemeType === 'http') {
      const secrets = getSecrets({ schemeName: nameKey, type: 'http', authStore, documentSlug })

      const newSecrets: SecretsHttp = {
        type: 'http',
        'x-scalar-secret-password': '',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        ...(secrets ?? {}),
        ...extractSecretFields(scheme),
      }

      authStore.setAuthSecrets(documentSlug, nameKey, newSecrets)
    }

    if (schemeType === 'oauth2') {
      const secrets = getSecrets({ schemeName: nameKey, type: 'oauth2', authStore, documentSlug })

      const flows = (scheme as any).flows ?? {}

      const implicit = flows.implicit
        ? {
            ...(secrets?.implicit ?? {}),
            ...extractSecretFields(flows.implicit),
          }
        : undefined
      const password = flows.password
        ? {
            ...(secrets?.password ?? {}),
            ...extractSecretFields(flows.password),
          }
        : undefined
      const clientCredentials = flows.clientCredentials
        ? {
            ...(secrets?.clientCredentials ?? {}),
            ...extractSecretFields(flows.clientCredentials),
          }
        : undefined
      const authorizationCode = flows.authorizationCode
        ? {
            ...(secrets?.authorizationCode ?? {}),
            ...extractSecretFields(flows.authorizationCode),
          }
        : undefined

      const newSecrets: SecretsOAuth = {
        type: 'oauth2',
        implicit: implicit
          ? {
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
              ...implicit,
            }
          : undefined,
        password: password
          ? {
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-username': '',
              'x-scalar-secret-password': '',
              'x-scalar-secret-token': '',
              ...password,
            }
          : undefined,
        clientCredentials: clientCredentials
          ? {
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-token': '',
              ...clientCredentials,
            }
          : undefined,
        authorizationCode: authorizationCode
          ? {
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
              ...authorizationCode,
            }
          : undefined,
      }

      authStore.setAuthSecrets(documentSlug, nameKey, newSecrets)
    }
  })
}
