import { isObject } from '@scalar/helpers/object/is-object'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { SecurityScheme } from '@scalar/types/entities'
import type { AuthStore, SecretsOAuthFlows, SecretsOpenIdConnect } from '@scalar/workspace-store/entities/auth'
import type { DeepPartial } from '@scalar/workspace-store/helpers/overrides-proxy'
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

/** A combined scheme that includes both the auth store secrets and a deep partial of the config auth */
export type ConfigAuthScheme = SecuritySchemeObject & DeepPartial<SecurityScheme>

/**
 * Maps x-scalar-secret fields to their corresponding input field names.
 * This allows us to fall back to config values when auth store secrets are not available.
 */
const SECRET_TO_INPUT_FIELD_MAP = {
  'x-scalar-secret-client-id': 'x-scalar-client-id',
  'x-scalar-secret-client-secret': 'clientSecret',
  'x-scalar-secret-password': 'password',
  'x-scalar-secret-redirect-uri': 'x-scalar-redirect-uri',
  'x-scalar-secret-token': 'token',
  'x-scalar-secret-username': 'username',
} as const

const mergeFlowSecrets = <const T extends readonly (keyof typeof SECRET_TO_INPUT_FIELD_MAP)[]>(
  properties: T,
  configSecrets: Record<string, unknown>,
  authStoreSecrets: Record<string, unknown> = {},
): Record<T[number], string> =>
  Object.fromEntries(
    properties.map((property) => {
      // Super merge in order of priority: auth store > config > config input field > empty string
      const value =
        authStoreSecrets[property] ||
        configSecrets[property] ||
        configSecrets[SECRET_TO_INPUT_FIELD_MAP[property]] ||
        ''

      return [property, value]
    }),
  ) as Record<T[number], string>

/**
 * Extract flow secrets and selected scopes for OAuth-like flows.
 * Reused by both oauth2 and openIdConnect security schemes.
 */
const extractOAuthFlowSecrets = (
  flows: Record<string, unknown> | undefined,
  storeSecrets?: Partial<SecretsOAuthFlows> | Partial<SecretsOpenIdConnect>,
): {
  flows: OAuthFlowsObjectSecret
  selectedScopes: string[]
} => {
  const selectedScopes = new Set<string>()

  const extractedFlows = objectEntries(flows ?? {}).reduce((acc, [key, flow]) => {
    if (!isObject(flow)) {
      return acc
    }

    // Store any selected scopes from the config
    const flowSelectedScopes = flow['selectedScopes']
    if (Array.isArray(flowSelectedScopes)) {
      flowSelectedScopes.forEach((scope) => typeof scope === 'string' && selectedScopes.add(scope))
    }

    // Implicit flow
    if (key === 'implicit') {
      acc.implicit = {
        ...(flow as OAuthFlowImplicit),
        ...mergeFlowSecrets(
          ['x-scalar-secret-client-id', 'x-scalar-secret-redirect-uri', 'x-scalar-secret-token'],
          flow,
          storeSecrets?.implicit,
        ),
      } satisfies OAuthFlowImplicitSecret
    }

    // Password flow
    if (key === 'password') {
      acc[key] = {
        ...(flow as OAuthFlowPassword),
        ...mergeFlowSecrets(
          [
            'x-scalar-secret-client-id',
            'x-scalar-secret-client-secret',
            'x-scalar-secret-username',
            'x-scalar-secret-password',
            'x-scalar-secret-token',
          ],
          flow,
          storeSecrets?.password,
        ),
      } satisfies OAuthFlowPasswordSecret
    }

    // Client credentials flow
    if (key === 'clientCredentials') {
      acc[key] = {
        ...(flow as OAuthFlowClientCredentials),
        ...mergeFlowSecrets(
          ['x-scalar-secret-client-id', 'x-scalar-secret-client-secret', 'x-scalar-secret-token'],
          flow,
          storeSecrets?.clientCredentials,
        ),
      } satisfies OAuthFlowClientCredentialsSecret
    }

    // Authorization code flow
    if (key === 'authorizationCode') {
      acc[key] = {
        ...(flow as OAuthFlowAuthorizationCode),
        ...mergeFlowSecrets(
          [
            'x-scalar-secret-client-id',
            'x-scalar-secret-client-secret',
            'x-scalar-secret-redirect-uri',
            'x-scalar-secret-token',
          ],
          flow,
          storeSecrets?.authorizationCode,
        ),
      } satisfies OAuthFlowAuthorizationCodeSecret
    }

    return acc
  }, {} as OAuthFlowsObjectSecret)

  return { flows: extractedFlows, selectedScopes: Array.from(selectedScopes) }
}

/** Extract the secrets from the config and the auth store */
export const extractSecuritySchemeSecrets = (
  // Include the config fields
  scheme: SecuritySchemeObject & DeepPartial<SecurityScheme>,
  authStore: AuthStore,
  name: string,
  documentSlug: string,
): SecuritySchemeObjectSecret => {
  const secrets = authStore.getAuthSecrets(documentSlug, name)

  // Handle API Key security schemes
  if (scheme.type === 'apiKey') {
    const storeSecrets = secrets?.type === 'apiKey' ? secrets : undefined
    return {
      ...scheme,
      'x-scalar-secret-token': storeSecrets?.['x-scalar-secret-token'] || scheme.value || '',
    } satisfies ApiKeyObjectSecret
  }

  // Handle HTTP Auth security schemes (e.g., Basic, Bearer)
  if (scheme.type === 'http') {
    const storeSecrets = secrets?.type === 'http' ? secrets : undefined
    return {
      ...scheme,
      'x-scalar-secret-token': storeSecrets?.['x-scalar-secret-token'] || scheme.token || '',
      'x-scalar-secret-username': storeSecrets?.['x-scalar-secret-username'] || scheme.username || '',
      'x-scalar-secret-password': storeSecrets?.['x-scalar-secret-password'] || scheme.password || '',
    } satisfies HttpObjectSecret
  }

  // Handle OAuth2 security schemes and all supported flows
  if (scheme.type === 'oauth2') {
    const storeSecrets = secrets?.type === 'oauth2' ? secrets : undefined
    const extracted = extractOAuthFlowSecrets(scheme.flows, storeSecrets)

    return {
      ...scheme,
      flows: extracted.flows,
      'x-default-scopes': extracted.selectedScopes,
    } satisfies OAuth2ObjectSecret
  }

  // OpenID Connect uses auth-store-only discovered flows, but we expose them in OAuth-like flow format.
  if (scheme.type === 'openIdConnect') {
    const storeSecrets = secrets?.type === 'openIdConnect' ? secrets : undefined
    const extracted = extractOAuthFlowSecrets(
      {
        implicit: storeSecrets?.implicit,
        password: storeSecrets?.password,
        clientCredentials: storeSecrets?.clientCredentials,
        authorizationCode: storeSecrets?.authorizationCode,
      },
      storeSecrets,
    )

    return {
      ...scheme,
      ...(objectEntries(extracted.flows).length ? { flows: extracted.flows } : {}),
    } as OpenIdConnectObjectSecret
  }

  return scheme as SecuritySchemeObjectSecret
}
