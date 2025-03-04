import { describe, expect, it } from 'vitest'
import {
  getConfiguration,
  getHtmlDocument,
  getScriptTagContent,
  getScriptTags,
  htmlRenderingOptionsSchema,
} from './html-rendering'
import { apiReferenceConfigurationSchema, type ApiReferenceConfiguration } from '@scalar/types/api-reference'

describe('html-rendering', () => {
  describe('getHtmlDocument', () => {
    it('returns HTML document with default CDN and custom theme', () => {
      const html = getHtmlDocument({ customCss: 'body { color: red }' })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>Scalar API Reference</title>')
      expect(html).toContain('body { color: red }')
      expect(html).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })
  })

  describe('getScriptTags', () => {
    it('returns script tags with default CDN', () => {
      const tags = getScriptTags(
        apiReferenceConfigurationSchema.parse({}),
        'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
      )
      expect(tags).toContain('id="api-reference"')
      expect(tags).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })

    it('uses custom CDN when provided', () => {
      const tags = getScriptTags(apiReferenceConfigurationSchema.parse({}), 'https://custom.cdn/script.js')
      expect(tags).toContain('https://custom.cdn/script.js')
    })
  })

  describe('getConfiguration', () => {
    it('stringifies configuration and escapes quotes', () => {
      const config = getConfiguration({ theme: 'kepler' } as ApiReferenceConfiguration)
      expect(config).toBe('{&quot;theme&quot;:&quot;kepler&quot;}')
    })

    it('removes spec when url is not provided', () => {
      const config = getConfiguration(apiReferenceConfigurationSchema.parse({ spec: { content: { foo: 'bar' } } }))
      expect(config).not.toContain('spec')
    })

    it('removes spec.content when url is provided', () => {
      const config = getConfiguration(
        apiReferenceConfigurationSchema.parse({
          spec: {
            url: 'https://api.example.com/spec',
            content: { foo: 'bar' },
          },
        }),
      )
      expect(config).toContain('url')
      expect(config).not.toContain('content')
    })
  })

  describe('getScriptTagContent', () => {
    it('returns empty string when no spec content', () => {
      const content = getScriptTagContent(apiReferenceConfigurationSchema.parse({}))
      expect(content).toBe('')
    })

    it('stringifies spec content object', () => {
      const content = getScriptTagContent(
        apiReferenceConfigurationSchema.parse({
          spec: { content: { foo: 'bar' } },
        }),
      )
      expect(content).toBe('{"foo":"bar"}')
    })

    it('executes and stringifies content function', () => {
      const content = getScriptTagContent(
        apiReferenceConfigurationSchema.parse({
          spec: { content: () => ({ foo: 'bar' }) },
        }),
      )
      expect(content).toBe('{"foo":"bar"}')
    })
  })

  describe('getCdnUrl', () => {
    it('returns default CDN URL when not provided', () => {
      const { cdn } = htmlRenderingOptionsSchema.parse({})
      expect(cdn).toBe('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })

    it('returns custom CDN URL when provided', () => {
      const { cdn } = htmlRenderingOptionsSchema.parse({ cdn: 'https://custom.cdn/script.js' })
      expect(cdn).toBe('https://custom.cdn/script.js')
    })
  })

  describe('getPageTitle', () => {
    it('returns default page title when not provided', () => {
      const { pageTitle } = htmlRenderingOptionsSchema.parse({})
      expect(pageTitle).toBe('Scalar API Reference')
    })

    it('returns custom page title when provided', () => {
      const { pageTitle } = htmlRenderingOptionsSchema.parse({ pageTitle: 'Custom Title' })
      expect(pageTitle).toBe('Custom Title')
    })
  })
})
