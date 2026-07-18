import { isObject } from '@scalar/helpers/object/is-object'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { SecurityScheme } from '@scalar/types/entities'
import type {
  AuthStore,
  SecretsEncryption,
  SecretsGssapi,
  SecretsOAuthFlows,
  SecretsOpenIdConnect,
  SecretsSasl,
  SecretsX509,
} from '@scalar/workspace-store/entities/auth'
import type { DeepPartial } from '@scalar/workspace-store/helpers/overrides-proxy'
import type { XScalarCredentialsLocation } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-credentials-location'
import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from '@scalar/workspace-store/schemas/v3.1/strict/oauth-flow'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type {
  ApiKeyObjectSecret,
  EncryptionObjectSecret,
  GssapiObjectSecret,
  HttpObjectSecret,
  OAuth2ObjectSecret,
  OAuthFlowAuthorizationCodeSecret,
  OAuthFlowClientCredentialsSecret,
  OAuthFlowImplicitSecret,
  OAuthFlowPasswordSecret,
  OAuthFlowsObjectSecret,
  OpenIdConnectObjectSecret,
  SaslObjectSecret,
  SecuritySchemeObjectSecret,
  X509ObjectSecret,
} from '@/request-example/builder/security/secret-types'

/** A combined scheme that includes both the auth store secrets and a deep partial of the config auth */
export type ConfigAuthScheme = SecuritySchemeObject & DeepPartial<SecurityScheme>

/** AsyncAPI SASL-style broker scheme types, all of which authenticate with a username + password pair. */
const SASL_SCHEME_TYPES = ['userPassword', 'plain', 'scramSha256', 'scramSha512'] as const
type SaslSchemeType = (typeof SASL_SCHEME_TYPES)[number]

const isSaslSchemeType = (type: string | undefined): type is SaslSchemeType =>
  Boolean(type) && (SASL_SCHEME_TYPES as readonly string[]).includes(type!)

/** AsyncAPI encryption broker scheme types, which carry a single key value. */
const ENCRYPTION_SCHEME_TYPES = ['symmetricEncryption', 'asymmetricEncryption'] as const
type EncryptionSchemeType = (typeof ENCRYPTION_SCHEME_TYPES)[number]

const isEncryptionSchemeType = (type: string | undefined): type is EncryptionSchemeType =>
  Boolean(type) && (ENCRYPTION_SCHEME_TYPES as readonly string[]).includes(type!)

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
  'x-scalar-secret-auth-url': 'authorizationUrl',
  'x-scalar-secret-token-url': 'tokenUrl',
} as const

const mergeFlowSecrets = <const T extends readonly (keyof typeof SECRET_TO_INPUT_FIELD_MAP)[]>(
  properties: T,
  configSecrets: Record<string, unknown>,
  authStoreSecrets: Record<string, unknown> = {},
  oauth2RedirectUri?: string,
): Record<T[number], string> =>
  Object.fromEntries(
    properties.map((property) => {
      // Redirect URI is the only OAuth secret where an explicit empty value from
      // store must be preserved. Other secrets use falsy fallback behavior for backwards-compatibility
      // with config defaults when the casted auth store value is an empty string.
      const authStoreValue = typeof authStoreSecrets[property] === 'string' ? authStoreSecrets[property] : undefined
      const configValue = typeof configSecrets[property] === 'string' ? configSecrets[property] : undefined
      const configInputValue =
        typeof configSecrets[SECRET_TO_INPUT_FIELD_MAP[property]] === 'string'
          ? configSecrets[SECRET_TO_INPUT_FIELD_MAP[property]]
          : undefined

      // oauth2RedirectUri (top-level config option) is used as a global fallback for the redirect URI,
      // applied only when neither the auth store nor per-scheme config have a value. This ensures
      // the configured redirect URI persists when switching between documents with the same OAuth config,
      // because each document starts with no stored redirect URI (authStoreValue === undefined).
      const value =
        property === 'x-scalar-secret-redirect-uri'
          ? (authStoreValue ?? configValue ?? configInputValue ?? oauth2RedirectUri ?? '')
          : authStoreValue || configValue || configInputValue || ''

      return [property, value]
    }),
  ) as Record<T[number], string>

const extractRefreshTokenSecret = (
  authStoreSecrets: { 'x-scalar-secret-refresh-token'?: string } = {},
): { 'x-scalar-secret-refresh-token'?: string } => {
  const refreshToken = authStoreSecrets['x-scalar-secret-refresh-token']

  if (typeof refreshToken === 'string') {
    return { 'x-scalar-secret-refresh-token': refreshToken }
  }

  return {}
}

const extractCredentialsLocation = (
  configSecrets: Record<string, unknown>,
  authStoreSecrets: {
    'x-scalar-credentials-location'?: XScalarCredentialsLocation['x-scalar-credentials-location']
  } = {},
): XScalarCredentialsLocation => {
  const credentialsLocation =
    authStoreSecrets['x-scalar-credentials-location'] ??
    (configSecrets['x-scalar-credentials-location'] as XScalarCredentialsLocation['x-scalar-credentials-location'])

  return credentialsLocation ? { 'x-scalar-credentials-location': credentialsLocation } : {}
}

/**
 * Extract flow secrets and selected scopes for OAuth-like flows.
 * Reused by both oauth2 and openIdConnect security schemes.
 */
