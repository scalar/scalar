import {
  createApiReference,
  createContainer,
  findDataAttributes,
  getConfigurationFromDataAttributes,
} from '@/standalone/lib/html-api'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('html-api', () => {
  beforeEach(() => {
    global.document = createHtmlDocument(`
      <html>
        <body>
          <div id="mount-point"></div>
        </body>
      </html>
    `)
  })

  const consoleWarnSpy = vi.spyOn(console, 'warn')

  // Since we use zod now we have a base config
  const baseConfig = apiReferenceConfigurationSchema.parse({
    _integration: 'html',
  })

  describe('createContainer', () => {
    it('creates a container element', () => {
      expect(createContainer(document)).toBeDefined()
    })
  })

  describe('createApiReference', () => {
    it('creates and mounts the API reference component', () => {
      const element = document.querySelector('#mount-point')
      expect(element).toBeInstanceOf(HTMLElement)

      const config = { _integration: 'html' }
      const apiReference = createApiReference(element!, apiReferenceConfigurationSchema.parse(config))

      expect(apiReference.app.mount).toBeDefined()
      expect(apiReference.updateConfiguration).toBeDefined()
      expect(element?.innerHTML).toContain('Powered by Scalar')
    })

    it('handles string selectors for mounting', () => {
      const config = { _integration: 'html' }
      const apiReference = createApiReference('#mount-point', apiReferenceConfigurationSchema.parse(config))

      expect(apiReference.app.mount).toBeDefined()
      expect(apiReference.updateConfiguration).toBeDefined()
      expect(document.getElementById('mount-point')?.innerHTML).toContain('Powered by Scalar')
    })

    it('handles scalar:reload-references event', () => {
      const element = document.querySelector('#mount-point')
      const config = { _integration: 'html' }

      createApiReference(element!, apiReferenceConfigurationSchema.parse(config))
      document.dispatchEvent(new Event('scalar:reload-references'))

      expect(consoleWarnSpy).toHaveBeenCalledOnce()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'scalar:reload-references event has been deprecated, please use the scalarInstance.app.mount method instead.',
      )
    })

    it('handles scalar:destroy-references event', () => {
      const element = document.querySelector('#mount-point')
      const config = { _integration: 'html' }

      createApiReference(element!, apiReferenceConfigurationSchema.parse(config))

      document.dispatchEvent(new Event('scalar:destroy-references'))
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'scalar:destroy-references event has been deprecated, please use scalarInstance.destroy instead.',
      )
    })

    it('handles scalar:update-references-config event', () => {
      const element = document.querySelector('#mount-point')
      const config = { _integration: 'html' }

      createApiReference(element!, apiReferenceConfigurationSchema.parse(config))

      const updateEvent = new CustomEvent('scalar:update-references-config', {
        detail: { configuration: { darkMode: true } },
      })
      document.dispatchEvent(updateEvent)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'scalar:update-references-config event has been deprecated, please use scalarInstance.updateConfiguration instead.',
      )
    })

    it('allows mounting after creation', () => {
      const config = { _integration: 'html' }
      const app = createApiReference(apiReferenceConfigurationSchema.parse(config))

      // Mount after creation
      app.app.mount('#mount-point')
      expect(app).toBeDefined()
      expect(document.getElementById('mount-point')?.innerHTML).toContain('Powered by Scalar')
    })

    it('allows updating configuration after creation', async () => {
      const config = { _integration: 'html' }
      const app = createApiReference('#mount-point', apiReferenceConfigurationSchema.parse(config))

      // Update configuration after creation
      const newConfig = {
        content: '{"openapi":"3.1.0", "info": {"title": "Updated API", "version": "1.0.0"}}',
      }
      app.updateConfiguration(newConfig)
      expect(app).toBeDefined()

      // Assert the configuration was updated
      expect(app.getConfiguration()).toMatchObject(newConfig)
      await flushPromises()
      expect(document.getElementById('mount-point')?.innerHTML).toContain('Updated API')
    })
  })

  describe('findDataAttributes (legacy)', () => {
    it('adds dark-mode class when darkMode is true', () => {
      const config = apiReferenceConfigurationSchema.parse({
        _integration: 'html',
        darkMode: true,
      })

      findDataAttributes(document, config)
      expect(document.body.classList.contains('dark-mode')).toBe(true)
    })

    it('adds light-mode class when darkMode is false', () => {
      const config = apiReferenceConfigurationSchema.parse({
        _integration: 'html',
        darkMode: false,
      })

      findDataAttributes(document, config)
      expect(document.body.classList.contains('light-mode')).toBe(true)
    })
  })

  describe('getConfigurationFromDataAttributes', () => {
    it('createApiReference', async () => {
      global.document = createHtmlDocument(`
        <html>
          <body>
            <script id="api-reference" data-url="/openapi.json"></script>
          </body>
        </html>
      `)

      expect(getConfigurationFromDataAttributes(document)).toStrictEqual({
        ...baseConfig,
        proxyUrl: undefined,
        url: '/openapi.json',
      })
    })

    it('handles spec content from script tag', () => {
      global.document = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" type="application/json">{"openapi":"3.1.0"}</script>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(document)).toStrictEqual({
        ...baseConfig,
        proxyUrl: undefined,
        content: '{"openapi":"3.1.0"}',
      })
    })

    it('handles proxy URL configuration', () => {
      global.document = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" data-proxy-url="https://proxy.example.com" data-url="/spec.json"></script>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(document)).toStrictEqual({
        ...baseConfig,
        proxyUrl: 'https://proxy.example.com',
        url: '/spec.json',
      })
    })

    it('handles custom configuration via data-configuration attribute', () => {
      global.document = createHtmlDocument(`
      <html>
        <body>
          <script id="api-reference" data-configuration='{"darkMode":true,"spec":{"url":"/custom.json"}}'></script>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(document)).toStrictEqual({
        ...baseConfig,
        darkMode: true,
        proxyUrl: undefined,
        url: '/custom.json',
      })
    })

    it('handles deprecated data-spec attribute with warning', () => {
      global.document = createHtmlDocument(`
      <html>
        <body>
          <div data-spec='{"openapi":"3.1.0"}'></div>
        </body>
      </html>
    `)

      expect(getConfigurationFromDataAttributes(document)).toStrictEqual({
        ...baseConfig,
        proxyUrl: undefined,
        content: '{"openapi":"3.1.0"}',
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec] HTML API is deprecated'))
    })

    it('handles deprecated data-spec-url attribute with warning', () => {
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
        url: '/deprecated.json',
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('The [data-spec-url] HTML API is deprecated'))
    })

    // We can’t log an error anymore, otherwise it would always show for people using the new JS-based API.
    it.skip('handles missing spec elements with error', () => {
      expect(getConfigurationFromDataAttributes(document)).toStrictEqual(baseConfig)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Couldn’t find a [data-spec], [data-spec-url] or <script id="api-reference" /> element. Try adding it like this: %c<div data-spec-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml" />',
        'font-family: monospace;',
      )
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
        url: '/priority.json',
      })
    })
  })
})

/** Utility to create a new HTML document from a string */
function createHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}
