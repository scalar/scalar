import { describe, expect, it } from 'vitest'

import { ReferenceObjectSchema } from '../unprocessed/reference-object'

describe('reference-object', () => {
  describe('ReferenceObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#reference-object-example
    it('Reference Object Example', () => {
      const result = ReferenceObjectSchema.parse({
        $ref: '#/components/schemas/Pet',
      })

      expect(result).toEqual({
        $ref: '#/components/schemas/Pet',
      })
    })
  })
})
