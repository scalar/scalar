import { isObjectLike } from '@scalar/helpers/object/is-object'
import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Auth, AuthAttributes } from '@/types'

/** Resolves parent authentication when auth is omitted, null, or explicitly inherited. */
export const resolveAuth = (auth: Auth | null | undefined, parentAuth?: Auth): Auth | undefined =>
  auth && auth.type !== 'inherit' ? auth : parentAuth

// Constants for security scheme names and URLs
const AUTH_SCHEMES = {
  API_KEY: 'apikeyAuth',
  BASIC: 'basicAuth',
  BEARER: 'bearerAuth',
  DIGEST: 'digestAuth',
  OAUTH2: 'oauth2Auth',
} as const

const OAUTH2_DEFAULTS = {
  AUTHORIZE_URL: '/oauth/authorize',
  TOKEN_URL: '/oauth/token',
} as const

const API_KEY_DEFAULTS = {
  NAME: 'api_key',
  LOCATION: 'header',
} as const

const SCHEME_NAME_SAFE_CHAR = /[A-Za-z0-9_-]/

type SecurityConfig = {
  scheme: OpenAPIV3_1.SecuritySchemeObject
  requirement: OpenAPIV3_1.SecurityRequirementObject
  /** Overrides the default `<type>Auth` key when one Postman type maps to several distinct schemes. */
  schemeName?: string
}

/** Reads v2.1 attribute rows and v2.0 attribute objects as entries, because Postman exports both shapes. */
const toAttributeEntries = (attributes: AuthAttributes | undefined): [string, unknown][] => {
  if (Array.isArray(attributes)) {
    return attributes.map((attr): [string, unknown] => [attr.key, attr.value])
  }

  return isObjectLike(attributes) ? Object.entries(attributes) : []
}

/** Collects attributes in a map, so names such as `__proto__` stay ordinary keys. */
const toAttributeMap = (attributes: AuthAttributes | undefined): Map<string, string> => {
  const attrMap = new Map<string, string>()

  toAttributeEntries(attributes).forEach(([key, value]) => {
    if (key && value !== undefined && value !== null) {
      attrMap.set(key, String(value))
    }
  })

  return attrMap
}

/** Escapes each byte a component key cannot hold as a dot plus hex, so different names never share a scheme key. */
const escapeSchemeNamePart = (value: string): string =>
  Array.from(new TextEncoder().encode(value), (byte): string => {
    const char = String.fromCharCode(byte)
    return SCHEME_NAME_SAFE_CHAR.test(char) ? char : `.${byte.toString(16).toUpperCase().padStart(2, '0')}`
  }).join('')

/**
 * Creates security configuration for API key authentication
 * Uses the Postman key name and location, and falls back to a header like Postman does
 */
function createApiKeyConfig(auth?: Auth): SecurityConfig {
  const attrMap = toAttributeMap(auth?.apikey)
  const name = attrMap.get('key') || API_KEY_DEFAULTS.NAME
  // Postman only offers header and query, so any other value is sent as a header.
  const location = attrMap.get('in') === 'query' ? 'query' : API_KEY_DEFAULTS.LOCATION

  // Two API keys with different names or locations must not overwrite each other in components.
  const isDefault = name === API_KEY_DEFAULTS.NAME && location === API_KEY_DEFAULTS.LOCATION
  const schemeName = isDefault
    ? AUTH_SCHEMES.API_KEY
    : `${AUTH_SCHEMES.API_KEY}_${location}_${escapeSchemeNamePart(name)}`

  return {
    scheme: {
      type: 'apiKey',
      name,
      in: location,
    },
    requirement: { [schemeName]: [] },
    schemeName,
  }
}

/**
 * Creates security configuration for Basic authentication
 */
function createBasicConfig(): SecurityConfig {
  return {
    scheme: {
      type: 'http',
      scheme: 'basic',
    },
    requirement: { [AUTH_SCHEMES.BASIC]: [] },
  }
}

/**
 * Creates security configuration for Bearer token authentication
 */
