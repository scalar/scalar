import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { Auth } from '../types'

// Constants for security scheme names and URLs
const AUTH_SCHEMES = {
  API_KEY: 'apikeyAuth',
  BASIC: 'basicAuth',
  BEARER: 'bearerAuth',
  OAUTH2: 'oauth2Auth',
} as const

const OAUTH2_DEFAULTS = {
  AUTHORIZE_URL: 'https://example.com/oauth/authorize',
  TOKEN_URL: 'https://example.com/oauth/token',
} as const

type SecurityConfig = {
  scheme: OpenAPIV3.SecuritySchemeObject
  requirement: OpenAPIV3.SecurityRequirementObject
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
 */
function createOAuth2Config(): SecurityConfig {
  return {
    scheme: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: OAUTH2_DEFAULTS.AUTHORIZE_URL,
          tokenUrl: OAUTH2_DEFAULTS.TOKEN_URL,
          scopes: {},
        },
      },
    },
    requirement: { [AUTH_SCHEMES.OAUTH2]: [] },
  }
}

/**
 * Maps authentication types to their configuration creators
 */
const AUTH_TYPE_HANDLERS: Record<string, () => SecurityConfig> = {
  apikey: createApiKeyConfig,
  basic: createBasicConfig,
  bearer: createBearerConfig,
  oauth2: createOAuth2Config,
}

/**
 * Processes authentication information from a Postman collection and updates
 * the OpenAPI document with the corresponding security schemes and requirements.
 * Supports API key, basic auth, bearer token, and OAuth2 authentication types.
 */
export function processAuth(auth: Auth): {
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>
  security: OpenAPIV3.SecurityRequirementObject[]
} {
  const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {}
  const security: OpenAPIV3.SecurityRequirementObject[] = []

  try {
    const handler = AUTH_TYPE_HANDLERS[auth.type]
    if (!handler) {
      throw new Error(`Unsupported authentication type: ${auth.type}`)
    }

    const { scheme, requirement } = handler()
    const schemeKey = `${auth.type}Auth`
    securitySchemes[schemeKey] = scheme
    security.push(requirement)
  } catch (error) {
    console.error('Error processing authentication:', error)
    throw error
  }

  return { securitySchemes, security }
}
