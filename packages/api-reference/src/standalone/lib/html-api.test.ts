import { getConfigurationFromDataAttributes } from '@/standalone/lib/html-api'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { describe, expect, it, vi } from 'vitest'

describe('html-api', () => {
  // Since we use zod now we have a base config
  const baseConfig = apiReferenceConfigurationSchema.parse({
    _integration: 'html',
  })

  it('mountScalarApiReference', async () => {
    const doc = createHtmlDocument(`
    <html>
      <body>
        <script id="api-reference" data-url="/openapi.json"></script>
      </body>
    </html>
  `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
      ...baseConfig,
      proxyUrl: undefined,
      spec: { url: '/openapi.json' },
    })
  })

  it('handles spec content from script tag', () => {
    const doc = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" type="application/json">{"openapi":"3.1.0"}</script>
        </body>
      </html>
    `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
      ...baseConfig,
      proxyUrl: undefined,
      spec: { content: '{"openapi":"3.1.0"}' },
    })
  })

  it('handles proxy URL configuration', () => {
    const doc = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" data-proxy-url="https://proxy.example.com" data-url="/spec.json"></script>
        </body>
      </html>
    `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
      ...baseConfig,
      proxyUrl: 'https://proxy.example.com',
      spec: { url: '/spec.json' },
    })
  })

  it('handles custom configuration via data-configuration attribute', () => {
    const doc = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" data-configuration='{"darkMode":true,"spec":{"url":"/custom.json"}}'></script>
        </body>
      </html>
    `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
      ...baseConfig,
      darkMode: true,
      proxyUrl: undefined,
      spec: { url: '/custom.json' },
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
      ...baseConfig,
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
      ...baseConfig,
      proxyUrl: undefined,
      spec: { url: '/deprecated.json' },
    })

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec-url] HTML API is deprecated'))
    consoleSpy.mockRestore()
  })

  it('handles missing spec elements with error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const doc = createHtmlDocument(`
      <html>
        <body>
        </body>
      </html>
    `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual(baseConfig)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Couldn’t find a [data-spec], [data-spec-url] or <script id="api-reference" /> element. Try adding it like this: %c<div data-spec-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml" />',
      'font-family: monospace;',
    )
    consoleSpy.mockRestore()
  })

  it('prioritizes configuration spec URL over data-url attribute', () => {
    const doc = createHtmlDocument(`
      <html>
        <body>
          <script
            id="api-reference"
            data-url="/spec.json"
            data-configuration='{"spec":{"url":"/priority.json"}}'>
          </script>
        </body>
      </html>
    `)

    expect(getConfigurationFromDataAttributes(doc)).toStrictEqual({
      ...baseConfig,
      proxyUrl: undefined,
      spec: { url: '/priority.json' },
    })
  })
})

/** Utility to create a new HTML document from a string */
function createHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}
