import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type SecuritySchemeObject, SecuritySchemeObjectSchema } from './openapi-document'

describe('security-scheme', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof SecuritySchemeObjectSchema>>
      type TypescriptType = RequiredDeep<SecuritySchemeObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    describe('ApiKey security scheme', () => {
      it('parses valid apiKey security scheme with all properties correctly', () => {
        const validInput = {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API key for authentication',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API key for authentication',
          'x-scalar-secret-token': '',
        })
      })

      it('parses valid apiKey security scheme with minimal properties correctly', () => {
        const validInput = {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          'x-scalar-secret-token': '',
        })
      })

      it('parses valid apiKey security scheme in cookie correctly', () => {
        const validInput = {
          type: 'apiKey',
          name: 'session_id',
          in: 'cookie',
          description: 'Session cookie for authentication',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'apiKey',
          name: 'session_id',
          in: 'cookie',
          description: 'Session cookie for authentication',
          'x-scalar-secret-token': '',
        })
      })
    })

    describe('HTTP security scheme', () => {
      it('parses valid http security scheme with all properties correctly', () => {
        const validInput = {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        })
      })

      it('parses valid http security scheme with minimal properties correctly', () => {
        const validInput = {
          type: 'http',
          scheme: 'basic',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        })
      })

      it('parses valid http security scheme with digest correctly', () => {
        const validInput = {
          type: 'http',
          scheme: 'digest',
          description: 'Digest authentication',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'http',
          scheme: 'digest',
          description: 'Digest authentication',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        })
      })
    })

    describe('OAuth2 security scheme', () => {
      it('parses valid oauth2 security scheme with all properties correctly', () => {
        const validInput = {
          type: 'oauth2',
          description: 'OAuth2 authentication',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              scopes: {
                read: 'Read access',
                write: 'Write access',
              },
            },
          },
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'oauth2',
          description: 'OAuth2 authentication',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              refreshUrl: '',
              scopes: {
                read: 'Read access',
                write: 'Write access',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
            },
          },
        })
      })

      it('parses valid oauth2 security scheme with multiple flows correctly', () => {
        const validInput = {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                admin: 'Admin access',
                user: 'User access',
              },
            },
            password: {
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                read: 'Read access',
              },
            },
          },
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              refreshUrl: '',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                admin: 'Admin access',
                user: 'User access',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
              'x-usePkce': 'no',
            },
            password: {
              refreshUrl: '',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                read: 'Read access',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-password': '',
              'x-scalar-secret-token': '',
              'x-scalar-secret-username': '',
            },
          },
        })
      })
    })

    describe('OpenID Connect security scheme', () => {
      it('parses valid openIdConnect security scheme with all properties correctly', () => {
        const validInput = {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
          description: 'OpenID Connect authentication',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
          description: 'OpenID Connect authentication',
        })
      })

      it('parses valid openIdConnect security scheme with minimal properties correctly', () => {
        const validInput = {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://accounts.google.com/.well-known/openid-configuration',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'openIdConnect',
          openIdConnectUrl: 'https://accounts.google.com/.well-known/openid-configuration',
        })
      })
    })

    describe('invalid inputs', () => {
      it('fails when given empty object', () => {
        const invalidInput = {}

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given invalid type', () => {
        const invalidInput = {
          type: 'invalid',
          name: 'test',
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when apiKey is missing required fields', () => {
        const invalidInput = {
          type: 'apiKey',
          name: 'test',
          // missing 'in' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when http is missing required fields', () => {
        const invalidInput = {
          type: 'http',
          // missing 'scheme' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when oauth2 is missing required fields', () => {
        const invalidInput = {
          type: 'oauth2',
          // missing 'flows' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when openIdConnect is missing required fields', () => {
        const invalidInput = {
          type: 'openIdConnect',
          // missing 'openIdConnectUrl' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given non-object input', () => {
        const invalidInput = 'not an object'

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given null input', () => {
        const invalidInput = null

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
