import { describe, expect, it } from 'vitest'
import { authenticationStateSchema, apiReferenceConfigurationSchema } from './api-reference-configuration.ts'

describe('authenticationStateSchema', () => {
  describe('preferredSecurityScheme', () => {
    it('accepts a string value', () => {
      const input = {
        preferredSecurityScheme: 'apiKey',
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        preferredSecurityScheme: 'apiKey',
      })
    })

    it('accepts an array of strings', () => {
      const input = {
        preferredSecurityScheme: ['apiKey', 'oauth2'],
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        preferredSecurityScheme: ['apiKey', 'oauth2'],
      })
    })

    it('accepts an array with nested arrays', () => {
      const input = {
        preferredSecurityScheme: ['apiKey', ['oauth2', 'basic']],
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        preferredSecurityScheme: ['apiKey', ['oauth2', 'basic']],
      })
    })

    it('accepts null', () => {
      const input = {
        preferredSecurityScheme: null,
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        preferredSecurityScheme: null,
      })
    })

    it('rejects a number', () => {
      const input = {
        preferredSecurityScheme: 123,
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('http authentication', () => {
    it('accepts basic auth with username and password', () => {
      const input = {
        http: {
          basic: {
            username: 'user',
            password: 'pass',
          },
        },
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        http: {
          basic: {
            username: 'user',
            password: 'pass',
          },
        },
      })
    })

    it('accepts basic auth with only username', () => {
      const input = {
        http: {
          basic: {
            username: 'user',
          },
        },
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        http: {
          basic: {
            username: 'user',
          },
        },
      })
    })

    it('accepts bearer auth with token', () => {
      const input = {
        http: {
          bearer: {
            token: 'my-token',
          },
        },
      }
      const result = authenticationStateSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        http: {
          bearer: {
            token: 'my-token',
          },
        },
      })
    })

    it('does not reject bearer auth without token', () => {
      const input = {
        http: {
          bearer: {},
        },
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('accepts http as undefined', () => {
      const input = {}
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      expect(result.data?.http).toBeUndefined()
    })
  })

  describe('apiKey authentication', () => {
    it('accepts apiKey with token', () => {
      const input = {
        apiKey: {
          token: 'my-api-key',
        },
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      expect(result.data?.apiKey?.token).toBe('my-api-key')
    })

    it('does not reject apiKey without token', () => {
      const input = {
        apiKey: {},
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('accepts apiKey as undefined', () => {
      const input = {}
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      expect(result.data?.apiKey).toBeUndefined()
    })
  })

  describe('oAuth2 authentication', () => {
    it('accepts oAuth2 with all fields', () => {
      const input = {
        oAuth2: {
          clientId: 'client-123',
          scopes: ['read', 'write'],
          accessToken: 'token-123',
          state: 'state-123',
          username: 'user',
          password: 'pass',
        },
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.oAuth2?.clientId).toBe('client-123')
        expect(result.data.oAuth2?.scopes).toEqual(['read', 'write'])
        expect(result.data.oAuth2?.accessToken).toBe('token-123')
        expect(result.data.oAuth2?.state).toBe('state-123')
        expect(result.data.oAuth2?.username).toBe('user')
        expect(result.data.oAuth2?.password).toBe('pass')
      }
    })

    it('accepts oAuth2 with only clientId', () => {
      const input = {
        oAuth2: {
          clientId: 'client-123',
        },
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.oAuth2?.clientId).toBe('client-123')
        expect(result.data.oAuth2?.scopes).toBeUndefined()
      }
    })

    it('accepts oAuth2 with only scopes', () => {
      const input = {
        oAuth2: {
          scopes: ['read', 'write'],
        },
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.oAuth2?.clientId).toBeUndefined()
        expect(result.data.oAuth2?.scopes).toEqual(['read', 'write'])
      }
    })

    it('accepts oAuth2 as undefined', () => {
      const input = {}
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.oAuth2).toBeUndefined()
      }
    })
  })

  describe('complete authentication state', () => {
    it('accepts a complete authentication state with all fields', () => {
      const input = {
        preferredSecurityScheme: 'oauth2',
        http: {
          basic: {
            username: 'user',
            password: 'pass',
          },
          bearer: {
            token: 'bearer-token',
          },
        },
        apiKey: {
          token: 'api-key-token',
        },
        oAuth2: {
          clientId: 'client-123',
          scopes: ['read', 'write'],
          accessToken: 'access-token',
          state: 'state-value',
          username: 'oauth-user',
          password: 'oauth-pass',
        },
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.preferredSecurityScheme).toBe('oauth2')
        expect(result.data.http?.basic?.username).toBe('user')
        expect(result.data.http?.bearer?.token).toBe('bearer-token')
        expect(result.data.apiKey?.token).toBe('api-key-token')
        expect(result.data.oAuth2?.clientId).toBe('client-123')
        expect(result.data.oAuth2?.scopes).toEqual(['read', 'write'])
      }
    })

    it('accepts a minimal authentication state with only preferredSecurityScheme', () => {
      const input = {
        preferredSecurityScheme: null,
      }
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.preferredSecurityScheme).toBeNull()
        expect(result.data.http).toBeUndefined()
        expect(result.data.apiKey).toBeUndefined()
        expect(result.data.oAuth2).toBeUndefined()
      }
    })

    it('does not reject an empty object', () => {
      const input = {}
      const result = authenticationStateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })
})

