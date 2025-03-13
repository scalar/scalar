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

    it('handles configuration with theme property', () => {
      const html = getHtmlDocument({ theme: 'kepler' })
      expect(html).not.toContain('<style>')
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
