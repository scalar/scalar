import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Auth } from '@/types'

// Constants for security scheme names and URLs
const AUTH_SCHEMES = {
  API_KEY: 'apikeyAuth',
  BASIC: 'basicAuth',
  BEARER: 'bearerAuth',
  OAUTH2: 'oauth2Auth',
} as const

const OAUTH2_DEFAULTS = {
  AUTHORIZE_URL: '/oauth/authorize',
  TOKEN_URL: '/oauth/token',
} as const

type SecurityConfig = {
  scheme: OpenAPIV3_1.SecuritySchemeObject
  requirement: OpenAPIV3_1.SecurityRequirementObject
}

/**
 * Creates security configuration for API key authentication
 */
function createApiKeyConfig(): SecurityConfig {
  return {
    scheme: {
      type: 'apiKey',
      name: 'api_key',
      in: 'header',
    },
    requirement: { [AUTH_SCHEMES.API_KEY]: [] },
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

  const oauth2Attrs = auth.oauth2 || []
  const attrMap = new Map<string, string>()

  oauth2Attrs.forEach((attr) => {
    if (attr.key && attr.value !== undefined) {
      attrMap.set(attr.key, String(attr.value))
    }
  })

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
 */
const AUTH_TYPE_HANDLERS: Record<string, (auth?: Auth) => SecurityConfig> = {
  apikey: createApiKeyConfig,
  basic: createBasicConfig,
  bearer: createBearerConfig,
  oauth2: createOAuth2Config,
  noauth: createNoAuthConfig,
}

/**
 * Processes authentication information from a Postman collection and updates
 * the OpenAPI document with the corresponding security schemes and requirements.
 * Supports API key, basic auth, bearer token, OAuth2, and no authentication types.
 */
export function processAuth(auth: Auth): {
  securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject>
  security: OpenAPIV3_1.SecurityRequirementObject[]
} {
  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> = {}
  const security: OpenAPIV3_1.SecurityRequirementObject[] = []

  try {
    const handler = AUTH_TYPE_HANDLERS[auth.type]
    if (!handler) {
      throw new Error(`Unsupported authentication type: ${auth.type}`)
    }

    const { scheme, requirement } = handler(auth)

    // Only add security schemes and requirements if they're not empty
    if (Object.keys(scheme).length > 0) {
      const schemeKey = `${auth.type}Auth`
      securitySchemes[schemeKey] = scheme
      security.push(requirement)
    }
  } catch (error) {
    console.error('Error processing authentication:', error)
    throw error
  }

  return { securitySchemes, security }
}
