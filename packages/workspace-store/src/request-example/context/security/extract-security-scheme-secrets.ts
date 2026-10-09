import { isObject } from '@scalar/helpers/object/is-object'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { SecurityScheme } from '@scalar/types/entities'
import type { AuthStore, SecretsOAuthFlows, SecretsOpenIdConnect } from '@scalar/workspace-store/entities/auth'
import { type AuthSecretField, isSecretFieldCleared } from '@scalar/workspace-store/helpers/auth-secret-fields'
import type { DeepPartial } from '@scalar/workspace-store/helpers/overrides-proxy'
import type { XScalarCredentialsLocation } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-credentials-location'
import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from '@scalar/workspace-store/schemas/v3.2/strict/oauth-flow'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import type {
  ApiKeyObjectSecret,
  BrokerApiKeyObject,
  EncryptionObjectSecret,
  GssapiObjectSecret,
  HttpObjectSecret,
  OAuth2ObjectSecret,
  OAuthFlowAuthorizationCodeSecret,
  OAuthFlowClientCredentialsSecret,
  OAuthFlowDeviceAuthorizationSecret,
  OAuthFlowImplicitSecret,
  OAuthFlowPasswordSecret,
  OAuthFlowsObjectSecret,
  SaslObjectSecret,
  SecuritySchemeObjectSecret,
  X509ObjectSecret,
  XScalarSecretDefaults,
} from '@/request-example/builder/security/secret-types'
import type { OAuthFlowDeviceAuthorization } from '@/schemas/v3.2/strict/oauth-flow'

/** A combined scheme that includes both the auth store secrets and a deep partial of the config auth */
export type ConfigAuthScheme = SecuritySchemeObject & DeepPartial<SecurityScheme>

type BrokerSchemeType = SaslObjectSecret['type'] | EncryptionObjectSecret['type'] | 'X509' | 'gssapi'
type BrokerAuthScheme = {
  [T in BrokerSchemeType]: {
    type: T
    description?: string
    username?: string
    password?: string
    token?: string
  }
}[BrokerSchemeType]

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

/**
 * Keep only the defaults that would restore something. An empty default means Reset could only
 * clear the field, which the clear action already does, so the key is left off entirely.
 */
const withSecretDefaults = (defaults: Partial<Record<AuthSecretField, string>>): XScalarSecretDefaults => {
  const nonEmpty = Object.fromEntries(
    Object.entries(defaults).filter(([, value]) => typeof value === 'string' && value !== ''),
  ) as Partial<Record<AuthSecretField, string>>

  return Object.keys(nonEmpty).length ? { 'x-scalar-secret-defaults': nonEmpty } : {}
}

/** Only string values count; anything else falls through to the next source. */
const readString = (source: Record<string, unknown>, key: string): string | undefined => {
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}

const mergeFlowSecrets = <const T extends readonly (keyof typeof SECRET_TO_INPUT_FIELD_MAP)[]>(
  properties: T,
  configSecrets: Record<string, unknown>,
  authStoreSecrets: Record<string, unknown> = {},
  oauth2RedirectUri?: string,
  /**
   * OpenID Connect passes the stored flow as both the config and the auth store, so its
   * `x-scalar-secret-*` values are the user's own overrides and must not count as defaults.
   */
  includeConfigSecretValues = true,
): Record<T[number], string> & { 'x-scalar-secret-cleared-fields'?: string[] } & XScalarSecretDefaults => {
  const clearedFields = properties.filter((property) => isSecretFieldCleared(authStoreSecrets, property))
  const defaults: Partial<Record<AuthSecretField, string>> = {}
  const values = Object.fromEntries(
    properties.map((property) => {
      // Preserve explicit clears, while legacy schema-filled empties still inherit defaults.
      const authStoreValue = readString(authStoreSecrets, property)
      const configValue = includeConfigSecretValues ? readString(configSecrets, property) : undefined
      const configInputValue = readString(configSecrets, SECRET_TO_INPUT_FIELD_MAP[property])

      // oauth2RedirectUri (top-level config option) is used as a global fallback for the redirect URI,
      // applied only when neither the auth store nor per-scheme config have a value. This ensures
      // the configured redirect URI persists when switching between documents with the same OAuth config,
      // because each document starts with no stored redirect URI (authStoreValue === undefined).
      const isRedirect = property === 'x-scalar-secret-redirect-uri'

      // The value and its reset target share one fallback, so Reset always restores exactly what the
      // field shows once the stored override is released.
      const fallback = isRedirect
        ? (configValue ?? configInputValue ?? oauth2RedirectUri ?? '')
        : configValue || configInputValue || ''

      // The redirect URI and explicitly cleared fields keep an empty stored value instead of falling
      // back. For the redirect URI this is the stored value ahead of the same fallback as above.
      const value =
        isRedirect || isSecretFieldCleared(authStoreSecrets, property)
          ? (authStoreValue ?? configValue ?? configInputValue ?? oauth2RedirectUri ?? '')
          : authStoreValue || fallback

      defaults[property] = fallback

      return [property, value]
    }),
  ) as Record<T[number], string>
  return {
    ...values,
    ...(clearedFields.length ? { 'x-scalar-secret-cleared-fields': clearedFields } : {}),
    ...withSecretDefaults(defaults),
  }
}

