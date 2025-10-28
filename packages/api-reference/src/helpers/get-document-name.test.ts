import { describe, it, expect } from 'vitest'
import { getDocumentName } from './get-document-name'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

describe('getDocumentName', () => {
  describe('URL-based documents', () => {
    it('should return name when one is provided', () => {
      const result = getDocumentName({ name: 'Test name', url: 'https://api.example.com' }, {})
      expect(result).toBe('Test name')
    })

    it('should return URL when no explicit name is provided', () => {
      const result = getDocumentName({ url: 'https://api.example.com' }, {})
      expect(result).toBe('https://api.example.com')
    })

    it('should return the title if it exists and there is no name or url', () => {
      const result = getDocumentName(
        {
          document: { info: { title: 'Test title' } },
        },
        {},
      )
      expect(result).toBe('Test title')
    })

    it('should base the unknown name on the number of documents', () => {
      const result = getDocumentName(
        {},
        {
          'API #1': {} as OpenApiDocument,
          'API #2': {} as OpenApiDocument,
          'API #3': {} as OpenApiDocument,
          'API #5': {} as OpenApiDocument,
        },
      )
      expect(result).toBe('API #4')
    })
  })
})
