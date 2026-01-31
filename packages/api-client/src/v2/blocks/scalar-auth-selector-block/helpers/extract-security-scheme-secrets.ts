import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecretsAuth } from '@scalar/workspace-store/entities/auth/schema'
import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from '@scalar/workspace-store/schemas/v3.1/strict/oauth-flow'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type {
  ApiKeyObjectSecret,
  HttpObjectSecret,
  OAuth2ObjectSecret,
  OAuthFlowAuthorizationCodeSecret,
  OAuthFlowClientCredentialsSecret,
  OAuthFlowImplicitSecret,
  OAuthFlowPasswordSecret,
  OAuthFlowsObjectSecret,
  OpenIdConnectObjectSecret,
  SecuritySchemeObjectSecret,
} from './secret-types'

export const getSecrets = <Type extends SecretsAuth[string]['type']>({
  schemeName,
  authStore,
  documentSlug,
  type,
}: {
  schemeName: string
  type: Type
  authStore: AuthStore
  documentSlug: string
}): (SecretsAuth[string] & { type: Type }) | undefined => {
  const secret = authStore.getAuthSecrets(documentSlug, schemeName)
  if (secret?.type !== type) {
    return undefined
  }

  return secret as (SecretsAuth[string] & { type: Type }) | undefined
}

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
const extractSecretFields = (input: Record<string, unknown>): Record<string, string> =>
  objectEntries(SECRET_FIELD_MAPPINGS).reduce<Record<string, string>>((result, [field, secretField]) => {
    const value = input[field]
    if (value !== undefined && typeof value === 'string') {
      result[secretField] = value
    }
    return result
  }, {})

/** Extract the secrets from the config and the auth store */
export const extractSecuritySchemeSecrets = (
  // Include the config fields
  scheme: SecuritySchemeObject,
  authStore: AuthStore,
  name: string,
  documentSlug: string,
): SecuritySchemeObjectSecret => {
  // Handle API Key security schemes
  if (scheme.type === 'apiKey') {
    const secrets = getSecrets({ schemeName: name, type: 'apiKey', authStore, documentSlug })
    return {
      ...scheme,
      'x-scalar-secret-token': '',
      ...extractSecretFields(scheme),
      ...secrets,
    } as ApiKeyObjectSecret
  }

  // Handle HTTP Auth security schemes (e.g., Basic, Bearer)
  if (scheme.type === 'http') {
    const secrets = getSecrets({ schemeName: name, type: 'http', authStore, documentSlug })
    return {
      ...scheme,
      'x-scalar-secret-password': '',
      'x-scalar-secret-token': '',
      'x-scalar-secret-username': '',
      ...extractSecretFields(scheme),
      ...secrets,
    } satisfies HttpObjectSecret
  }

  // Handle OAuth2 security schemes and all supported flows
  if (scheme.type === 'oauth2') {
    const secrets = getSecrets({ schemeName: name, type: 'oauth2', authStore, documentSlug })

    /** Ensure we grab any selected scopes from the  */
    const selectedScopes = new Set<string>()

    return {
      ...scheme,
      flows: objectEntries(scheme.flows).reduce((acc, [key, flow]) => {
        if (!flow) {
          return acc
        }

        // Store any selected scopes from the config
        if ('selectedScopes' in flow && Array.isArray(flow.selectedScopes)) {
          flow.selectedScopes?.forEach((scope) => selectedScopes.add(scope))
        }

        // Implicit flow
        if (key === 'implicit') {
          acc.implicit = {
            ...(flow as OAuthFlowImplicit),
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-redirect-uri': '',
            'x-scalar-secret-token': '',
            ...extractSecretFields(flow),
            ...secrets?.implicit,
          } satisfies OAuthFlowImplicitSecret
        }

        // Password flow
        if (key === 'password') {
          acc[key] = {
            ...(flow as OAuthFlowPassword),
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-token': '',
            ...extractSecretFields(flow),
            ...secrets?.password,
          } satisfies OAuthFlowPasswordSecret
        }

        // Client credentials flow
        if (key === 'clientCredentials') {
          acc[key] = {
            ...(flow as OAuthFlowClientCredentials),
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-token': '',
            ...extractSecretFields(flow),
            ...secrets?.clientCredentials,
          } satisfies OAuthFlowClientCredentialsSecret
        }

        // Authorization code flow
        if (key === 'authorizationCode') {
          acc[key] = {
            ...(flow as OAuthFlowAuthorizationCode),
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
            'x-scalar-secret-token': '',
            ...secrets?.authorizationCode,
          } satisfies OAuthFlowAuthorizationCodeSecret
        }

        return acc
      }, {} as OAuthFlowsObjectSecret),
      'x-default-scopes': Array.from(selectedScopes),
    } satisfies OAuth2ObjectSecret
  }

  // OpenID Connect
  if (scheme.type === 'openIdConnect') {
    return scheme as OpenIdConnectObjectSecret
  }

  return scheme
}
