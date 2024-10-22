import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { Auth } from '../postman'

/**
 * Processes authentication information from a Postman collection and updates
 * the OpenAPI document with the corresponding security schemes and requirements.
 * Supports API key, basic auth, bearer token, and OAuth2 authentication types.
 */
export function processAuth(
  auth: Auth,
  openapi: OpenAPIV3.Document,
  security?: OpenAPIV3.SecurityRequirementObject[],
): void {
  // Initialize components and securitySchemes if they are undefined
  if (!openapi.components) {
    openapi.components = {}
  }
  if (!openapi.components.securitySchemes) {
    openapi.components.securitySchemes = {}
  }

  const securitySchemes = openapi.components.securitySchemes

  const authTypes: Record<string, () => void> = {
    apikey: () => {
      securitySchemes['apikeyAuth'] = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      }
      const requirement = { apikeyAuth: [] }
      if (security) {
        security.push(requirement)
      } else {
        openapi.security = [requirement]
      }
    },
    basic: () => {
      securitySchemes['basicAuth'] = {
        type: 'http',
        scheme: 'basic',
      }
      const requirement = { basicAuth: [] }
      if (security) {
        security.push(requirement)
      } else {
        openapi.security = [requirement]
      }
    },
    bearer: () => {
      securitySchemes['bearerAuth'] = {
        type: 'http',
        scheme: 'bearer',
      }
      const requirement = { bearerAuth: [] }
      if (security) {
        security.push(requirement)
      } else {
        openapi.security = [requirement]
      }
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
      const requirement = { oauth2Auth: [] }
      if (security) {
        security.push(requirement)
      } else {
        openapi.security = [requirement]
      }
    },
  }

  const processAuthType = authTypes[auth.type]
  if (processAuthType) {
    processAuthType()
  }
}
