import { getConfigurationFromDataAttributes } from '@/standalone/lib/html-api'
import { describe, expect, it, vi } from 'vitest'

describe('html-api', () => {
  describe('identifier', () => {
    it('works with data-scalar-api-reference', async () => {
      const doc = createHtmlDocument(`
    <html>
      <body>
        <script data-scalar-api-reference data-url="/openapi.json"></script>
      </body>
    </html>
  `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        proxyUrl: undefined,
        spec: { url: '/openapi.json' },
      })
    })
  })

  it('handles spec content from script tag', () => {
    const doc = createHtmlDocument(`
      <html>
        <body>
          <script data-scalar-api-reference type="application/json">{"openapi":"3.1.0"}</script>
        </body>
      </html>
    `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
      _integration: 'html',
      proxyUrl: undefined,
      spec: { content: '{"openapi":"3.1.0"}' },
    })
  })

  describe('proxy', () => {
    it('handles proxy URL configuration', () => {
      const doc = createHtmlDocument(`
      <html>
        <body>
          <script data-scalar-api-reference data-proxy-url="https://proxy.example.com" data-url="/spec.json"></script>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        proxyUrl: 'https://proxy.example.com',
        spec: { url: '/spec.json' },
      })
    })
  })

  describe('configuration', () => {
    it('handles custom configuration via data-configuration attribute', () => {
      const doc = createHtmlDocument(`
      <html>
        <body>
          <script data-scalar-api-reference data-configuration='{"darkMode":true,"spec":{"url":"/custom.json"}}'></script>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        darkMode: true,
        proxyUrl: undefined,
        spec: { url: '/custom.json' },
      })
    })
  })

  describe('deprecated', () => {
    it('works with data-scalar-api-reference', async () => {
      const doc = createHtmlDocument(`
    <html>
      <body>
        <script data-scalar-api-reference data-url="/openapi.json"></script>
    </html>
  `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        proxyUrl: undefined,
        spec: { url: '/openapi.json' },
      })
    })

    it('handles deprecated data-spec attribute with warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const doc = createHtmlDocument(`
      <html>
        <body>
          <div data-spec='{"openapi":"3.1.0"}'></div>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        proxyUrl: undefined,
        spec: { content: '{"openapi":"3.1.0"}' },
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec] HTML API is deprecated'))
      consoleSpy.mockRestore()
    })

    it('handles deprecated data-spec-url attribute with warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const doc = createHtmlDocument(`
      <html>
        <body>
          <div data-spec-url="/deprecated.json"></div>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        proxyUrl: undefined,
        spec: { url: '/deprecated.json' },
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec-url] HTML API is deprecated'))
      consoleSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    it('handles missing spec elements with error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const doc = createHtmlDocument(`
      <html>
        <body>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({})
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not find a <script data-scalar-api-reference /> element. Try adding it like this: %c<div data-spec-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml" />',
        'font-family: monospace;',
      )
      consoleSpy.mockRestore()
    })

    it('prioritizes configuration spec URL over data-url attribute', () => {
      const doc = createHtmlDocument(`
      <html>
        <body>
          <script
            data-scalar-api-reference
            data-url="/spec.json"
            data-configuration='{"spec":{"url":"/priority.json"}}'>
          </script>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
        _integration: 'html',
        proxyUrl: undefined,
        spec: { url: '/priority.json' },
      })
    })
  })

  describe('multiple documents', () => {
    it('handles multiple documents', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <script data-scalar-api-reference data-url="/openapi-1.json"></script>
            <script data-scalar-api-reference data-url="/openapi-2.json"></script>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual([
        {
          _integration: 'html',
          proxyUrl: undefined,
          spec: { url: '/openapi-1.json' },
        },
        {
          _integration: 'html',
          proxyUrl: undefined,
          spec: { url: '/openapi-2.json' },
        },
      ])
    })

    it('handles multiple documents with data-configuration', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <script data-scalar-api-reference data-url="/openapi-1.json" data-configuration='{"darkMode":true}'></script>
            <script data-scalar-api-reference data-url="/openapi-2.json" data-configuration='{"darkMode":false}'></script>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual([
        {
          _integration: 'html',
          darkMode: true,
          proxyUrl: undefined,
          spec: { url: '/openapi-1.json' },
        },
        {
          _integration: 'html',
          darkMode: false,
          proxyUrl: undefined,
          spec: { url: '/openapi-2.json' },
        },
      ])
    })

    it('handles multiple documents with mixed spec sources', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <script data-scalar-api-reference data-url="/openapi-1.json"></script>
            <script data-scalar-api-reference type="application/json">{"openapi":"3.1.0"}</script>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual([
        {
          _integration: 'html',
          proxyUrl: undefined,
          spec: { url: '/openapi-1.json' },
        },
        {
          _integration: 'html',
          proxyUrl: undefined,
          spec: { content: '{"openapi":"3.1.0"}' },
        },
      ])
    })

    it('handles multiple documents with proxy configuration', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <script data-scalar-api-reference data-url="/spec-1.json" data-proxy-url="https://proxy1.example.com"></script>
            <script data-scalar-api-reference data-url="/spec-2.json" data-proxy-url="https://proxy2.example.com"></script>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual([
        {
          _integration: 'html',
          proxyUrl: 'https://proxy1.example.com',
          spec: { url: '/spec-1.json' },
        },
        {
          _integration: 'html',
          proxyUrl: 'https://proxy2.example.com',
          spec: { url: '/spec-2.json' },
        },
      ])
    })

    it('handles multiple documents with complex configurations', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <script
              data-scalar-api-reference
              data-url="/spec-1.json"
              data-proxy-url="https://proxy.example.com"
              data-configuration='{"darkMode":true,"layout":"stacked"}'
            ></script>
            <script
              data-scalar-api-reference
              type="application/json"
              data-configuration='{"darkMode":false,"layout":"sidebar"}'
            >{"openapi":"3.1.0"}</script>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual([
        {
          _integration: 'html',
          darkMode: true,
          layout: 'stacked',
          proxyUrl: 'https://proxy.example.com',
          spec: { url: '/spec-1.json' },
        },
        {
          _integration: 'html',
          darkMode: false,
          layout: 'sidebar',
          proxyUrl: undefined,
          spec: { content: '{"openapi":"3.1.0"}' },
        },
      ])
    })

    it('handles multiple documents with deprecated attributes', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div data-spec-url="/deprecated-1.json"></div>
            <div data-spec='{"openapi":"3.1.0"}'></div>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(doc)).toStrictEqual([
        {
          _integration: 'html',
          proxyUrl: undefined,
          spec: { url: '/deprecated-1.json' },
        },
        {
          _integration: 'html',
          proxyUrl: undefined,
          spec: { content: '{"openapi":"3.1.0"}' },
        },
      ])

      expect(consoleSpy).toHaveBeenCalledTimes(2)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec-url] HTML API is deprecated'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec] HTML API is deprecated'))
      consoleSpy.mockRestore()
    })
  })
})

/** Utility to create a new HTML document from a string */
function createHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}
