import { describe, expect, it } from 'vitest'

import { DEFAULT_OPENAPI_VERSION, DEFAULT_TITLE, sanitize } from './sanitize'

describe('sanitize', () => {
  describe('required properties', () => {
    /** @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#openapi-object */
    it('adds required properties', () => {
      const result = sanitize({})

      expect(result).toStrictEqual({
        openapi: DEFAULT_OPENAPI_VERSION,
        info: {
          title: DEFAULT_TITLE,
          version: '1.0',
        },
      })
    })

    it(`doesn't overwrite existing properties`, () => {
      const result = sanitize({
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

    it("throws an error when it's a swagger document", () => {
      expect(() =>
        sanitize({
          swagger: '2.0',
        }),
      ).toThrow('Swagger 2.0 documents are not supported. Please upgrade to OpenAPI 3.x.')
    })
  })

  describe('tags', () => {
    it('adds missing tags', () => {
      const result = sanitize({
        paths: {
          '/pets': {
            get: {
              tags: ['pets'],
              responses: {},
            },
          },
          '/stores': {
            get: {
              tags: ['stores'],
              responses: {},
            },
          },
        },
      })

      expect(result.tags).toStrictEqual([{ name: 'pets' }, { name: 'stores' }])
    })
  })

  describe('components.securitySchemes', () => {
    it('normalizes security scheme types to lowercase', () => {
      const result = sanitize({
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
              openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
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
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        },
      })
    })

    it('converts array scopes to objects', () => {
      const result = sanitize({
        components: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token',
                  scopes: ['read:data', 'write:data'],
                },
              },
            },
          },
        },
      })

      expect(result.components?.securitySchemes?.oauth2.flows.authorizationCode.scopes).toStrictEqual({
        'read:data': '',
        'write:data': '',
      })
    })
  })
})
