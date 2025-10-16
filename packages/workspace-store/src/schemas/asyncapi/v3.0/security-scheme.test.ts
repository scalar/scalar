import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type SecuritySchemeObject, SecuritySchemeObjectSchema } from './asyncapi-document'

describe('asyncapi-security-scheme', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof SecuritySchemeObjectSchema>>
      type TypescriptType = RequiredDeep<SecuritySchemeObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    describe('User/Password Authentication', () => {
      it('parses userPassword security scheme', () => {
        const validInput = {
          type: 'userPassword',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'userPassword',
        })
      })

      it('parses userPassword security scheme with description', () => {
        const validInput = {
          type: 'userPassword',
          description: 'User/Password authentication',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'userPassword',
          description: 'User/Password authentication',
        })
      })
    })

    describe('API Key Authentication', () => {
      it('parses apiKey security scheme with in: user', () => {
        const validInput = {
          type: 'apiKey',
          in: 'user',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'apiKey',
          in: 'user',
        })
      })

      it('parses apiKey security scheme with in: password', () => {
        const validInput = {
          type: 'apiKey',
          in: 'password',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'apiKey',
          in: 'password',
        })
      })
    })

    describe('X.509 Certificate Authentication', () => {
      it('parses X509 security scheme', () => {
        const validInput = {
          type: 'X509',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'X509',
        })
      })
    })

    describe('End-to-end Encryption Authentication', () => {
      it('parses symmetricEncryption security scheme', () => {
        const validInput = {
          type: 'symmetricEncryption',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'symmetricEncryption',
        })
      })

      it('parses asymmetricEncryption security scheme', () => {
        const validInput = {
          type: 'asymmetricEncryption',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'asymmetricEncryption',
        })
      })
    })

    describe('HTTP Authentication', () => {
      it('parses basic http security scheme', () => {
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

      it('parses JWT bearer http security scheme', () => {
        const validInput = {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        })
      })
    })

    describe('HTTP API Key', () => {
      it('parses httpApiKey security scheme in header', () => {
        const validInput = {
          type: 'httpApiKey',
          name: 'api_key',
          in: 'header',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'httpApiKey',
          name: 'api_key',
          in: 'header',
          'x-scalar-secret-token': '',
        })
      })

      it('parses httpApiKey security scheme in query', () => {
        const validInput = {
          type: 'httpApiKey',
          name: 'api_key',
          in: 'query',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'httpApiKey',
          name: 'api_key',
          in: 'query',
          'x-scalar-secret-token': '',
        })
      })

      it('parses httpApiKey security scheme in cookie', () => {
        const validInput = {
          type: 'httpApiKey',
          name: 'session_id',
          in: 'cookie',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'httpApiKey',
          name: 'session_id',
          in: 'cookie',
          'x-scalar-secret-token': '',
        })
      })
    })

    describe('OAuth2 Authentication', () => {
      it('parses implicit oauth2 security scheme with scopes', () => {
        const validInput = {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/api/oauth/dialog',
              availableScopes: {
                'write:pets': 'modify pets in your account',
                'read:pets': 'read your pets',
              },
            },
          },
          scopes: ['write:pets'],
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/api/oauth/dialog',
              availableScopes: {
                'write:pets': 'modify pets in your account',
                'read:pets': 'read your pets',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
            },
          },
          scopes: ['write:pets'],
        })
      })

      it('parses clientCredentials oauth2 security scheme', () => {
        const validInput = {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: 'https://example.com/api/oauth/token',
              availableScopes: {
                'write:pets': 'modify pets in your account',
                'read:pets': 'read your pets',
              },
            },
          },
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: 'https://example.com/api/oauth/token',
              availableScopes: {
                'write:pets': 'modify pets in your account',
                'read:pets': 'read your pets',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-token': '',
            },
          },
        })
      })

      it('parses multiple oauth2 flows', () => {
        const validInput = {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/api/oauth/dialog',
              availableScopes: {
                'write:pets': 'modify pets in your account',
                'read:pets': 'read your pets',
              },
            },
            authorizationCode: {
              authorizationUrl: 'https://example.com/api/oauth/authorize',
              tokenUrl: 'https://example.com/api/oauth/token',
              availableScopes: {
                admin: 'Admin access',
                user: 'User access',
              },
            },
          },
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/api/oauth/dialog',
              availableScopes: {
                'write:pets': 'modify pets in your account',
                'read:pets': 'read your pets',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
            },
            authorizationCode: {
              authorizationUrl: 'https://example.com/api/oauth/authorize',
              tokenUrl: 'https://example.com/api/oauth/token',
              availableScopes: {
                admin: 'Admin access',
                user: 'User access',
              },
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-redirect-uri': '',
              'x-scalar-secret-token': '',
              'x-usePkce': 'no',
            },
          },
        })
      })
    })

    describe('OpenID Connect Authentication', () => {
      it('parses openIdConnect security scheme', () => {
        const validInput = {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        })
      })

      it('parses openIdConnect security scheme with scopes', () => {
        const validInput = {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
          scopes: ['openid', 'profile', 'email'],
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
          scopes: ['openid', 'profile', 'email'],
        })
      })
    })

    describe('SASL Authentication', () => {
      it('parses plain SASL security scheme', () => {
        const validInput = {
          type: 'plain',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'plain',
        })
      })

      it('parses scramSha256 SASL security scheme', () => {
        const validInput = {
          type: 'scramSha256',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'scramSha256',
        })
      })

      it('parses scramSha512 SASL security scheme', () => {
        const validInput = {
          type: 'scramSha512',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'scramSha512',
        })
      })

      it('parses gssapi SASL security scheme', () => {
        const validInput = {
          type: 'gssapi',
        }

        const result = coerceValue(SecuritySchemeObjectSchema, validInput)

        expect(result).toEqual({
          type: 'gssapi',
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
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when apiKey is missing required in field', () => {
        const invalidInput = {
          type: 'apiKey',
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when httpApiKey is missing required fields', () => {
        const invalidInput = {
          type: 'httpApiKey',
          name: 'api_key',
          // missing 'in' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when http is missing required scheme field', () => {
        const invalidInput = {
          type: 'http',
          // missing 'scheme' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when oauth2 is missing required flows field', () => {
        const invalidInput = {
          type: 'oauth2',
          // missing 'flows' field
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when openIdConnect is missing required openIdConnectUrl field', () => {
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

      it('fails when apiKey has invalid in value', () => {
        const invalidInput = {
          type: 'apiKey',
          in: 'invalid',
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when httpApiKey has invalid in value', () => {
        const invalidInput = {
          type: 'httpApiKey',
          name: 'api_key',
          in: 'body',
        }

        expect(Value.Check(SecuritySchemeObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
