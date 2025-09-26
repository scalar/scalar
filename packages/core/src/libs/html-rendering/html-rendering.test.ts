import {
  type ApiReferenceConfiguration,
  apiReferenceConfigurationSchema,
  htmlRenderingConfigurationSchema,
} from '@scalar/types/api-reference'
import { describe, expect, it } from 'vitest'

import { getConfiguration, getHtmlDocument, getScriptTags } from './html-rendering'

describe('html-rendering', () => {
  describe('getHtmlDocument', () => {
    it('returns HTML document with default CDN and custom theme', () => {
      const html = getHtmlDocument({ customCss: 'body { color: red }' })
      expect(html).toContain('<!doctype html>')
      expect(html).toContain('<title>Scalar API Reference</title>')
      expect(html).toContain('body { color: red }')
      expect(html).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
      expect(html).toContain('<div id="app"></div>')
      expect(html).toContain("Scalar.createApiReference('#app'")
    })

    it('handles custom page title correctly', () => {
      const html = getHtmlDocument({ pageTitle: 'Custom API Doc' })
      expect(html).toContain('<title>Custom API Doc</title>')
    })

    it('includes both custom CSS and custom theme when provided', () => {
      const customCss = 'body { color: blue; }'
      const customTheme = `body {
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
      }
      .api-reference {
        padding: 20px;
        border-radius: 8px;
      }`
        .replace(/\s+/g, ' ')
        .trim()
      const html = getHtmlDocument({ customCss }, customTheme)
      expect(html).toContain(customCss)
      expect(html).toContain(customTheme.replace(/\s+/g, ' ').trim())
      expect(html).toContain('<style type="text/css">')
    })

    it('includes only custom CSS when provided alone', () => {
      const customCss = 'body { color: blue; }'
      const html = getHtmlDocument({ customCss })
      expect(html).toContain(customCss)
      expect(html).toContain('<style type="text/css">')
    })

    it('includes only custom theme when provided alone', () => {
      const customTheme = `body {
          background-color: #f0f0f0;
          font-family: Arial, sans-serif;
        }`
        .replace(/\s+/g, ' ')
        .trim()
      const html = getHtmlDocument({}, customTheme)
      expect(html).toContain(customTheme)
      expect(html).toContain('<style type="text/css">')
    })

    it('excludes custom theme when theme property is set', () => {
      const customCss = 'body { color: blue; }'
      const customTheme = `body {
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
      }`
        .replace(/\s+/g, ' ')
        .trim()
      const html = getHtmlDocument({ theme: 'kepler', customCss }, customTheme)
      expect(html).toContain('<style type="text/css">')
      expect(html).toContain(customCss)
      expect(html).not.toContain(customTheme.replace(/\s+/g, ' ').trim())
    })

    it('handles configuration with theme property', () => {
      const html = getHtmlDocument({ theme: 'kepler' })
      expect(html).not.toContain('<style type="text/css">')
    })

    it('handles empty configuration', () => {
      const html = getHtmlDocument({})
      expect(html).toContain('<!doctype html>')
      expect(html).toContain('<title>Scalar API Reference</title>')
    })

    it('removes content when url is provided', () => {
      const html = getHtmlDocument({
        url: 'https://api.example.com/spec',
        content: { foo: 'bar' },
      })
      expect(html).toContain('"url": "https://api.example.com/spec"')
      expect(html).not.toContain('"content"')
    })
  })

  describe('getScriptTags', () => {
    it('returns script tags with default CDN', () => {
      const tags = getScriptTags(
        apiReferenceConfigurationSchema.parse({}),
        'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
      )
      expect(tags).toContain('<!-- Load the Script -->')
      expect(tags).toContain('<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>')
      expect(tags).toContain("Scalar.createApiReference('#app'")
    })

    it('uses custom CDN when provided', () => {
      const tags = getScriptTags(apiReferenceConfigurationSchema.parse({}), 'https://example.com/script.js')
      expect(tags).toContain('https://example.com/script.js')
    })

    it('preserves function properties in configuration', () => {
      const config = {
        tagsSorter: (a, b) => a.name.localeCompare(b.name),
        operationsSorter: (a, b) => a.path.localeCompare(b.path),
        generateHeadingSlug: (heading) => `heading-${heading.slug}`,
        generateModelSlug: (model) => `model-${model.name}`,
        generateTagSlug: (tag) => `tag-${tag.name}`,
        generateOperationSlug: (operation) => `${operation.method}-${operation.path}`,
        generateWebhookSlug: (webhook) => `webhook-${webhook.name}`,
        onLoaded: () => console.log('loaded'),
        redirect: (path) => path.replace('/old', '/new'),
        onSpecUpdate: (spec) => console.log('spec updated', spec),
        onServerChange: (server) => console.log('server changed', server),
        onDocumentSelect: () => console.log('document changed'),
        onBeforeRequest: ({ request }) => console.log('before request', request),
        onShowMore: (tagId) => console.log('show more', tagId),
        onSidebarClick: (href) => console.log('sidebar click', href),
        onRequestSent: (request) => console.log('request sent', request),
      } satisfies Partial<ApiReferenceConfiguration>

      const tags = getScriptTags(config, 'https://example.com/script.js')

      // Check that all function properties are preserved
      expect(tags).toContain('"tagsSorter": (a, b) => a.name.localeCompare(b.name)')
      expect(tags).toContain('"operationsSorter": (a, b) => a.path.localeCompare(b.path)')
      expect(tags).toContain('"generateHeadingSlug": (heading) => `heading-${heading.slug}`')
      expect(tags).toContain('"generateModelSlug": (model) => `model-${model.name}`')
      expect(tags).toContain('"generateTagSlug": (tag) => `tag-${tag.name}`')
      expect(tags).toContain('"generateOperationSlug": (operation) => `${operation.method}-${operation.path}`')
      expect(tags).toContain('"generateWebhookSlug": (webhook) => `webhook-${webhook.name}`')
      expect(tags).toContain('"onLoaded": () => console.log("loaded")')
      expect(tags).toContain('"redirect": (path) => path.replace("/old", "/new")')
      expect(tags).toContain('"onSpecUpdate": (spec) => console.log("spec updated", spec)')
      expect(tags).toContain('"onServerChange": (server) => console.log("server changed", server)')
      expect(tags).toContain('"onDocumentSelect": () => console.log("document changed")')
      expect(tags).toContain('"onBeforeRequest": ({ request }) => console.log("before request", request)')
      expect(tags).toContain('"onShowMore": (tagId) => console.log("show more", tagId)')
      expect(tags).toContain('"onSidebarClick": (href) => console.log("sidebar click", href)')
      expect(tags).toContain('"onRequestSent": (request) => console.log("request sent", request)')
    })

    it('handle configuration properties that accept both string and function types', () => {
      const config = {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'method' as const,
      }

      const tags = getScriptTags(config, 'https://example.com/script.js')
      expect(tags).toContain('"tagsSorter": "alpha"')
      expect(tags).toContain('"operationsSorter": "method"')
    })

    it('generates complete HTML document with configuration', () => {
      const config = {
        theme: 'kepler' as const,
        tagsSorter: (a: any, b: any) => a.name.localeCompare(b.name),
        onLoaded: () => {
          console.log('loaded')
        },
        pageTitle: 'Foobar',
        customCss: '.sidebar { background: blue }',
        favicon: '/favicon.ico',
        cdn: 'https://example.com/script.js',
      }

      const html = getHtmlDocument(getConfiguration(config))

      // Check that HTML structure is correct
      expect(html).toContain('<!doctype html>')
      expect(html).toContain('<html>')
      expect(html).toContain('</html>')

      // Check that head contains required elements
      expect(html).toContain('<title>Foobar</title>')
      expect(html).toContain('.sidebar { background: blue }')

      // Check that body contains required elements
      expect(html).toContain('<div id="app"></div>')
      expect(html).toContain('<script src="https://example.com/script.js"></script>')

      // Check that configuration is properly embedded
      expect(html).toContain('"theme": "kepler"')
      expect(html).toContain('"tagsSorter": (a, b) => a.name.localeCompare(b.name)')
      expect(html).toContain(`"onLoaded": () => {
          console.log("loaded");
        }`)
    })

    it('handles mixed function and non-function properties', () => {
      const config = {
        theme: 'kepler' as const,
        tagsSorter: (a: any, b: any) => a.name.localeCompare(b.name),
        onLoaded: () => console.log('loaded'),
      }

      const tags = getScriptTags(config, 'https://example.com/script.js')

      // Check that non-function properties are JSON stringified
      expect(tags).toContain('"theme": "kepler"')
      // Check that function properties are preserved
      expect(tags).toContain('"tagsSorter": (a, b) => a.name.localeCompare(b.name)')
      expect(tags).toContain('"onLoaded": () => console.log("loaded")')
    })

    it('preserves plugins array containing functions', () => {
      const mockPlugin = () => ({
        name: 'test-plugin',
        extensions: [
          {
            name: 'x-custom-extension',
            component: 'MockComponent',
          },
        ],
      })

      const config = {
        theme: 'kepler' as const,
        plugins: [mockPlugin],
      }

      const tags = getScriptTags(config, 'https://example.com/script.js')

      // Check that plugins array is preserved with function
      expect(tags).toContain('"plugins": [() => ({')
      expect(tags).toContain('name: "test-plugin"')
      expect(tags).toContain('extensions: [')
      expect(tags).toContain('name: "x-custom-extension"')
      expect(tags).toContain('component: "MockComponent"')
    })
  })

  describe('getConfiguration', () => {
    it('returns configuration object', () => {
      const config = getConfiguration({ theme: 'kepler' } as ApiReferenceConfiguration)
      expect(config).toEqual({ theme: 'kepler' })
    })

    it('does not remove content when url is not provided', () => {
      const content = { foo: 'bar' }
      const config = getConfiguration(apiReferenceConfigurationSchema.parse({ content }))
      expect(config).toMatchObject({ content })
    })

    it('removes content only when url is provided', () => {
      const config = getConfiguration(
        apiReferenceConfigurationSchema.parse({
          url: 'https://api.example.com/spec',
          content: { foo: 'bar' },
        }),
      )
      expect(config).toMatchObject({ url: 'https://api.example.com/spec' })
      expect(config).not.toHaveProperty('content')
    })

    it('executes content when it is a function', () => {
      const contentFn = () => ({ foo: 'bar' })
      const config = getConfiguration(apiReferenceConfigurationSchema.parse({ content: contentFn }))
      expect(config).toMatchObject({ content: { foo: 'bar' } })
    })
  })

  describe('getCdnUrl', () => {
    it('returns default CDN URL when not provided', () => {
      const { cdn } = htmlRenderingConfigurationSchema.parse({})
      expect(cdn).toBe('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })

    it('returns custom CDN URL when provided', () => {
      const { cdn } = htmlRenderingConfigurationSchema.parse({ cdn: 'https://example.com/script.js' })
      expect(cdn).toBe('https://example.com/script.js')
    })
  })

  describe('getPageTitle', () => {
    it('returns default page title when not provided', () => {
      const { pageTitle } = htmlRenderingConfigurationSchema.parse({})
      expect(pageTitle).toBe('Scalar API Reference')
    })

    it('returns custom page title when provided', () => {
      const { pageTitle } = htmlRenderingConfigurationSchema.parse({ pageTitle: 'Custom Title' })
      expect(pageTitle).toBe('Custom Title')
    })
  })
})
