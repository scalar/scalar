import { describe, expect, it } from 'vitest'
import { authenticationConfigurationSchema } from './authentication-configuration.ts'

describe('authenticationConfigurationSchema', () => {
  it('accepts empty record', () => {
    const config = {}
    expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
  })

  it('accepts partial security schemes', () => {
    const validConfig = {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'api_key',
          in: 'header',
        },
        basic: {
          type: 'http',
          scheme: 'basic',
        },
      },
    }

    expect(authenticationConfigurationSchema.parse(validConfig)).toEqual(validConfig)
  })

  it('rejects invalid security schemes', () => {
    const invalidConfig = {
      securitySchemes: {
        apiKey: {
          type: 'invalid', // Invalid type
          name: 123, // Invalid type for name
        },
      },
    }

    expect(() => authenticationConfigurationSchema.parse(invalidConfig)).toThrow()
  })

  describe('preferredSecurityScheme', () => {
    it('accepts a single string security scheme', () => {
      const config = {
        preferredSecurityScheme: 'apiKey',
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts an array of security schemes', () => {
      const config = {
        preferredSecurityScheme: ['apiKey', 'basic'],
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts complex security with array of arrays', () => {
      const config = {
        preferredSecurityScheme: ['apiKey', ['basic', 'oauth2']],
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts null value', () => {
      const config = {
        preferredSecurityScheme: null,
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts undefined value', () => {
      const config = {}
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('rejects invalid types', () => {
      const invalidConfigs = [
        { preferredSecurityScheme: 123 },
        { preferredSecurityScheme: {} },
        { preferredSecurityScheme: [{}] },
        { preferredSecurityScheme: [123] },
        { preferredSecurityScheme: [[123]] },
      ]

      invalidConfigs.forEach((config) => {
        expect(() => authenticationConfigurationSchema.parse(config)).toThrow()
      })
    })
  })

  describe('oauth2 security scheme', () => {
    it('accepts oauth2 configuration with different flows', () => {
      const validConfig = {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            description: 'OAuth2 Authentication',
            flows: {
              implicit: {
                type: 'implicit',
                scopes: {
                  'read:items': 'Read access to items',
                  'write:items': 'Write access to items',
                },
                selectedScopes: ['read:items'],
                'x-scalar-redirect-uri': 'http://localhost:3000',
              },
              authorizationCode: {
                type: 'authorizationCode',
                scopes: {
                  'full_access': 'Full API access',
                },
              },
            },
          },
        },
      }

      expect(authenticationConfigurationSchema.parse(validConfig)).toEqual(validConfig)
    })

    it('rejects invalid oauth2 flow configuration', () => {
      const invalidConfig = {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                type: 'implidfcit',
              },
            },
          },
        },
      }

      expect(() => authenticationConfigurationSchema.parse(invalidConfig)).toThrow()
    })
  })

  describe('security scheme combinations', () => {
    it('accepts multiple security schemes with different configurations', () => {
      const config = {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'API Key Authentication',
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          oauth2: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                type: 'clientCredentials',
                tokenUrl: 'https://api.example.com/oauth/token',
                scopes: {
                  'read:api': 'Read access',
                  'write:api': 'Write access',
                },
              },
            },
          },
        },
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts security schemes with optional fields', () => {
      const config = {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'api_key',
            in: 'header',
            description: undefined,
          },
        },
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })
  })

  describe('preferredSecurityScheme combinations', () => {
    it('accepts deeply nested security requirements', () => {
      const config = {
        preferredSecurityScheme: ['apiKey', ['basic', 'oauth2'], ['apiKey', 'bearerAuth', 'oauth2']],
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('rejects empty arrays in security requirements', () => {
      const config = {
        preferredSecurityScheme: [],
      }
      expect(() => authenticationConfigurationSchema.parse(config)).toThrow()
    })

    it('rejects empty nested arrays in security requirements', () => {
      const config = {
        preferredSecurityScheme: ['apiKey', []],
      }
      expect(() => authenticationConfigurationSchema.parse(config)).toThrow()
    })
  })

  describe('oauth2 security scheme extended', () => {
    it('accepts oauth2 with all supported flow types', () => {
      const config = {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            description: 'OAuth2 Authentication',
            flows: {
              implicit: {
                type: 'implicit',
                authorizationUrl: 'https://auth.example.com/oauth/authorize',
                scopes: {
                  'read:user': 'Read user data',
                },
                selectedScopes: ['read:user'],
                'x-scalar-redirect-uri': 'http://localhost:3000',
              },
              authorizationCode: {
                type: 'authorizationCode',
                authorizationUrl: 'https://auth.example.com/oauth/authorize',
                tokenUrl: 'https://auth.example.com/oauth/token',
                scopes: {
                  'full_access': 'Full API access',
                },
              },
              clientCredentials: {
                type: 'clientCredentials',
                tokenUrl: 'https://auth.example.com/oauth/token',
                scopes: {
                  'service_access': 'Service account access',
                },
              },
              password: {
                type: 'password',
                tokenUrl: 'https://auth.example.com/oauth/token',
                scopes: {
                  'user_access': 'User level access',
                },
              },
            },
          },
        },
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('validates required URLs for each oauth2 flow type', () => {
      const partialConfig = {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                type: 'implicit',
              },
              authorizationCode: {
                type: 'authorizationCode',
                authorizationUrl: 'https://example.com',
                scopes: '',
              },
            },
          },
        },
      }

      expect(authenticationConfigurationSchema.parse(partialConfig)).toEqual({
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                type: 'implicit',
              },
              authorizationCode: {
                type: 'authorizationCode',
                authorizationUrl: 'https://example.com',
                scopes: {},
              },
            },
          },
        },
      })
    })
  })

  describe('custom extensions', () => {
    it('accepts custom x- scalar extensions', () => {
      const config = {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                type: 'implicit',
                'x-scalar-redirect-uri': 'http://localhost:3000',
                'x-scalar-client-id': '123',
              },
            },
          },
        },
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })
  })
})
