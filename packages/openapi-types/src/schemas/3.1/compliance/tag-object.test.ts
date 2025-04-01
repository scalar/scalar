import { describe, expect, it } from 'vitest'

import { TagObjectSchema } from '../unprocessed/tag-object'

describe('tag-object', () => {
  describe('TagObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#tag-object-example
    it('Tag Object Example', () => {
      const result = TagObjectSchema.parse({
        name: 'pet',
        description: 'Pets operations',
      })

      expect(result).toEqual({
        name: 'pet',
        description: 'Pets operations',
      })
    })
  })
})