const extractOAuthFlowSecrets = (
  flows: Record<string, unknown> | undefined,
  storeSecrets?: Partial<SecretsOAuthFlows> | Partial<SecretsOpenIdConnect>,
  oauth2RedirectUri?: string,
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
          [
            'x-scalar-secret-client-id',
            'x-scalar-secret-redirect-uri',
            'x-scalar-secret-token',
            'x-scalar-secret-auth-url',
          ],
          flow,
          storeSecrets?.implicit,
          oauth2RedirectUri,
        ),
        ...extractRefreshTokenSecret(storeSecrets?.implicit),
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
            'x-scalar-secret-token-url',
          ],
          flow,
          storeSecrets?.password,
        ),
        ...extractCredentialsLocation(flow, storeSecrets?.password),
        ...extractRefreshTokenSecret(storeSecrets?.password),
      } satisfies OAuthFlowPasswordSecret
    }

    // Client credentials flow
    if (key === 'clientCredentials') {
      acc[key] = {
        ...(flow as OAuthFlowClientCredentials),
        ...mergeFlowSecrets(
          [
            'x-scalar-secret-client-id',
            'x-scalar-secret-client-secret',
            'x-scalar-secret-token',
            'x-scalar-secret-token-url',
          ],
          flow,
          storeSecrets?.clientCredentials,
        ),
        ...extractCredentialsLocation(flow, storeSecrets?.clientCredentials),
        ...extractRefreshTokenSecret(storeSecrets?.clientCredentials),
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
            'x-scalar-secret-auth-url',
            'x-scalar-secret-token-url',
          ],
          flow,
          storeSecrets?.authorizationCode,
          oauth2RedirectUri,
        ),
        ...extractCredentialsLocation(flow, storeSecrets?.authorizationCode),
        ...extractRefreshTokenSecret(storeSecrets?.authorizationCode),
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
  oauth2RedirectUri?: string,
): SecuritySchemeObjectSecret => {
  const secrets = authStore.getAuthSecrets(documentSlug, name)

  // AsyncAPI broker schemes live outside the OpenAPI `SecuritySchemeObject` union, so their type
  // (and any config credential fields) are read through this alias. Captured before the OpenAPI
  // branches below, where `scheme` gets narrowed to `never` once all four OpenAPI types are handled.
  const brokerScheme = scheme as {
    type?: string
    username?: string
    password?: string
    token?: string
  } & Record<string, unknown>

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
    const extracted = extractOAuthFlowSecrets(scheme.flows, storeSecrets, oauth2RedirectUri)
    const configuredDefaultScopes = Array.isArray(scheme['x-default-scopes'])
      ? scheme['x-default-scopes'].filter((scope): scope is string => typeof scope === 'string')
      : []
    const mergedDefaultScopes = Array.from(new Set([...configuredDefaultScopes, ...extracted.selectedScopes]))

    return {
      ...scheme,
      flows: extracted.flows,
      'x-default-scopes': mergedDefaultScopes,
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
      oauth2RedirectUri,
    )

    return {
      ...scheme,
      ...(objectEntries(extracted.flows).length ? { flows: extracted.flows } : {}),
    } as OpenIdConnectObjectSecret
  }

  // SASL-style schemes (userPassword, plain, scramSha256, scramSha512): username + password,
  // with the same config fallbacks as HTTP basic.
  if (isSaslSchemeType(brokerScheme.type)) {
    const storeSecrets = secrets?.type === brokerScheme.type ? (secrets as SecretsSasl) : undefined
    return {
      ...brokerScheme,
      'x-scalar-secret-username': storeSecrets?.['x-scalar-secret-username'] || brokerScheme.username || '',
      'x-scalar-secret-password': storeSecrets?.['x-scalar-secret-password'] || brokerScheme.password || '',
    } as SaslObjectSecret
  }

  // X509: a client certificate + private key pair (PEM), stored in the auth store only.
  if (brokerScheme.type === 'X509') {
    const storeSecrets = secrets?.type === 'X509' ? (secrets as SecretsX509) : undefined
    return {
      ...brokerScheme,
      'x-scalar-secret-client-certificate': storeSecrets?.['x-scalar-secret-client-certificate'] || '',
      'x-scalar-secret-private-key': storeSecrets?.['x-scalar-secret-private-key'] || '',
    } as X509ObjectSecret
  }

  // Encryption schemes (symmetricEncryption, asymmetricEncryption): a single key value in the token slot.
  if (isEncryptionSchemeType(brokerScheme.type)) {
    const storeSecrets = secrets?.type === brokerScheme.type ? (secrets as SecretsEncryption) : undefined
    return {
      ...brokerScheme,
      'x-scalar-secret-token': storeSecrets?.['x-scalar-secret-token'] || brokerScheme.token || '',
    } as EncryptionObjectSecret
  }

  // GSSAPI (Kerberos): the service name the client authenticates against.
  if (brokerScheme.type === 'gssapi') {
    const storeSecrets = secrets?.type === 'gssapi' ? (secrets as SecretsGssapi) : undefined
    return {
      ...brokerScheme,
      'x-scalar-secret-service-name': storeSecrets?.['x-scalar-secret-service-name'] || '',
    } as GssapiObjectSecret
  }

  return scheme as SecuritySchemeObjectSecret
}
