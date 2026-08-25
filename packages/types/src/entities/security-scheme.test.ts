import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import type { SecuritySchemeOauth2 } from './security-scheme'
import {
  oasSecurityRequirementSchema,
  pkceOptions,
  securityApiKeySchema,
  securityHttpSchema,
  securityOauthSchema,
  securityOpenIdSchema,
  securitySchemeSchema,
} from './security-scheme'

describe('Security Schemas', () => {
  describe('API Key Schema', () => {
    it('validates a valid API key schema', () => {
      const apiKey = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
        description: 'API Key Authentication',
        uid: 'apikey123',
        nameKey: 'x-api-key',
        value: 'test-api-key',
      }

      expect(validate(securityApiKeySchema, apiKey)).toBe(true)
    })

    it('applies default values', () => {
      const minimalApiKey = {
        type: 'apiKey',
        uid: 'apikey123',
      }

      const result = coerce(securityApiKeySchema, minimalApiKey)
      expect(result).toEqual({
        type: 'apiKey',
        uid: 'apikey123',
        name: '',
        in: 'header',
        nameKey: '',
        value: '',
      })
    })
  })

  describe('HTTP Schema', () => {
    it('validates a valid HTTP basic schema', () => {
      const httpBasic = {
        type: 'http',
        scheme: 'basic',
        description: 'Basic HTTP Authentication',
        uid: 'http123',
        bearerFormat: 'JWT',
        nameKey: '',
        username: 'user',
        password: 'pass',
        token: '',
      }

      expect(validate(securityHttpSchema, httpBasic)).toBe(true)
    })

    it('coerces a valid HTTP bearer schema', () => {
      const httpBearer = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer Authentication',
        uid: 'http456',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      }

      const result = coerce(securityHttpSchema, httpBearer)
      expect(result.type).toBe('http')
      expect(result.scheme).toBe('bearer')
      expect(result.token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    })

    it('applies default values', () => {
      const minimalHttp = {
        type: 'http',
        uid: 'http123',
      }

      const result = coerce(securityHttpSchema, minimalHttp)
      expect(result).toEqual({
        type: 'http',
        uid: 'http123',
        scheme: 'basic',
        bearerFormat: 'JWT',
        nameKey: '',
        username: '',
        password: '',
        token: '',
      })
    })

    it('falls back to basic for invalid scheme values', () => {
      const invalidHttp = {
        type: 'http',
        scheme: 'digest',
        uid: 'http123',
      }

      const result = coerce(securityHttpSchema, invalidHttp)
      expect(result.scheme).toBe('basic')
    })
  })

  describe('OpenID Connect Schema', () => {
    it('validates a valid OpenID schema', () => {
      const openId = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        description: 'OpenID Connect',
        uid: 'openid123',
        nameKey: 'openid',
      }

      expect(validate(securityOpenIdSchema, openId)).toBe(true)
    })

    it('applies default values', () => {
      const minimalOpenId = {
        type: 'openIdConnect',
        uid: 'openid123',
      }

      const result = coerce(securityOpenIdSchema, minimalOpenId)
      expect(result).toEqual({
        type: 'openIdConnect',
        uid: 'openid123',
        openIdConnectUrl: '',
        nameKey: '',
      })
    })
  })

  describe('OAuth2 Schema', () => {
    it('coerces a valid OAuth2 implicit flow schema', () => {
      const oauth2Implicit = {
        type: 'oauth2',
        description: 'OAuth2 Implicit Flow',
        uid: 'oauth123',
        flows: {
          implicit: {
            type: 'implicit',
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              'read:api': 'Read access',
              'write:api': 'Write access',
            },
            selectedScopes: ['read:api'],
            token: 'access-token-123',
          },
        },
      }

      const result = coerce(securityOauthSchema, oauth2Implicit) as SecuritySchemeOauth2
      expect(result.type).toBe('oauth2')
      expect(result.flows.implicit?.authorizationUrl).toBe('https://example.com/oauth/authorize')
      expect(result.flows.implicit?.selectedScopes).toEqual(['read:api'])
    })

    it('coerces a valid OAuth2 with missing scopes', () => {
      const oauth2Implicit = {
        type: 'oauth2',
        description: 'OAuth2 Implicit Flow',
        uid: 'oauth123',
        flows: {
          implicit: {
            type: 'implicit',
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: null,
            selectedScopes: ['read:api'],
            token: 'access-token-123',
          },
        },
      }

      const result = coerce(securityOauthSchema, oauth2Implicit) as SecuritySchemeOauth2
      expect(result.type).toBe('oauth2')
      // Invalid `scopes` falls back to an empty record.
      expect(result.flows.implicit?.scopes).toEqual({})
    })

    it('coerces a valid OAuth2 authorization code flow schema', () => {
      const oauth2AuthCode = {
        type: 'oauth2',
        description: 'OAuth2 Authorization Code Flow',
        uid: 'oauth456',
        flows: {
          authorizationCode: {
            type: 'authorizationCode',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            'x-usePkce': 'SHA-256',
            scopes: {
              'read:api': 'Read access',
              'write:api': 'Write access',
            },
            clientSecret: 'client-secret',
            token: 'access-token-456',
            'x-scalar-security-query': {
              prompt: 'consent',
            },
            'x-scalar-security-body': {
              audience: 'foo',
            },
          },
        },
      }

      const result = coerce(securityOauthSchema, oauth2AuthCode) as SecuritySchemeOauth2
      expect(result.type).toBe('oauth2')
      expect(result.flows.authorizationCode?.['x-usePkce']).toBe('SHA-256')
      expect(result.flows.authorizationCode?.['x-scalar-security-query']).toEqual({
        prompt: 'consent',
      })
      expect(result.flows.authorizationCode?.['x-scalar-security-body']).toEqual({
        audience: 'foo',
      })
    })

    it('coerces a valid OAuth2 client credentials flow schema', () => {
      const oauth2ClientCreds = {
        type: 'oauth2',
        description: 'OAuth2 Client Credentials Flow',
        uid: 'oauth789',
        flows: {
          clientCredentials: {
            type: 'clientCredentials',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            clientSecret: 'client-secret',
            token: 'access-token-789',
          },
        },
      }

      const result = coerce(securityOauthSchema, oauth2ClientCreds) as SecuritySchemeOauth2
      expect(result.type).toBe('oauth2')
      expect(result.flows.clientCredentials?.tokenUrl).toBe('https://example.com/oauth/token')
    })

    it('coerces a valid OAuth2 password flow schema', () => {
      const oauth2Password = {
        type: 'oauth2',
        description: 'OAuth2 Password Flow',
        uid: 'oauth101',
        flows: {
          password: {
            type: 'password',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            username: 'testuser',
            password: 'testpass',
            clientSecret: 'client-secret',
            token: 'access-token-101',
            'x-scalar-security-query': {
              prompt: 'consent',
              audience: 'scalar',
            },
          },
        },
      }

      const result = coerce(securityOauthSchema, oauth2Password) as SecuritySchemeOauth2
      expect(result.type).toBe('oauth2')
      expect(result.flows.password?.username).toBe('testuser')
    })

    it('applies default values', () => {
      const minimalOauth2 = {
        type: 'oauth2',
        uid: 'oauth123',
      }

      const result = coerce(securityOauthSchema, minimalOauth2) as SecuritySchemeOauth2
      expect(result.flows.implicit).toBeDefined()
      expect(result.flows.implicit?.authorizationUrl).toBe('http://localhost:8080')
      expect(result.flows.implicit?.scopes).toEqual({})
      expect(result.flows.implicit?.selectedScopes).toEqual([])
      expect(result.flows.implicit?.token).toBe('')
      expect(result.nameKey).toBe('')
    })

    it('validates PKCE options', () => {
      expect(pkceOptions).toContain('SHA-256')
      expect(pkceOptions).toContain('plain')
      expect(pkceOptions).toContain('no')
    })

    it('applies x-default-scopes', () => {
      const oauth2 = {
        type: 'oauth2',
        uid: 'oauth123',
        'x-default-scopes': ['read:api', 'write:api'],
      }

      const result = coerce(securitySchemeSchema, oauth2)
      if (result.type !== 'oauth2') {
        throw new Error('Expected oauth2 schema')
      }
      expect(result['x-default-scopes']).toEqual(['read:api', 'write:api'])
      expect(result.flows.implicit?.selectedScopes).toEqual(['read:api', 'write:api'])
    })
  })

  describe('Security Requirement Schema', () => {
    it('validates a valid security requirement', () => {
      const securityRequirement = {
        'api_key': [],
        'oauth2': ['read:api', 'write:api'],
      }

      expect(validate(oasSecurityRequirementSchema, securityRequirement)).toBe(true)
    })

    it('applies default values for empty scopes', () => {
      const securityRequirement = {
        'api_key': undefined,
      }

      const result = coerce(oasSecurityRequirementSchema, securityRequirement)
      expect(result).toEqual({
        'api_key': [],
      })
    })
  })

  describe('Combined Security Scheme', () => {
    it('coerces all security scheme types', () => {
      const apiKey = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
        uid: 'apikey123',
        value: 'test-api-key',
      }

      const http = {
        type: 'http',
        scheme: 'bearer',
        uid: 'http123',
        token: 'bearer-token',
      }

      const openId = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        uid: 'openid123',
      }

      const oauth2 = {
        type: 'oauth2',
        uid: 'oauth123',
        flows: {
          implicit: {
            type: 'implicit',
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            token: '',
          },
        },
      }

      expect(coerce(securitySchemeSchema, apiKey).type).toBe('apiKey')
      expect(coerce(securitySchemeSchema, http).type).toBe('http')
      expect(coerce(securitySchemeSchema, openId).type).toBe('openIdConnect')
      expect(coerce(securitySchemeSchema, oauth2).type).toBe('oauth2')
    })
  })
})