const storedSecret = (secrets: object | undefined, field: AuthSecretField): string | undefined => {
  const value: unknown = secrets && Reflect.get(secrets, field)
  return typeof value === 'string' && (value || isSecretFieldCleared(secrets ?? {}, field)) ? value : undefined
}

/** Secret extensions are not part of the strict scheme types, so they are read the same way the OAuth flows read theirs */
const documentSecret = (scheme: object, property: keyof typeof SECRET_TO_INPUT_FIELD_MAP): string => {
  const value = property in scheme ? Reflect.get(scheme, property) : undefined

  return typeof value === 'string' ? value : ''
}

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
  includeConfigSecretValues = true,
): {
  flows: OAuthFlowsObjectSecret
  selectedScopes: string[]
} => {
  const selectedScopes = new Set<string>()

  const extractedFlows = objectEntries(flows ?? {}).reduce<OAuthFlowsObjectSecret>((acc, [key, flow]) => {
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
          includeConfigSecretValues,
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
          undefined,
          includeConfigSecretValues,
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
          undefined,
          includeConfigSecretValues,
        ),
        ...extractCredentialsLocation(flow, storeSecrets?.clientCredentials),
        ...extractRefreshTokenSecret(storeSecrets?.clientCredentials),
      } satisfies OAuthFlowClientCredentialsSecret
    }

    // Device authorization flow
    if (key === 'deviceAuthorization') {
      acc[key] = {
        ...(flow as OAuthFlowDeviceAuthorization),
        ...mergeFlowSecrets(
          [
            'x-scalar-secret-client-id',
            'x-scalar-secret-client-secret',
            'x-scalar-secret-token',
            'x-scalar-secret-token-url',
          ],
          flow,
          storeSecrets?.deviceAuthorization,
          undefined,
          includeConfigSecretValues,
        ),
        ...extractCredentialsLocation(flow, storeSecrets?.deviceAuthorization),
        ...extractRefreshTokenSecret(storeSecrets?.deviceAuthorization),
      } satisfies OAuthFlowDeviceAuthorizationSecret
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
          includeConfigSecretValues,
        ),
        ...extractCredentialsLocation(flow, storeSecrets?.authorizationCode),
        ...extractRefreshTokenSecret(storeSecrets?.authorizationCode),
      } satisfies OAuthFlowAuthorizationCodeSecret
    }

    return acc
  }, {})

  return { flows: extractedFlows, selectedScopes: Array.from(selectedScopes) }
}