describe('api-reference-configuration', () => {
  describe('schema', () => {
    it('validates a minimal configuration', () => {
      const minimalConfig = {}
      expect(() => apiReferenceConfigurationSchema.parse(minimalConfig)).not.toThrow()
    })

    it('validates a complete configuration', () => {
      const completeConfig = {
        theme: 'default',
        layout: 'modern',
        spec: {
          url: 'https://example.com/openapi.json',
          content: '{"openapi": "3.1.0"}',
        },
        proxyUrl: 'https://proxy.example.com',
        isEditable: true,
        showSidebar: true,
        hideModels: false,
        hideDownloadButton: false,
        hideTestRequestButton: false,
        hideSearch: false,
        darkMode: true,
        forceDarkModeState: 'dark',
        hideDarkModeToggle: false,
        searchHotKey: 'k',
        favicon: '/favicon.ico',
        hiddenClients: ['fetch', 'xhr'],
        defaultHttpClient: {
          targetKey: 'target1',
          clientKey: 'client1',
        },
        customCss: '.custom { color: red; }',
        pathRouting: {
          basePath: '/api',
        },
        baseServerURL: 'https://api.example.com',
        withDefaultFonts: true,
        defaultOpenAllTags: false,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        _integration: 'nextjs',
        hideClientButton: false,
      }

      expect(() => apiReferenceConfigurationSchema.parse(completeConfig)).not.toThrow()
    })

    it('validates theme enum values', () => {
      const config = { theme: 'invalid-theme' }

      expect(apiReferenceConfigurationSchema.parse(config)).toMatchObject({ theme: 'default' })

      const validThemes = [
        'alternate',
        'default',
        'moon',
        'purple',
        'solarized',
        'bluePlanet',
        'deepSpace',
        'saturn',
        'kepler',
        'elysiajs',
        'fastify',
        'mars',
        'none',
      ]

      validThemes.forEach((theme) => {
        expect(apiReferenceConfigurationSchema.parse({ theme })).toMatchObject({ theme })
      })
    })

    it('validates layout enum values', () => {
      const config = { layout: 'invalid-layout' }
      expect(apiReferenceConfigurationSchema.parse(config)).toMatchObject({ layout: 'modern' })

      const validLayouts = ['modern', 'classic']
      validLayouts.forEach((layout) => {
        expect(apiReferenceConfigurationSchema.parse({ layout })).toMatchObject({ layout })
      })
    })

    it('validates spec configuration', () => {
      const validConfigs = [
        { spec: { url: 'https://example.com/openapi.json' } },
        { spec: { content: '{"openapi": "3.1.0"}' } },
        { spec: { content: { openapi: '3.1.0' } } },
        { spec: { content: () => ({ openapi: '3.1.0' }) } },
        { spec: { content: null } },
      ]

      validConfigs.forEach((config) => {
        expect(() => apiReferenceConfigurationSchema.parse(config)).not.toThrow()
      })

      const invalidConfigs = [{ spec: { url: 'not-a-url' } }, { spec: { content: 123 } }]

      invalidConfigs.forEach((config) => {
        expect(() => apiReferenceConfigurationSchema.parse(config)).toThrow()
      })
    })

    it('validates function parameters', () => {
      const config = {
        generateHeadingSlug: (heading: any) => `#${heading.slug}`,
        generateModelSlug: (model: { name: string }) => `model-${model.name}`,
        generateTagSlug: (tag: any) => `tag-${tag.name}`,
        generateOperationSlug: (operation: { path: string; method: string }) => `${operation.method}-${operation.path}`,
        generateWebhookSlug: (webhook: { name: string }) => `webhook-${webhook.name}`,
        onLoaded: () => console.log('loaded'),
        onSpecUpdate: (spec: string) => console.log('spec updated', spec),
      }

      expect(() => apiReferenceConfigurationSchema.parse(config)).not.toThrow()
    })

    it('validates integration enum values', () => {
      const validIntegrations = [
        'adonisjs',
        'docusaurus',
        'dotnet',
        'elysiajs',
        'express',
        'fastapi',
        'fastify',
        'go',
        'hono',
        'html',
        'laravel',
        'litestar',
        'nestjs',
        'nextjs',
        'nitro',
        'nuxt',
        'platformatic',
        'react',
        'rust',
        'vue',
        null,
      ]

      validIntegrations.forEach((integration) => {
        expect(() => apiReferenceConfigurationSchema.parse({ _integration: integration })).not.toThrow()
      })

      expect(() => apiReferenceConfigurationSchema.parse({ _integration: 'invalid-integration' })).toThrow()
    })

    it('validates sorter configurations', () => {
      const validConfigs = [
        { tagsSorter: 'alpha' },
        { tagsSorter: (a: any, b: any) => a.name.localeCompare(b.name) },
        { operationsSorter: 'alpha' },
        { operationsSorter: 'method' },
        { operationsSorter: (a: any, b: any) => a.path.localeCompare(b.path) },
      ]

      validConfigs.forEach((config) => {
        expect(() => apiReferenceConfigurationSchema.parse(config)).not.toThrow()
      })

      const invalidConfigs = [{ tagsSorter: 'invalid' }, { operationsSorter: 'invalid' }]

      invalidConfigs.forEach((config) => {
        expect(() => apiReferenceConfigurationSchema.parse(config)).toThrow()
      })
    })
  })

  describe('migrations', () => {
    it('migrates proxy to proxyUrl', () => {
      const config = {
        proxy: 'https://proxy.example.com',
      }

      const migratedConfig = apiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.proxyUrl).toBe('https://proxy.example.com')
      expect(migratedConfig.proxy).toBeUndefined()
    })

    it('migrates legacy theme variables', () => {
      const config = {
        theme: 'default',
        customCss: '--theme-color-red: red;',
      }

      const migratedConfig = apiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.customCss).not.toContain('--theme-color-red')
      expect(migratedConfig.customCss).toContain('--scalar-color-red')
    })
  })
})
