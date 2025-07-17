import { describe, expect, it } from 'vitest'
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
    it('should validate a valid API key schema', () => {
      const apiKey = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
        description: 'API Key Authentication',
        uid: 'apikey123',
        nameKey: 'x-api-key',
        value: 'test-api-key',
      }

      const result = securityApiKeySchema.safeParse(apiKey)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const minimalApiKey = {
        type: 'apiKey',
        uid: 'apikey123',
      }

      const result = securityApiKeySchema.parse(minimalApiKey)
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
    it('should validate a valid HTTP basic schema', () => {
      const httpBasic = {
        type: 'http',
        scheme: 'basic',
        description: 'Basic HTTP Authentication',
        uid: 'http123',
        username: 'user',
        password: 'pass',
      }

      const result = securityHttpSchema.safeParse(httpBasic)
      expect(result.success).toBe(true)
    })

    it('should validate a valid HTTP bearer schema', () => {
      const httpBearer = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer Authentication',
        uid: 'http456',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      }

      const result = securityHttpSchema.safeParse(httpBearer)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const minimalHttp = {
        type: 'http',
        uid: 'http123',
      }

      const result = securityHttpSchema.parse(minimalHttp)
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

    it('should reject invalid scheme values', () => {
      const invalidHttp = {
        type: 'http',
        scheme: 'digest',
        uid: 'http123',
      }

      const result = securityHttpSchema.safeParse(invalidHttp)
      expect(result.success).toBe(false)
    })
  })

  describe('OpenID Connect Schema', () => {
    it('should validate a valid OpenID schema', () => {
      const openId = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        description: 'OpenID Connect',
        uid: 'openid123',
        nameKey: 'openid',
      }

      const result = securityOpenIdSchema.safeParse(openId)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const minimalOpenId = {
        type: 'openIdConnect',
        uid: 'openid123',
      }

      const result = securityOpenIdSchema.parse(minimalOpenId)
      expect(result).toEqual({
        type: 'openIdConnect',
        uid: 'openid123',
        openIdConnectUrl: '',
        nameKey: '',
      })
    })
  })

  describe('OAuth2 Schema', () => {
    it('should validate a valid OAuth2 implicit flow schema', () => {
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

      const result = securityOauthSchema.safeParse(oauth2Implicit)
      expect(result.success).toBe(true)
    })

    it('should validate a valid OAuth2 with missing scopes', () => {
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

      const result = securityOauthSchema.safeParse(oauth2Implicit)
      expect(result.success).toBe(true)
    })

    it('should validate a valid OAuth2 authorization code flow schema', () => {
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

      const result = securityOauthSchema.safeParse(oauth2AuthCode)
      expect(result.success).toBe(true)
      expect(result.data?.flows.authorizationCode?.['x-scalar-security-query']).toEqual({
        prompt: 'consent',
      })
      expect(result.data?.flows.authorizationCode?.['x-scalar-security-body']).toEqual({
        audience: 'foo',
      })
    })

    it('should validate a valid OAuth2 client credentials flow schema', () => {
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

      const result = securityOauthSchema.safeParse(oauth2ClientCreds)
      expect(result.success).toBe(true)
    })

    it('should validate a valid OAuth2 password flow schema', () => {
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

      const result = securityOauthSchema.safeParse(oauth2Password)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const minimalOauth2 = {
        type: 'oauth2',
        uid: 'oauth123',
      }

      const result = securityOauthSchema.parse(minimalOauth2)
      expect(result.flows.implicit).toBeDefined()
      expect(result.flows.implicit?.authorizationUrl).toBe('http://localhost:8080')
      expect(result.flows.implicit?.scopes).toEqual({})
      expect(result.flows.implicit?.selectedScopes).toEqual([])
      expect(result.flows.implicit?.token).toBe('')
      expect(result.nameKey).toBe('')
    })

    it('should validate PKCE options', () => {
      expect(pkceOptions).toContain('SHA-256')
      expect(pkceOptions).toContain('plain')
      expect(pkceOptions).toContain('no')
    })

    it('should apply x-default-scopes', () => {
      const oauth2 = {
        type: 'oauth2',
        uid: 'oauth123',
        'x-default-scopes': ['read:api', 'write:api'],
      }

      const result = securitySchemeSchema.parse(oauth2)
      if (result.type !== 'oauth2') {
        throw new Error('Expected oauth2 schema')
      }
      expect(result['x-default-scopes']).toEqual(['read:api', 'write:api'])
      expect(result.flows.implicit?.selectedScopes).toEqual(['read:api', 'write:api'])
    })
  })

  describe('Security Requirement Schema', () => {
    it('should validate a valid security requirement', () => {
      const securityRequirement = {
        'api_key': [],
        'oauth2': ['read:api', 'write:api'],
      }

      const result = oasSecurityRequirementSchema.safeParse(securityRequirement)
      expect(result.success).toBe(true)
    })

    it('should apply default values for empty scopes', () => {
      const securityRequirement = {
        'api_key': undefined,
      }

      const result = oasSecurityRequirementSchema.parse(securityRequirement)
      expect(result).toEqual({
        'api_key': [],
      })
    })
  })

  describe('Combined Security Scheme', () => {
    it('should validate all security scheme types', () => {
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

      expect(securitySchemeSchema.safeParse(apiKey).success).toBe(true)
      expect(securitySchemeSchema.safeParse(http).success).toBe(true)
      expect(securitySchemeSchema.safeParse(openId).success).toBe(true)
      expect(securitySchemeSchema.safeParse(oauth2).success).toBe(true)
    })
  })
})
