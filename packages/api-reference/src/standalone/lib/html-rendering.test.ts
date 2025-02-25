import { describe, expect, it } from 'vitest'
import {
  getCdnUrl,
  getConfiguration,
  getHtmlDocument,
  getPageTitle,
  getScriptTagContent,
  getScriptTags,
} from './html-rendering'

describe('html-rendering', () => {
  describe('getHtmlDocument', () => {
    it('returns HTML document with default CDN and custom theme', () => {
      const html = getHtmlDocument({}, 'body { color: red }')
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>Scalar API Reference</title>')
      expect(html).toContain('body { color: red }')
      expect(html).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })

    it('excludes custom theme when theme is provided in config', () => {
      // @ts-expect-error - theme is not provided
      const html = getHtmlDocument({ theme: 'dark' }, 'body { color: red }')
      expect(html).not.toContain('body { color: red }')
    })
  })

  describe('getScriptTags', () => {
    it('returns script tags with default CDN', () => {
      const tags = getScriptTags({})
      expect(tags).toContain('id="api-reference"')
      expect(tags).toContain('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })

    it('uses custom CDN when provided', () => {
      const tags = getScriptTags({ cdn: 'https://custom.cdn/script.js' })
      expect(tags).toContain('https://custom.cdn/script.js')
    })
  })

  describe('getConfiguration', () => {
    it('stringifies configuration and escapes quotes', () => {
      const config = getConfiguration({ theme: 'dark' })
      expect(config).toBe('{&quot;theme&quot;:&quot;dark&quot;}')
    })

    it('removes spec when url is not provided', () => {
      const config = getConfiguration({ spec: { content: { foo: 'bar' } } })
      expect(config).not.toContain('spec')
    })

    it('removes spec.content when url is provided', () => {
      const config = getConfiguration({
        spec: {
          url: 'https://api.example.com/spec',
          content: { foo: 'bar' },
        },
      })
      expect(config).toContain('url')
      expect(config).not.toContain('content')
    })
  })

  describe('getScriptTagContent', () => {
    it('returns empty string when no spec content', () => {
      const content = getScriptTagContent({})
      expect(content).toBe('')
    })

    it('stringifies spec content object', () => {
      const content = getScriptTagContent({
        spec: { content: { foo: 'bar' } },
      })
      expect(content).toBe('{"foo":"bar"}')
    })

    it('executes and stringifies content function', () => {
      const content = getScriptTagContent({
        spec: { content: () => ({ foo: 'bar' }) },
      })
      expect(content).toBe('{"foo":"bar"}')
    })
  })

  describe('getCdnUrl', () => {
    it('returns default CDN URL when not provided', () => {
      const url = getCdnUrl({})
      expect(url).toBe('https://cdn.jsdelivr.net/npm/@scalar/api-reference')
    })

    it('returns custom CDN URL when provided', () => {
      const url = getCdnUrl({ cdn: 'https://custom.cdn/script.js' })
      expect(url).toBe('https://custom.cdn/script.js')
    })
  })

  describe('getPageTitle', () => {
    it('returns default page title when not provided', () => {
      const title = getPageTitle({})
      expect(title).toBe('Scalar API Reference')
    })

    it('returns custom page title when provided', () => {
      const title = getPageTitle({ pageTitle: 'Custom Title' })
      expect(title).toBe('Custom Title')
    })
  })
})
