import {
  createApiReference,
  createContainer,
  findDataAttributes,
  getConfigurationFromDataAttributes,
} from '@/standalone/lib/html-api'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { describe, expect, it, vi } from 'vitest'

describe('html-api', () => {
  // Since we use zod now we have a base config
  const baseConfig = apiReferenceConfigurationSchema.parse({
    _integration: 'html',
  })

  describe('createContainer', () => {
    it('creates a container element', () => {
      const doc = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" data-url="/openapi.json"></script>
        </body>
      </html>
    `)

      expect(createContainer(doc)).toBeDefined()
    })
  })

  describe('createApiReference', () => {
    it('creates and mounts the API reference component', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const element = doc.querySelector('#mount-point')
      const config = { _integration: 'html' }

      const app = createApiReference(element!, apiReferenceConfigurationSchema.parse(config), doc)
      expect(app).toBeDefined()
    })

    it('handles string selectors for mounting', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const config = { _integration: 'html' }

      const app = createApiReference('#mount-point', apiReferenceConfigurationSchema.parse(config), doc)
      expect(app).toBeDefined()
    })

    it('handles scalar:reload-references event', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const element = doc.querySelector('#mount-point')
      const config = { _integration: 'html' }

      createApiReference(element!, apiReferenceConfigurationSchema.parse(config), doc)

      doc.dispatchEvent(new Event('scalar:reload-references'))
      // Assert the component was reloaded
    })

    it('handles scalar:destroy-references event', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const element = doc.querySelector('#mount-point')
      const config = { _integration: 'html' }

      createApiReference(element!, apiReferenceConfigurationSchema.parse(config), doc)

      doc.dispatchEvent(new Event('scalar:destroy-references'))
      // Assert the component was destroyed
    })

    it('handles scalar:update-references-config event', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const element = doc.querySelector('#mount-point')
      const config = { _integration: 'html' }

      createApiReference(element!, apiReferenceConfigurationSchema.parse(config), doc)

      const updateEvent = new CustomEvent('scalar:update-references-config', {
        detail: { configuration: { darkMode: true } },
      })
      doc.dispatchEvent(updateEvent)
      // Assert the configuration was updated
    })

    it('allows mounting after creation', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const config = { _integration: 'html' }
      const app = createApiReference(apiReferenceConfigurationSchema.parse(config), doc)

      // Mount after creation
      app.mount('#mount-point')
      expect(app).toBeDefined()
    })

    it('allows updating configuration after creation', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const config = { _integration: 'html' }
      const app = createApiReference('#mount-point', apiReferenceConfigurationSchema.parse(config), doc)

      // Update configuration after creation
      const newConfig = {
        spec: {
          content: '{"openapi":"3.1.0", "info": {"title": "Updated API", "version": "1.0.0"}}',
        },
      }
      app.updateConfiguration(newConfig)

      expect(app).toBeDefined()

      // Assert the configuration was updated
      expect(app.getConfiguration()).toMatchObject(newConfig)
    })
  })

  describe('findDataAttributes (legacy)', () => {
    it('adds dark-mode class when darkMode is true', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const config = apiReferenceConfigurationSchema.parse({
        _integration: 'html',
        darkMode: true,
      })

      findDataAttributes(doc, config)
      expect(doc.body.classList.contains('dark-mode')).toBe(true)
    })

    it('adds light-mode class when darkMode is false', () => {
      const doc = createHtmlDocument(`
        <html>
          <body>
            <div id="mount-point"></div>
          </body>
        </html>
      `)

      const config = apiReferenceConfigurationSchema.parse({
        _integration: 'html',
        darkMode: false,
      })

      findDataAttributes(doc, config)
      expect(doc.body.classList.contains('light-mode')).toBe(true)
    })
  })

  describe('getConfigurationFromDataAttributes', () => {
    it('createApiReference', async () => {
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

    // We can’t log an error anymore, otherwise it would always show for people using the new JS-based API.
    it.skip('handles missing spec elements with error', () => {
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
})

/** Utility to create a new HTML document from a string */
function createHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}
