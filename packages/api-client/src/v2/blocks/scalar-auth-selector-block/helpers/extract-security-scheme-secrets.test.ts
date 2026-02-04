import type { SecurityScheme } from '@scalar/types/entities'
import { createAuthStore } from '@scalar/workspace-store/entities/auth'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { type ConfigAuthScheme, extractSecuritySchemeSecrets } from './extract-security-scheme-secrets'
import type {
  ApiKeyObjectSecret,
  HttpObjectSecret,
  OAuth2ObjectSecret,
  OpenIdConnectObjectSecret,
} from './secret-types'

describe('extractSecuritySchemeSecrets', () => {
  const documentSlug = 'test-document'
  const schemeName = 'test-scheme'

  describe('apiKey security scheme', () => {
    it('returns apiKey scheme with empty secret when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': '',
      } satisfies ApiKeyObjectSecret)
    })

    it('returns apiKey scheme with token from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'secret-token-123',
      })

      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'secret-token-123',
      } satisfies ApiKeyObjectSecret)
    })

    it('returns apiKey scheme with token from config when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: SecuritySchemeObject & Partial<SecurityScheme> = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'config-token',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)
      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'config-token',
        'x-scalar-secret-token': 'config-token',
      })
    })

    it('prioritizes auth store token over config token', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'store-token',
      })

      const scheme: SecuritySchemeObject & Partial<SecurityScheme> = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'config-token',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'config-token',
        'x-scalar-secret-token': 'store-token',
      })
    })

    it('handles apiKey in query parameter', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
        'x-scalar-secret-token': '',
      } satisfies ApiKeyObjectSecret)
    })

    it('handles apiKey in cookie', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
        'x-scalar-secret-token': '',
      } satisfies ApiKeyObjectSecret)
    })

    it('preserves additional properties from scheme', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for authentication',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for authentication',
        'x-scalar-secret-token': '',
      } satisfies ApiKeyObjectSecret)
    })
  })

  describe('http security scheme', () => {
    it('returns http scheme with empty secrets when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'bearer',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      } satisfies HttpObjectSecret)
    })

    it('returns http bearer scheme with token from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'http',
        'x-scalar-secret-token': 'bearer-token-123',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      })

      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'bearer',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': 'bearer-token-123',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      } satisfies HttpObjectSecret)
    })

    it('returns http basic scheme with username and password from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'http',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': 'john.doe',
        'x-scalar-secret-password': 'secret-pass',
      })

      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'basic',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': 'john.doe',
        'x-scalar-secret-password': 'secret-pass',
      } satisfies HttpObjectSecret)
    })

    it('returns http scheme with credentials from config when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'basic',
        username: 'config-user',
        password: 'config-pass',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)
      expect(result).toMatchObject({
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': 'config-user',
        'x-scalar-secret-password': 'config-pass',
      } satisfies HttpObjectSecret)
    })

    it('prioritizes auth store credentials over config', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'http',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': 'store-user',
        'x-scalar-secret-password': 'store-pass',
      })

      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'basic',
        username: 'config-user',
        password: 'config-pass',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': 'store-user',
        'x-scalar-secret-password': 'store-pass',
      } satisfies HttpObjectSecret)
    })

    it('handles http bearer with bearerFormat', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      } satisfies HttpObjectSecret)
    })

    it('preserves description from scheme', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'bearer',
        description: 'JWT Bearer authentication',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        description: 'JWT Bearer authentication',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      } satisfies HttpObjectSecret)
    })
  })

  describe('oauth2 security scheme - implicit flow', () => {
    it('returns oauth2 implicit flow with empty secrets when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              read: 'Read access',
              write: 'Write access',
            },
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              read: 'Read access',
              write: 'Write access',
            },
            refreshUrl: '',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-redirect-uri': '',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 implicit flow with secrets from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        implicit: {
          'x-scalar-secret-client-id': 'client-123',
          'x-scalar-secret-redirect-uri': 'https://app.example.com/callback',
          'x-scalar-secret-token': 'access-token-123',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'client-123',
            'x-scalar-secret-redirect-uri': 'https://app.example.com/callback',
            'x-scalar-secret-token': 'access-token-123',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 implicit flow with secrets from config when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            'x-scalar-client-id': 'config-client-id',
            'x-scalar-redirect-uri': 'https://config.example.com/callback',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'config-client-id',
            'x-scalar-secret-redirect-uri': 'https://config.example.com/callback',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('prioritizes auth store secrets over config for implicit flow', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        implicit: {
          'x-scalar-secret-client-id': 'store-client-id',
          'x-scalar-secret-redirect-uri': 'https://store.example.com/callback',
          'x-scalar-secret-token': 'store-token',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            'x-scalar-client-id': 'config-client-id',
            'x-scalar-redirect-uri': 'https://config.example.com/callback',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'store-client-id',
            'x-scalar-secret-redirect-uri': 'https://store.example.com/callback',
            'x-scalar-secret-token': 'store-token',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('extracts selected scopes from implicit flow config', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              read: 'Read access',
              write: 'Write access',
              admin: 'Admin access',
            },
            refreshUrl: '',
            selectedScopes: ['read', 'write'],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              read: 'Read access',
              write: 'Write access',
              admin: 'Admin access',
            },
            refreshUrl: '',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-redirect-uri': '',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': ['read', 'write'],
      } satisfies OAuth2ObjectSecret)
    })
  })

  describe('oauth2 security scheme - password flow', () => {
    it('returns oauth2 password flow with empty secrets when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 password flow with secrets from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        password: {
          'x-scalar-secret-client-id': 'client-123',
          'x-scalar-secret-client-secret': 'client-secret-456',
          'x-scalar-secret-username': 'user@example.com',
          'x-scalar-secret-password': 'user-password',
          'x-scalar-secret-token': 'access-token-789',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'client-123',
            'x-scalar-secret-client-secret': 'client-secret-456',
            'x-scalar-secret-username': 'user@example.com',
            'x-scalar-secret-password': 'user-password',
            'x-scalar-secret-token': 'access-token-789',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 password flow with secrets from config when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-client-id': 'config-client',
            clientSecret: 'config-secret',
            username: 'config-user',
            password: 'config-pass',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'config-client',
            'x-scalar-secret-client-secret': 'config-secret',
            'x-scalar-secret-username': 'config-user',
            'x-scalar-secret-password': 'config-pass',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('extracts selected scopes from password flow config', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              read: 'Read',
              write: 'Write',
            },
            refreshUrl: '',
            selectedScopes: ['read'],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual(['read'])
    })
  })

  describe('oauth2 security scheme - clientCredentials flow', () => {
    it('returns oauth2 clientCredentials flow with empty secrets when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 clientCredentials flow with secrets from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        clientCredentials: {
          'x-scalar-secret-client-id': 'client-123',
          'x-scalar-secret-client-secret': 'secret-456',
          'x-scalar-secret-token': 'token-789',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'client-123',
            'x-scalar-secret-client-secret': 'secret-456',
            'x-scalar-secret-token': 'token-789',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 clientCredentials flow with secrets from config when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-client-id': 'config-client',
            clientSecret: 'config-secret',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-scalar-secret-client-id': 'config-client',
            'x-scalar-secret-client-secret': 'config-secret',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('extracts selected scopes from clientCredentials flow config', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'api:read': 'API Read',
              'api:write': 'API Write',
            },
            refreshUrl: '',
            selectedScopes: ['api:read', 'api:write'],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual(['api:read', 'api:write'])
    })
  })

  describe('oauth2 security scheme - authorizationCode flow', () => {
    it('returns oauth2 authorizationCode flow with empty secrets when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 authorizationCode flow with secrets from auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-client-id': 'client-123',
          'x-scalar-secret-client-secret': 'secret-456',
          'x-scalar-secret-redirect-uri': 'https://app.example.com/callback',
          'x-scalar-secret-token': 'token-789',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'client-123',
            'x-scalar-secret-client-secret': 'secret-456',
            'x-scalar-secret-redirect-uri': 'https://app.example.com/callback',
            'x-scalar-secret-token': 'token-789',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('returns oauth2 authorizationCode flow with secrets from config when no auth store data', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
            'x-scalar-client-id': 'config-client',
            clientSecret: 'config-secret',
            'x-scalar-redirect-uri': 'https://config.example.com/callback',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toMatchObject({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
            'x-scalar-secret-client-id': 'config-client',
            'x-scalar-secret-client-secret': 'config-secret',
            'x-scalar-secret-redirect-uri': 'https://config.example.com/callback',
            'x-scalar-secret-token': '',
          },
        },
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('handles authorizationCode flow with PKCE enabled', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'SHA-256',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret).flows.authorizationCode?.['x-usePkce']).toBe('SHA-256')
    })

    it('extracts selected scopes from authorizationCode flow config', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              openid: 'OpenID',
              profile: 'Profile',
              email: 'Email',
            },
            refreshUrl: '',
            'x-usePkce': 'no',
            selectedScopes: ['openid', 'profile', 'email'],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual(['openid', 'profile', 'email'])
    })
  })

  describe('oauth2 security scheme - multiple flows', () => {
    it('handles oauth2 with multiple flows', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        implicit: {
          'x-scalar-secret-client-id': 'implicit-client',
          'x-scalar-secret-redirect-uri': 'https://implicit.example.com/callback',
          'x-scalar-secret-token': 'implicit-token',
        },
        authorizationCode: {
          'x-scalar-secret-client-id': 'auth-code-client',
          'x-scalar-secret-client-secret': 'auth-code-secret',
          'x-scalar-secret-redirect-uri': 'https://auth.example.com/callback',
          'x-scalar-secret-token': 'auth-code-token',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: { read: 'Read' },
            refreshUrl: '',
          },
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: { write: 'Write' },
            refreshUrl: '',
            'x-usePkce': 'no',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret).flows.implicit).toEqual({
        authorizationUrl: 'https://example.com/oauth/authorize',
        scopes: { read: 'Read' },
        refreshUrl: '',
        'x-scalar-secret-client-id': 'implicit-client',
        'x-scalar-secret-redirect-uri': 'https://implicit.example.com/callback',
        'x-scalar-secret-token': 'implicit-token',
      })

      expect((result as OAuth2ObjectSecret).flows.authorizationCode).toEqual({
        authorizationUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        scopes: { write: 'Write' },
        refreshUrl: '',
        'x-usePkce': 'no',
        'x-scalar-secret-client-id': 'auth-code-client',
        'x-scalar-secret-client-secret': 'auth-code-secret',
        'x-scalar-secret-redirect-uri': 'https://auth.example.com/callback',
        'x-scalar-secret-token': 'auth-code-token',
      })
    })

    it('handles oauth2 with all four flows', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
          },
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
          },
          clientCredentials: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
          },
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
            refreshUrl: '',
            'x-usePkce': 'no',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret).flows.implicit).toBeDefined()
      expect((result as OAuth2ObjectSecret).flows.password).toBeDefined()
      expect((result as OAuth2ObjectSecret).flows.clientCredentials).toBeDefined()
      expect((result as OAuth2ObjectSecret).flows.authorizationCode).toBeDefined()
    })

    it('merges selected scopes from all flows', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: { read: 'Read' },
            refreshUrl: '',
            selectedScopes: ['read'],
          },
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: { write: 'Write', admin: 'Admin' },
            refreshUrl: '',
            'x-usePkce': 'no',
            selectedScopes: ['write', 'admin'],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      // We expect all unique scopes from all flows
      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual(['read', 'write', 'admin'])
    })

    it('handles duplicate scopes across flows', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: { read: 'Read' },
            refreshUrl: '',
            selectedScopes: ['read'],
          },
          password: {
            tokenUrl: 'https://example.com/oauth/token',
            scopes: { read: 'Read', write: 'Write' },
            refreshUrl: '',
            selectedScopes: ['read', 'write'],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      // Set should deduplicate the 'read' scope
      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual(['read', 'write'])
    })
  })

  describe('oauth2 security scheme - edge cases', () => {
    it('handles oauth2 with empty flows object', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {},
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {},
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('handles oauth2 with undefined flows', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        // @ts-expect-error - invalid type
        flows: undefined,
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'oauth2',
        flows: {},
        'x-default-scopes': [],
      } satisfies OAuth2ObjectSecret)
    })

    it('handles oauth2 flow with null value', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          // @ts-expect-error - invalid type
          implicit: null,
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret).flows.implicit).toBeUndefined()
    })

    it('handles oauth2 with selectedScopes that is not an array', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            // @ts-expect-error - invalid type
            selectedScopes: 'invalid',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      // Should not crash and should not include invalid scopes
      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual([])
    })

    it('handles oauth2 with empty selectedScopes array', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
            selectedScopes: [],
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect((result as OAuth2ObjectSecret)['x-default-scopes']).toEqual([])
    })

    it('preserves description in oauth2 scheme', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'oauth2',
        description: 'OAuth 2.0 authentication',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {},
            refreshUrl: '',
          },
        },
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result.description).toBe('OAuth 2.0 authentication')
    })
  })

  describe('openIdConnect security scheme', () => {
    it('returns openIdConnect scheme unchanged', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      } satisfies OpenIdConnectObjectSecret)
    })

    it('preserves description in openIdConnect scheme', () => {
      const authStore = createAuthStore()
      const scheme: ConfigAuthScheme = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        description: 'OpenID Connect authentication',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        description: 'OpenID Connect authentication',
      } satisfies OpenIdConnectObjectSecret)
    })

    it('returns openIdConnect scheme unchanged even when auth store has data', () => {
      const authStore = createAuthStore()
      // Even if we set some auth data, openIdConnect should not use it
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'some-token',
      })

      const scheme: ConfigAuthScheme = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      } satisfies OpenIdConnectObjectSecret)
    })
  })

  describe('type mismatch handling', () => {
    it('returns empty secrets when auth store has different type than scheme', () => {
      const authStore = createAuthStore()
      // Store has apiKey type
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'api-key-token',
      })

      // But scheme is http type
      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'bearer',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      // Should not use the apiKey token for http scheme
      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      } satisfies HttpObjectSecret)
    })

    it('returns empty secrets when auth store has http but scheme is apiKey', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'http',
        'x-scalar-secret-token': 'http-token',
        'x-scalar-secret-username': 'user',
        'x-scalar-secret-password': 'pass',
      })

      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': '',
      } satisfies ApiKeyObjectSecret)
    })

    it('returns empty secrets when auth store has oauth2 but scheme is http', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, schemeName, {
        type: 'oauth2',
        implicit: {
          'x-scalar-secret-client-id': 'client-id',
          'x-scalar-secret-redirect-uri': 'https://example.com/callback',
          'x-scalar-secret-token': 'oauth-token',
        },
      })

      const scheme: ConfigAuthScheme = {
        type: 'http',
        scheme: 'bearer',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      } satisfies HttpObjectSecret)
    })
  })

  describe('different document and scheme names', () => {
    it('handles different document slugs correctly', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets('document-1', schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'token-1',
      })
      authStore.setAuthSecrets('document-2', schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'token-2',
      })

      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result1 = extractSecuritySchemeSecrets(scheme, authStore, schemeName, 'document-1')
      const result2 = extractSecuritySchemeSecrets(scheme, authStore, schemeName, 'document-2')

      expect((result1 as ApiKeyObjectSecret)['x-scalar-secret-token']).toBe('token-1')
      expect((result2 as ApiKeyObjectSecret)['x-scalar-secret-token']).toBe('token-2')
    })

    it('handles different scheme names correctly', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, 'scheme-1', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token-1',
      })
      authStore.setAuthSecrets(documentSlug, 'scheme-2', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token-2',
      })

      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result1 = extractSecuritySchemeSecrets(scheme, authStore, 'scheme-1', documentSlug)
      const result2 = extractSecuritySchemeSecrets(scheme, authStore, 'scheme-2', documentSlug)

      expect((result1 as ApiKeyObjectSecret)['x-scalar-secret-token']).toBe('token-1')
      expect((result2 as ApiKeyObjectSecret)['x-scalar-secret-token']).toBe('token-2')
    })

    it('returns empty secrets when document slug does not exist in auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets('existing-document', schemeName, {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, 'non-existing-document')

      // @ts-expect-error - invalid type
      expect(result['x-scalar-secret-token']).toBe('')
    })

    it('returns empty secrets when scheme name does not exist in auth store', () => {
      const authStore = createAuthStore()
      authStore.setAuthSecrets(documentSlug, 'existing-scheme', {
        type: 'apiKey',
        'x-scalar-secret-token': 'token',
      })

      const scheme: ConfigAuthScheme = {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }

      const result = extractSecuritySchemeSecrets(scheme, authStore, 'non-existing-scheme', documentSlug)

      // @ts-expect-error - invalid type
      expect(result['x-scalar-secret-token']).toBe('')
    })
  })

  describe('unknown security scheme types', () => {
    it('returns scheme unchanged for unknown type', () => {
      const authStore = createAuthStore()
      const scheme = {
        type: 'unknown',
        someProperty: 'value',
      } as unknown as SecuritySchemeObject

      const result = extractSecuritySchemeSecrets(scheme, authStore, schemeName, documentSlug)

      expect(result).toEqual({
        type: 'unknown',
        someProperty: 'value',
      })
    })
  })
})
