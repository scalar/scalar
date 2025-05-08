import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBasePath, initialize } from './scalar.aspnetcore'

describe('scalar.aspnetcore', () => {
  describe('getBasePath', () => {
    beforeEach(() => {
      // Create window object before modifying it
      global.window = {
        location: new URL('https://example.com/api/docs'),
      }
    })

    afterEach(() => {
      // Clean up after each test
      delete global.window
    })

    it('removes suffix from path when present', () => {
      const result = getBasePath('/docs')
      expect(result).toBe('/api')
    })

    it('returns empty string when suffix is not present', () => {
      const result = getBasePath('/other')
      expect(result).toBe('')
    })

    it('handles empty suffix', () => {
      const result = getBasePath('')
      expect(result).toBe('')
    })

    it('removes only the last occurrence of suffix', () => {
      global.window.location = new URL('https://example.com/docs/api/docs')
      const result = getBasePath('/docs')
      expect(result).toBe('/docs/api')
    })
  })

  describe('initialize', () => {
    let mockScalar

    beforeEach(() => {
      mockScalar = {
        createApiReference: vi.fn(),
      }
      // Create a mock window object
      global.window = {
        location: new URL('https://example.com/api/docs'),
        Scalar: mockScalar,
      }
      // Mock dynamic imports for testing the modulePath parameter
      vi.mock(
        'https://example.com/api/config.js',
        () => ({
          default: { theme: 'dark', logo: 'custom-logo.png' },
        }),
        { virtual: true },
      )

      vi.mock(
        'https://example.com/absolute/path/config.js',
        () => ({
          default: { theme: 'light', header: { enabled: true } },
        }),
        { virtual: true },
      )

      // Spy on console.error
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      // Clean up after each test
      delete global.window
      vi.clearAllMocks()
    })

    it('transforms URLs to absolute paths when using relative URLs', () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }, { url: 'openapi.json' }],
      }

      initialize('/docs', false, configuration)

      // Get the configuration object passed to createApiReference
      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.sources[0].url).toBe('https://example.com/api/swagger.json')
      expect(normalizedConfig.sources[1].url).toBe('https://example.com/api/openapi.json')
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', normalizedConfig)
    })

    it('preserves URLs when using absolute paths', () => {
      const configuration = {
        sources: [{ url: 'https://foo.bar/swagger.json' }, { url: 'htTP://foo.bar/openapi.json' }],
      }

      const originalUrls = configuration.sources.map((s) => s.url)
      initialize('/docs', false, configuration)

      expect(configuration.sources[0].url).toBe(originalUrls[0])
      expect(configuration.sources[1].url).toBe(originalUrls[1])
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', configuration)
    })

    it('handles empty configuration gracefully', () => {
      expect(() => initialize('/docs', false, {})).not.toThrow()
    })

    it('handles empty sources array', () => {
      const configuration = { sources: [] }
      initialize('/docs', false, configuration)
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', configuration)
    })

    it('handles missing window.location.origin', () => {
      delete global.window.location.origin
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      expect(() => initialize('/docs', false, configuration)).not.toThrow()
    })

    it('handles sources without url property', () => {
      const configuration = {
        sources: [{ title: 'Source without URL' }, { url: 'swagger.json' }],
      }

      initialize('/docs', false, configuration)

      // Get the normalized config that was passed to createApiReference
      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]

      // The configuration should remain unchanged for sources without URLs
      expect(normalizedConfig.sources[0]).toEqual({ title: 'Source without URL' })
      // Sources with URLs should still be processed normally
      expect(normalizedConfig.sources[1].url).toBe('https://example.com/api/swagger.json')
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', normalizedConfig)
    })

    it('sets baseServerURL when useDynamicBaseServerUrl is true', () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      initialize('/docs', true, configuration)

      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.baseServerURL).toBe('https://example.com/api')
    })

    it('does not set baseServerURL when useDynamicBaseServerUrl is false', () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      initialize('/docs', false, configuration)

      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.baseServerURL).toBeUndefined()
    })

    it('loads custom configuration from relative modulePath', async () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      await initialize('/docs', false, configuration, './config.js')

      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.theme).toBe('dark')
      expect(normalizedConfig.logo).toBe('custom-logo.png')
      expect(normalizedConfig.sources[0].url).toBe('https://example.com/api/swagger.json')
    })

    it('loads custom configuration from absolute modulePath', async () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      await initialize('/docs', false, configuration, 'https://example.com/absolute/path/config.js')

      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.theme).toBe('light')
      expect(normalizedConfig.header.enabled).toBe(true)
      expect(normalizedConfig.sources[0].url).toBe('https://example.com/api/swagger.json')
    })

    it('handles errors when loading custom configuration', async () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
        originalProperty: 'value',
      }

      await initialize('/docs', false, configuration, '/error-config.js')

      // Should log error but continue with normal initialization
      expect(console.error).toHaveBeenCalled()

      // Should still call createApiReference with the original config
      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.originalProperty).toBe('value')
      expect(normalizedConfig.sources[0].url).toBe('https://example.com/api/swagger.json')
    })

    it('skips loading custom configuration when modulePath is not provided', async () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      await initialize('/docs', false, configuration)

      expect(mockScalar.createApiReference).toHaveBeenCalled()
      // No errors should be logged
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})
