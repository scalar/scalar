import { describe, expect, it } from 'vitest'

import { ContactObjectSchema } from '../unprocessed/contact-object'

describe('contact-object', () => {
  describe('ContactObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#contact-object-example
    it('Contact Object Example', () => {
      const result = ContactObjectSchema.parse({
        name: 'API Support',
        url: 'https://www.example.com/support',
        email: 'support@example.com',
      })

      expect(result).toEqual({
        name: 'API Support',
        url: 'https://www.example.com/support',
        email: 'support@example.com',
      })
    })
  })
})
