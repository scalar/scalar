import { describe, it, expect } from 'vitest'
import { httpStatusCodes, type HttpStatusCode, type HttpStatusCodes } from './http-status-codes'

describe('HTTP Status Codes', () => {
  describe('Type Structure', () => {
    it('should have the correct type structure for HttpStatusCode', () => {
      const sampleStatusCode: HttpStatusCode = {
        name: 'Test',
        url: 'https://example.com',
        color: 'var(--scalar-color-test)',
      }

      expect(sampleStatusCode).toHaveProperty('name')
      expect(sampleStatusCode).toHaveProperty('url')
      expect(sampleStatusCode).toHaveProperty('color')
    })

    it('should have the correct type structure for HttpStatusCodes', () => {
      const sampleStatusCodes: HttpStatusCodes = {
        '200': {
          name: 'OK',
          url: 'https://example.com',
          color: 'var(--scalar-color-test)',
        },
      }

      expect(sampleStatusCodes).toBeTypeOf('object')
      expect(sampleStatusCodes['200']).toBeDefined()
    })
  })

  describe('Content Validation', () => {
    it('should contain all standard HTTP status codes', () => {
      const requiredCodes = ['100', '200', '300', '400', '500'] as const
      requiredCodes.forEach((code) => {
        expect(httpStatusCodes[code]).toBeDefined()
      })
    })

    it('should have valid URLs for all status codes', () => {
      Object.entries(httpStatusCodes).forEach(([_code, status]) => {
        expect(status.url).toMatch(/^https:\/\/developer\.mozilla\.org\/en-US\/docs\/Web\/HTTP\/Status\/\d+$/)
      })
    })

    it('should have valid color values for all status codes', () => {
      Object.values(httpStatusCodes).forEach((status) => {
        expect(status.color).toMatch(/^var\(--scalar-color-(blue|green|yellow|red)\)$/)
      })
    })

    it('should have non-empty names for all status codes', () => {
      Object.values(httpStatusCodes).forEach((status) => {
        expect(status.name).toBeTruthy()
        expect(typeof status.name).toBe('string')
      })
    })
  })

  describe('Status Code Categories', () => {
    it('should have correct colors for informational status codes (1xx)', () => {
      Object.entries(httpStatusCodes)
        .filter(([code]) => code.startsWith('1'))
        .forEach(([_, status]) => {
          expect(status.color).toBe('var(--scalar-color-blue)')
        })
    })

    it('should have correct colors for successful status codes (2xx)', () => {
      Object.entries(httpStatusCodes)
        .filter(([code]) => code.startsWith('2'))
        .forEach(([_, status]) => {
          expect(status.color).toBe('var(--scalar-color-green)')
        })
    })

    it('should have correct colors for redirection status codes (3xx)', () => {
      Object.entries(httpStatusCodes)
        .filter(([code]) => code.startsWith('3'))
        .forEach(([_, status]) => {
          expect(status.color).toBe('var(--scalar-color-yellow)')
        })
    })

    it('should have correct colors for client error status codes (4xx)', () => {
      Object.entries(httpStatusCodes)
        .filter(([code]) => code.startsWith('4'))
        .forEach(([_, status]) => {
          expect(status.color).toBe('var(--scalar-color-red)')
        })
    })

    it('should have correct colors for server error status codes (5xx)', () => {
      Object.entries(httpStatusCodes)
        .filter(([code]) => code.startsWith('5'))
        .forEach(([_, status]) => {
          expect(status.color).toBe('var(--scalar-color-red)')
        })
    })
  })

  describe('Specific Status Codes', () => {
    it('should have correct information for 200 OK', () => {
      expect(httpStatusCodes['200']).toEqual({
        name: 'OK',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200',
        color: 'var(--scalar-color-green)',
      })
    })

    it('should have correct information for 404 Not Found', () => {
      expect(httpStatusCodes['404']).toEqual({
        name: 'Not Found',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404',
        color: 'var(--scalar-color-red)',
      })
    })

    it('should have correct information for 500 Internal Server Error', () => {
      expect(httpStatusCodes['500']).toEqual({
        name: 'Internal Server Error',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500',
        color: 'var(--scalar-color-red)',
      })
    })
  })

  describe('Edge Cases', () => {
    it("should handle special status codes like 418 I'm a teapot", () => {
      expect(httpStatusCodes['418']).toBeDefined()
      expect(httpStatusCodes['418']?.name).toBe("I'm a teapot")
    })

    it('should handle status codes with special characters in names', () => {
      const statusCodesWithSpecialChars = Object.values(httpStatusCodes).filter((status) =>
        /[^a-zA-Z0-9\s]/.test(status.name),
      )

      expect(statusCodesWithSpecialChars.length).toBeGreaterThan(0)
      statusCodesWithSpecialChars.forEach((status) => {
        expect(status.name).toBeTruthy()
        expect(status.url).toBeTruthy()
        expect(status.color).toBeTruthy()
      })
    })
  })
})