/** Extract the secrets from the config and the auth store */
export const extractSecuritySchemeSecrets = (
  // Include the config fields
  scheme: ConfigAuthScheme | BrokerAuthScheme | (BrokerApiKeyObject & { value?: string }),
  authStore: AuthStore,
  name: string,
  documentSlug: string,
  oauth2RedirectUri?: string,
): SecuritySchemeObjectSecret => {
  const secrets = authStore.getAuthSecrets(documentSlug, name)

  // Handle API Key security schemes
  if (scheme.type === 'apiKey') {
    const storeSecrets = secrets?.type === 'apiKey' ? secrets : undefined
    const defaults = {
      'x-scalar-secret-token': documentSecret(scheme, 'x-scalar-secret-token') || scheme.value || '',
    }
    return {
      ...scheme,
      // User edits take precedence over document and configuration defaults, even when cleared.
      ...(storeSecrets?.name === undefined ? {} : { name: storeSecrets.name }),
      'x-scalar-secret-token': storedSecret(storeSecrets, 'x-scalar-secret-token') ?? defaults['x-scalar-secret-token'],
      ...withSecretDefaults(defaults),
    } satisfies ApiKeyObjectSecret
  }

  // Handle HTTP Auth security schemes (e.g., Basic, Bearer)
  if (scheme.type === 'http') {
    const storeSecrets = secrets?.type === 'http' ? secrets : undefined
    const defaults = {
      'x-scalar-secret-token': documentSecret(scheme, 'x-scalar-secret-token') || scheme.token || '',
      'x-scalar-secret-username': documentSecret(scheme, 'x-scalar-secret-username') || scheme.username || '',
      'x-scalar-secret-password': documentSecret(scheme, 'x-scalar-secret-password') || scheme.password || '',
    }
    return {
      ...scheme,
      'x-scalar-secret-token': storedSecret(storeSecrets, 'x-scalar-secret-token') ?? defaults['x-scalar-secret-token'],
      'x-scalar-secret-username':
        storedSecret(storeSecrets, 'x-scalar-secret-username') ?? defaults['x-scalar-secret-username'],
      'x-scalar-secret-password':
        storedSecret(storeSecrets, 'x-scalar-secret-password') ?? defaults['x-scalar-secret-password'],
      ...withSecretDefaults(defaults),
    } satisfies HttpObjectSecret
  }

  // Handle OAuth2 security schemes and all supported flows
  if (scheme.type === 'oauth2') {
    const storeSecrets = secrets?.type === 'oauth2' ? secrets : undefined
    const extracted = extractOAuthFlowSecrets(scheme.flows, storeSecrets, oauth2RedirectUri, true)
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
        deviceAuthorization: storeSecrets?.deviceAuthorization,
      },
      storeSecrets,
      oauth2RedirectUri,
      // The flows above are the stored flows themselves, so only discovered or input keys are defaults
      false,
    )

    return {
      ...scheme,
      ...(objectEntries(extracted.flows).length ? { flows: extracted.flows } : {}),
    }
  }

  // SASL-style schemes (userPassword, plain, scramSha256, scramSha512): username + password,
  // with the same config fallbacks as HTTP basic.
  if (
    scheme.type === 'userPassword' ||
    scheme.type === 'plain' ||
    scheme.type === 'scramSha256' ||
    scheme.type === 'scramSha512'
  ) {
    const storeSecrets = secrets?.type === scheme.type ? secrets : undefined
    return {
      ...scheme,
      type: scheme.type,
      'x-scalar-secret-username': storeSecrets?.['x-scalar-secret-username'] || scheme.username || '',
      'x-scalar-secret-password': storeSecrets?.['x-scalar-secret-password'] || scheme.password || '',
    } satisfies SaslObjectSecret
  }

  // X509: a client certificate + private key pair (PEM), stored in the auth store only.
  if (scheme.type === 'X509') {
    const storeSecrets = secrets?.type === 'X509' ? secrets : undefined
    return {
      ...scheme,
      type: scheme.type,
      'x-scalar-secret-client-certificate': storeSecrets?.['x-scalar-secret-client-certificate'] || '',
      'x-scalar-secret-private-key': storeSecrets?.['x-scalar-secret-private-key'] || '',
    } satisfies X509ObjectSecret
  }

  // Encryption schemes (symmetricEncryption, asymmetricEncryption): a single key value in the token slot.
  if (scheme.type === 'symmetricEncryption' || scheme.type === 'asymmetricEncryption') {
    const storeSecrets = secrets?.type === scheme.type ? secrets : undefined
    return {
      ...scheme,
      type: scheme.type,
      'x-scalar-secret-token': storeSecrets?.['x-scalar-secret-token'] || scheme.token || '',
    } satisfies EncryptionObjectSecret
  }

  // GSSAPI (Kerberos): the service name the client authenticates against.
  if (scheme.type === 'gssapi') {
    const storeSecrets = secrets?.type === 'gssapi' ? secrets : undefined
    return {
      ...scheme,
      type: scheme.type,
      'x-scalar-secret-service-name': storeSecrets?.['x-scalar-secret-service-name'] || '',
    } satisfies GssapiObjectSecret
  }

  return scheme
}
