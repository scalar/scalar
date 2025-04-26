import { describe, expect, it } from 'vitest'
import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from './api-reference-configuration.ts'

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
        url: 'https://example.com/openapi.json',
        content: '{"openapi": "3.1.0"}',
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

    it('validates hiddenClients true', () => {
      const config = { hiddenClients: true }

      expect(apiReferenceConfigurationSchema.parse(config)).toMatchObject({ hiddenClients: true })
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

    it('validates content and url configuration', () => {
      const validConfigs = [
        { url: 'https://example.com/openapi.json' },
        { content: '{"openapi": "3.1.0"}' },
        { content: { openapi: '3.1.0' } },
        { content: () => ({ openapi: '3.1.0' }) },
        { content: null },
      ]

      validConfigs.forEach((config) => {
        expect(() => apiReferenceConfigurationSchema.parse(config)).not.toThrow()
      })

      const invalidConfigs = [{ url: 999 }, { content: 123 }]

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
        'svelte',
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

    it('keeps proxyUrl if both proxy and proxyUrl are set', () => {
      const config = {
        proxy: 'https://proxy.example.com',
        proxyUrl: 'https://existing.example.com',
      }

      const migratedConfig = apiReferenceConfigurationSchema.parse(config)
      expect(migratedConfig.proxyUrl).toBe('https://existing.example.com')
      expect(migratedConfig.proxy).toBeUndefined()
    })

    it('migrates the old proxy URL to the new one', () => {
      const config = {
        proxyUrl: 'https://api.scalar.com/request-proxy',
      }

      const migratedConfig = apiReferenceConfigurationSchema.parse(config)
      expect(migratedConfig.proxyUrl).toBe('https://proxy.scalar.com')
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

    it('migrates spec.url to url', () => {
      const config = {
        spec: {
          url: 'https://example.com/openapi.json',
        },
      }

      const migratedConfig = apiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.spec).toBeUndefined()
      expect(migratedConfig.url).toBe('https://example.com/openapi.json')
    })

    it('migrates spec.content to content', () => {
      const config = {
        spec: {
          content: '{"openapi": "3.1.0"}',
        },
      }

      const migratedConfig = apiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.spec).toBeUndefined()
      expect(migratedConfig.content).toBe('{"openapi": "3.1.0"}')
    })

    it('allows a function as onDocumentSelect', () => {
      const config = {
        onDocumentSelect: () => console.log('selected'),
      }
      const migratedConfig = apiReferenceConfigurationSchema.parse(config)
      expect(migratedConfig.onDocumentSelect).toBeInstanceOf(Function)
    })

    it('allows a function as onDocumentSelect', () => {
      const config = {
        onDocumentSelect: () => console.log('selected'),
      } satisfies Partial<ApiReferenceConfiguration>
      const migratedConfig = apiReferenceConfigurationSchema.parse(config)
      expect(migratedConfig.onDocumentSelect).toBeInstanceOf(Function)
    })

    it('allows an async function as onDocumentSelect', async () => {
      const config = {
        onDocumentSelect: async () => console.log('selected'),
      } satisfies Partial<ApiReferenceConfiguration>
      const migratedConfig = apiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.onDocumentSelect?.()).toBeInstanceOf(Promise)
    })
  })
})
