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
      // Create a mock window object
      global.window = {
        location: new URL('https://example.com/api/docs'),
      }
    })

    afterEach(() => {
      // Clean up after each test
      delete global.window
    })

    beforeEach(() => {
      mockScalar = {
        createApiReference: vi.fn(),
      }
      global.Scalar = mockScalar
    })

    it('transforms URLs to absolute paths when using relative URLs', () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }, { url: 'openapi.json' }],
      }

      initialize('/docs', false, false, configuration)

      // Get the configuration object passed to createApiReference
      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.sources[0].url).toBe('https://example.com/api/swagger.json')
      expect(normalizedConfig.sources[1].url).toBe('https://example.com/api/openapi.json')
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', normalizedConfig)
    })

    it('preserves URLs when using absolute paths', () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }, { url: 'openapi.json' }],
      }

      const originalUrls = configuration.sources.map((s) => s.url)
      initialize('/docs', true, false, configuration)

      expect(configuration.sources[0].url).toBe(originalUrls[0])
      expect(configuration.sources[1].url).toBe(originalUrls[1])
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', configuration)
    })

    it('handles empty configuration gracefully', () => {
      expect(() => initialize('/docs', false, false, {})).not.toThrow()
    })

    it('handles empty sources array', () => {
      const configuration = { sources: [] }
      initialize('/docs', false, false, configuration)
      expect(mockScalar.createApiReference).toHaveBeenCalledWith('#app', configuration)
    })

    it('handles missing window.location.origin', () => {
      delete global.window.location.origin
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      expect(() => initialize('/docs', false, false, configuration)).not.toThrow()
    })

    it('handles sources without url property', () => {
      const configuration = {
        sources: [{ title: 'Source without URL' }, { url: 'swagger.json' }],
      }

      initialize('/docs', false, false, configuration)

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

      initialize('/docs', false, true, configuration)

      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.baseServerURL).toBe('https://example.com/api')
    })

    it('does not set baseServerURL when useDynamicBaseServerUrl is false', () => {
      const configuration = {
        sources: [{ url: 'swagger.json' }],
      }

      initialize('/docs', false, false, configuration)

      const normalizedConfig = mockScalar.createApiReference.mock.calls[0][1]
      expect(normalizedConfig.baseServerURL).toBeUndefined()
    })
  })
})
