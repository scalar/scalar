import { describe, it, expect } from 'vitest'
import { getDocumentName } from './get-document-name'

describe('getDocumentName', () => {
  describe('URL-based documents', () => {
    it('should return name when one is provided', () => {
      const result = getDocumentName({ name: 'Test name', url: 'https://api.example.com' }, 1)
      expect(result).toBe('Test name')
    })

    it('should return URL when no explicit name is provided', () => {
      const result = getDocumentName({ url: 'https://api.example.com' }, 1)
      expect(result).toBe('https://api.example.com')
    })

    it('should return the title if it exists and there is no name or url', () => {
      const result = getDocumentName(
        {
          document: { info: { title: 'Test title' } },
        },
        1,
      )
      expect(result).toBe('Test title')
    })

    it('should base the unknown name on the number of documents', () => {
      const result = getDocumentName({}, 5)
      expect(result).toBe('OpenApi Document 6')
    })
  })
})
