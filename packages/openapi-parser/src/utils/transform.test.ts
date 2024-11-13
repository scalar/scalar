import type { OpenAPI } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import type { AnyObject } from '../types'

const DEFAULT_OPENAPI_VERSION = '3.1.1'
const DEFAULT_TITLE = ''
const DEFAULT_VERSION = '1.0'

function transform(definition: AnyObject): OpenAPI.Document {
  // Throw error if it's a Swagger document
  if ('swagger' in definition) {
    throw new Error(
      'Swagger 2.0 documents are not supported. Please upgrade to OpenAPI 3.x.',
    )
  }

  // Add OpenAPI version
  const transformed: AnyObject = {
    openapi: definition.openapi ?? DEFAULT_OPENAPI_VERSION,
    ...definition,
  }

  // Add info object if not present
  if (!transformed.info) {
    transformed.info = {}
  }

  // Add required properties to info object
  transformed.info = {
    ...transformed.info,
    title: transformed.info.title ?? DEFAULT_TITLE,
    version: transformed.info.version ?? DEFAULT_VERSION,
  }

  // Normalize security scheme types to lowercase
  if (transformed.components?.securitySchemes) {
    for (const scheme of Object.values(
      transformed.components.securitySchemes,
    )) {
      if (typeof scheme === 'object' && scheme !== null && 'type' in scheme) {
        // Convert to proper casing for security scheme types
        const type = String(scheme.type).toLowerCase()
        switch (type) {
          case 'apikey':
            scheme.type = 'apiKey'
            break
          case 'oauth2':
            scheme.type = 'oauth2'
            break
          case 'http':
            scheme.type = 'http'
            break
          case 'mutualtls':
            scheme.type = 'mutualTLS'
            break
          case 'openidconnect':
            scheme.type = 'openIdConnect'
            break
          default:
            scheme.type = type
        }
      }
    }
  }

  return transformed
}

describe('transform', () => {
  describe('required properties', () => {
    /** @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#openapi-object */
    it('adds required properties', () => {
      const result = transform({})

      expect(result).toStrictEqual({
        openapi: DEFAULT_OPENAPI_VERSION,
        info: {
          title: '',
          version: '1.0',
        },
      })
    })

    it('doesn’t overwrite existing properties', () => {
      const result = transform({
        openapi: '3.0.0',
        info: {
          title: 'Foobar',
        },
      })

      expect(result).toStrictEqual({
        openapi: '3.0.0',
        info: {
          title: 'Foobar',
          version: '1.0',
        },
      })
    })

    it('throws an error when it’s a swagger document', () => {
      expect(() =>
        transform({
          swagger: '2.0',
        }),
      ).toThrow(
        'Swagger 2.0 documents are not supported. Please upgrade to OpenAPI 3.x.',
      )
    })
  })

  describe('components.securitySchemes', () => {
    it('normalizes security scheme types to lowercase', () => {
      const result = transform({
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'HTTP',
              scheme: 'bearer',
            },
            basicAuth: {
              type: 'HTTP',
              scheme: 'basic',
            },
            apiKeyHeader: {
              type: 'APIKEY',
              in: 'header',
              name: 'X-API-Key',
            },
            oauth2: {
              type: 'OAUTH2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token',
                  scopes: {},
                },
              },
            },
            openIdConnect: {
              type: 'OPENIDCONNECT',
              openIdConnectUrl:
                'https://example.com/.well-known/openid-configuration',
            },
          },
        },
      })

      expect(result.components?.securitySchemes).toStrictEqual({
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
        apiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {},
            },
          },
        },
        openIdConnect: {
          type: 'openIdConnect',
          openIdConnectUrl:
            'https://example.com/.well-known/openid-configuration',
        },
      })
    })
  })
})