function createBearerConfig(): SecurityConfig {
  return {
    scheme: {
      type: 'http',
      scheme: 'bearer',
    },
    requirement: { [AUTH_SCHEMES.BEARER]: [] },
  }
}

/**
 * Creates security configuration for Digest authentication
 */
function createDigestConfig(): SecurityConfig {
  return {
    scheme: {
      type: 'http',
      scheme: 'digest',
    },
    requirement: { [AUTH_SCHEMES.DIGEST]: [] },
  }
}

/**
 * Creates security configuration for OAuth2 authentication
 * Extracts actual OAuth2 URLs and scopes from the Postman auth object
 */
function createOAuth2Config(auth?: Auth): SecurityConfig {
  if (!auth) {
    return {
      scheme: {},
      requirement: {},
    }
  }

  const attrMap = toAttributeMap(auth.oauth2)

  const authUrl = attrMap.get('authUrl') || attrMap.get('authorizationUrl') || OAUTH2_DEFAULTS.AUTHORIZE_URL
  const tokenUrl = attrMap.get('accessTokenUrl') || attrMap.get('tokenUrl') || OAUTH2_DEFAULTS.TOKEN_URL
  const scopeValue = attrMap.get('scope') || ''

  // Parse scopes from the scope value (can be space or comma separated)
  const scopes: Record<string, string> = {}
  if (scopeValue) {
    const scopeList = scopeValue.split(/[,\s]+/).filter(Boolean)
    scopeList.forEach((scope) => {
      scopes[scope] = scope
    })
  }

  return {
    scheme: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: authUrl,
          tokenUrl,
          scopes,
        },
      },
    },
    requirement: { [AUTH_SCHEMES.OAUTH2]: Object.keys(scopes) },
  }
}

/**
 * Creates security configuration for no authentication
 */
function createNoAuthConfig(): SecurityConfig {
  return {
    scheme: {},
    requirement: {},
  }
}

/**
 * Maps authentication types to their configuration creators
 * Types missing here cannot be described in OpenAPI, so they are skipped
 */
const AUTH_TYPE_HANDLERS: Record<string, (auth?: Auth) => SecurityConfig> = {
  apikey: createApiKeyConfig,
  basic: createBasicConfig,
  bearer: createBearerConfig,
  digest: createDigestConfig,
  oauth2: createOAuth2Config,
  noauth: createNoAuthConfig,
}

/**
 * Processes authentication information from a Postman collection and updates
 * the OpenAPI document with the corresponding security schemes and requirements.
 * Supports API key, basic auth, bearer token, digest, OAuth2, and no authentication types.
 * Other Postman types, such as AWS Signature or Hawk, produce no scheme and no requirement.
 */
export function processAuth(
  auth: Auth,
  existingSchemes: OpenAPIV3_1.ComponentsObject['securitySchemes'] = {},
): {
  securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject>
  security: OpenAPIV3_1.SecurityRequirementObject[]
} {
  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> = {}
  const security: OpenAPIV3_1.SecurityRequirementObject[] = []

  try {
    // The type comes from the document, so an inherited key such as `constructor` is not a handler.
    const handler = Object.hasOwn(AUTH_TYPE_HANDLERS, auth.type) ? AUTH_TYPE_HANDLERS[auth.type] : undefined
    if (!handler) {
      return { securitySchemes, security }
    }

    const { scheme, requirement, schemeName = `${auth.type}Auth` } = handler(auth)

    // Only add security schemes and requirements if they're not empty
    if (Object.keys(scheme).length > 0) {
      // Distinct OAuth2 endpoints or scopes must not change authentication on other operations.
      let resolvedName = schemeName
      for (let suffix = 2; Object.hasOwn(existingSchemes, resolvedName); suffix++) {
        if (isObjectEqual(existingSchemes[resolvedName], scheme)) {
          break
        }
        resolvedName = `${schemeName}_${suffix}`
      }
      securitySchemes[resolvedName] = scheme
      security.push({ [resolvedName]: requirement[schemeName] ?? [] })
    }
  } catch (error) {
    console.error('Error processing authentication:', error)
    throw error
  }

  return { securitySchemes, security }
}
