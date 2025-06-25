import { describe, expect, it } from 'vitest'
import { isDocument } from './is-document'

describe('is-document', () => {
  describe('isDocument', () => {
    it('returns true for OpenAPI document content', () => {
      const openApiContent = `openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint`

      expect(isDocument(openApiContent)).toBe(true)
    })

    it('returns true for JSON document content', () => {
      const jsonContent = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Test API",
    "version": "1.0.0"
  }
}`

      expect(isDocument(jsonContent)).toBe(true)
    })

    it('returns true for plain text content', () => {
      const textContent = 'This is some plain text content'

      expect(isDocument(textContent)).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(isDocument('')).toBe(false)
    })

    it('returns false for whitespace-only string', () => {
      expect(isDocument('   \n\t  ')).toBe(false)
    })

    it('returns false for null input', () => {
      expect(isDocument(null)).toBe(false)
    })

    it('returns false for undefined input', () => {
      expect(isDocument(undefined as any)).toBe(false)
    })

    it('returns false for HTTP URL', () => {
      expect(isDocument('http://example.com/api')).toBe(false)
    })

    it('returns false for HTTPS URL', () => {
      expect(isDocument('https://api.example.com/openapi.json')).toBe(false)
    })

    it('returns false for URL with trailing whitespace', () => {
      expect(isDocument('  https://example.com/api  ')).toBe(false)
    })

    it('returns false for URL with query parameters', () => {
      expect(isDocument('https://example.com/api?version=1.0')).toBe(false)
    })

    it('returns false for URL with path parameters', () => {
      expect(isDocument('https://example.com/api/v1/spec')).toBe(false)
    })

    it('returns false for URL with fragment', () => {
      expect(isDocument('https://example.com/api#section')).toBe(false)
    })

    it('returns false for URL with port', () => {
      expect(isDocument('https://example.com:8080/api')).toBe(false)
    })

    it('returns false for content that looks like URL but is not valid', () => {
      expect(isDocument('http://')).toBe(false)
    })

    it('returns false for content that looks like URL but is not valid with whitespace', () => {
      expect(isDocument('  https://  ')).toBe(false)
    })
  })
})
