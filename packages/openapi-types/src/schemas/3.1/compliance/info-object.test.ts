import { describe, expect, it } from 'vitest'

import { InfoObjectSchema } from '../unprocessed/info-object'

describe('info-object', () => {
  describe('InfoObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#info-object-example
    it('Info Object Example', () => {
      const result = InfoObjectSchema.parse({
        title: 'Example Pet Store App',
        summary: 'A pet store manager.',
        description: 'This is an example server for a pet store.',
        termsOfService: 'https://example.com/terms/',
        contact: {
          name: 'API Support',
          url: 'https://www.example.com/support',
          email: 'support@example.com',
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
        version: '1.0.1',
      })

      expect(result).toEqual({
        title: 'Example Pet Store App',
        summary: 'A pet store manager.',
        description: 'This is an example server for a pet store.',
        termsOfService: 'https://example.com/terms/',
        contact: {
          name: 'API Support',
          url: 'https://www.example.com/support',
          email: 'support@example.com',
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
        version: '1.0.1',
      })
    })
  })
})
