import type { AuthenticationConfiguration } from '@/api-reference/authentication-configuration.ts'
import type { AuthenticationState, OpenAPIV3 } from '@/legacy/reference-config.ts'
import { describe, expect, it } from 'vitest'
import { migrateAuth } from './migrate-auth.ts'

describe('migrateAuth', () => {
  it('should transform HTTP Basic authentication', () => {
    const oldAuth = {
      http: {
        basic: {
          username: 'testuser',
          password: 'testpass',
        },
      },
    }

    const securitySchemes = {
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

    const expected: AuthenticationConfiguration = {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          nameKey: 'basicAuth',
          username: 'testuser',
          password: 'testpass',
        },
      },
    }

    expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
  })

  it('should transform HTTP Bearer authentication', () => {
    const oldAuth = {
      http: {
        bearer: {
          token: 'bearer-token-123',
        },
      },
    }

    const securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

    const expected: AuthenticationConfiguration = {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          nameKey: 'bearerAuth',
          token: 'bearer-token-123',
        },
      },
    }

    expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
  })

  it('should transform API Key authentication', () => {
    const oldAuth = {
      apiKey: {
        token: 'api-key-123',
      },
    }

    const securitySchemes = {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'query',
        name: 'W-API-Key',
      },
    } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

    const expected: AuthenticationConfiguration = {
      securitySchemes: {
        apiKeyAuth: {
          type: 'apiKey',
          nameKey: 'apiKeyAuth',
          value: 'api-key-123',
          name: 'W-API-Key',
          in: 'query',
        },
      },
    }

    expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
  })

  describe('OAuth2 flows', () => {
    it('should transform OAuth2 password flow', () => {
      const oldAuth = {
        oAuth2: {
          clientId: 'client-123',
          scopes: ['read', 'write'],
          accessToken: 'access-token-123',
          state: 'state-123',
          username: 'oauth-user',
          password: 'oauth-pass',
        },
      } satisfies AuthenticationState

      const securitySchemes = {
        oauth2Auth: {
          type: 'oauth2',
          nameKey: 'oauth2Auth',
          flows: {
            password: {
              tokenUrl: 'https://api.example.com/token',
              scopes: {
                read: 'Read access',
                write: 'Write access',
              },
            },
          },
        },
      } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

      const expected = {
        securitySchemes: {
          oauth2Auth: {
            type: 'oauth2',
            nameKey: 'oauth2Auth',
            flows: {
              password: {
                type: 'password',
                tokenUrl: 'https://api.example.com/token',
                selectedScopes: ['read', 'write'],
                token: 'access-token-123',
                username: 'oauth-user',
                password: 'oauth-pass',
                'x-scalar-client-id': 'client-123',
                scopes: {
                  read: '',
                  write: '',
                },
              },
            },
          },
        },
      } satisfies AuthenticationConfiguration

      expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
    })

    it('should transform OAuth2 implicit flow', () => {
      const oldAuth = {
        oAuth2: {
          clientId: 'client-123',
          scopes: ['read'],
          accessToken: 'access-token-123',
        },
      }

      const securitySchemes = {
        oauth2Auth: {
          type: 'oauth2',
          nameKey: 'oauth2Auth',
          flows: {
            implicit: {
              authorizationUrl: 'https://api.example.com/authorize',
              scopes: {
                read: 'Read access',
              },
            },
          },
        },
      } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

      const expected = {
        securitySchemes: {
          oauth2Auth: {
            type: 'oauth2',
            nameKey: 'oauth2Auth',
            flows: {
              implicit: {
                type: 'implicit',
                authorizationUrl: 'https://api.example.com/authorize',
                selectedScopes: ['read'],
                token: 'access-token-123',
                'x-scalar-client-id': 'client-123',
                scopes: {
                  read: '',
                },
              },
            },
          },
        },
      } satisfies AuthenticationConfiguration

      expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
    })
  })

  it('should handle empty authentication config', () => {
    const oldAuth = {}
    const securitySchemes = {}

    const expected: AuthenticationConfiguration = {}

    expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
  })

  describe('preferredSecurityScheme', () => {
    it('should set preferredSecurityScheme when specified', () => {
      const oldAuth = {
        preferredSecurityScheme: 'bearerAuth',
        http: {
          bearer: {
            token: 'bearer-token-123',
          },
        },
      }

      const securitySchemes = {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

      const expected: AuthenticationConfiguration = {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            nameKey: 'bearerAuth',
            token: 'bearer-token-123',
          },
        },
        preferredSecurityScheme: 'bearerAuth',
      }

      expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
    })

    it('should handle complex preferredSecurityScheme configuration', () => {
      const oldAuth = {
        preferredSecurityScheme: [['bearerAuth', 'apiKeyAuth']],
        http: {
          bearer: {
            token: 'bearer-token-123',
          },
        },
      }

      const securitySchemes = {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      } satisfies OpenAPIV3.ComponentsObject['securitySchemes']

      const expected: AuthenticationConfiguration = {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            nameKey: 'bearerAuth',
            token: 'bearer-token-123',
          },
        },
        preferredSecurityScheme: [['bearerAuth', 'apiKeyAuth']],
      }

      expect(migrateAuth(oldAuth, securitySchemes)).toEqual(expected)
    })
  })
})
