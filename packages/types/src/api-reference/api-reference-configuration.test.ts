import { describe, expect, it } from 'vitest'
import { apiReferenceConfigurationSchema } from './api-reference-configuration.ts'

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

      expect(() => ApiReferenceConfigurationSchema.parse(completeConfig)).not.toThrow()
    })

    it('validates theme enum values', () => {
      const config = { theme: 'invalid-theme' }

      expect(ApiReferenceConfigurationSchema.parse(config)).toMatchObject({ theme: 'default' })

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
        expect(ApiReferenceConfigurationSchema.parse({ theme })).toMatchObject({ theme })
      })
    })

    it('validates layout enum values', () => {
      const config = { layout: 'invalid-layout' }
      expect(ApiReferenceConfigurationSchema.parse(config)).toMatchObject({ layout: 'modern' })

      const validLayouts = ['modern', 'classic']
      validLayouts.forEach((layout) => {
        expect(ApiReferenceConfigurationSchema.parse({ layout })).toMatchObject({ layout })
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
        expect(() => ApiReferenceConfigurationSchema.parse(config)).not.toThrow()
      })

      const invalidConfigs = [{ spec: { url: 'not-a-url' } }, { spec: { content: 123 } }]

      invalidConfigs.forEach((config) => {
        expect(() => ApiReferenceConfigurationSchema.parse(config)).toThrow()
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

      expect(() => ApiReferenceConfigurationSchema.parse(config)).not.toThrow()
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
        expect(() => ApiReferenceConfigurationSchema.parse({ _integration: integration })).not.toThrow()
      })

      expect(() => ApiReferenceConfigurationSchema.parse({ _integration: 'invalid-integration' })).toThrow()
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
        expect(() => ApiReferenceConfigurationSchema.parse(config)).not.toThrow()
      })

      const invalidConfigs = [{ tagsSorter: 'invalid' }, { operationsSorter: 'invalid' }]

      invalidConfigs.forEach((config) => {
        expect(() => ApiReferenceConfigurationSchema.parse(config)).toThrow()
      })
    })
  })

  describe('migrations', () => {
    it('migrates proxy to proxyUrl', () => {
      const config = {
        proxy: 'https://proxy.example.com',
      }

      const migratedConfig = ApiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.proxyUrl).toBe('https://proxy.example.com')
      expect(migratedConfig.proxy).toBeUndefined()
    })

    it('migrates legacy theme variables', () => {
      const config = {
        theme: 'default',
        customCss: '--theme-color-red: red;',
      }

      const migratedConfig = ApiReferenceConfigurationSchema.parse(config)

      expect(migratedConfig.customCss).not.toContain('--theme-color-red')
      expect(migratedConfig.customCss).toContain('--scalar-color-red')
    })
  })
})
