import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { Auth } from '../types'

/**
 * Processes authentication information from a Postman collection and updates
 * the OpenAPI document with the corresponding security schemes and requirements.
 * Supports API key, basic auth, bearer token, and OAuth2 authentication types.
 */
export function processAuth(auth: Auth): {
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>
  security: OpenAPIV3.SecurityRequirementObject[]
} {
  // Initialize containers for security configurations
  const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {}
  const security: OpenAPIV3.SecurityRequirementObject[] = []

  const authTypes: Record<string, () => void> = {
    apikey: () => {
      securitySchemes['apikeyAuth'] = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      }
      security.push({ apikeyAuth: [] })
    },

    basic: () => {
      securitySchemes['basicAuth'] = {
        type: 'http',
        scheme: 'basic',
      }
      security.push({ basicAuth: [] })
    },

    bearer: () => {
      securitySchemes['bearerAuth'] = {
        type: 'http',
        scheme: 'bearer',
      }
      security.push({ bearerAuth: [] })
    },

    oauth2: () => {
      securitySchemes['oauth2Auth'] = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
          },
        },
      }
      security.push({ oauth2Auth: [] })
    },
  }

  // Execute the appropriate authentication handler if available
  const processAuthType = authTypes[auth.type]
  if (processAuthType) {
    processAuthType()
  }

  return { securitySchemes, security }
}
