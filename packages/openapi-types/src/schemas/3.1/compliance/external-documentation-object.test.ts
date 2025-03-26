import { describe, expect, it } from 'vitest'
import { ExternalDocumentationObjectSchema } from '../unprocessed/external-documentation-object'

describe('external-documentation', () => {
  describe('ExternalDocumentationObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#external-documentation-object-example
    it('External Documentation Object Example', () => {
      const result = ExternalDocumentationObjectSchema.parse({
        description: 'Find more info here',
        url: 'https://example.com',
      })

      expect(result).toEqual({
        description: 'Find more info here',
        url: 'https://example.com',
      })
    })
  })
})
