import { describe, expect, it } from 'vitest'

import { HeaderObjectSchema } from '../unprocessed/header-object'

describe('header-object', () => {
  describe('HeaderObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#header-object-example
    describe('Header Object Example', () => {
      it('A simple header of type integer', () => {
        const result = HeaderObjectSchema.parse({
          description: 'The number of allowed requests in the current period',
          schema: {
            type: 'integer',
          },
        })

        expect(result).toEqual({
          description: 'The number of allowed requests in the current period',
          schema: {
            type: 'integer',
          },
        })
      })

      it('Requiring that a strong ETag header (with a value starting with " rather than W/) is present.', () => {
        const result = HeaderObjectSchema.parse({
          required: true,
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                pattern: '^"',
              },
            },
          },
        })

        expect(result).toEqual({
          required: true,
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                pattern: '^"',
              },
            },
          },
        })
      })
    })
  })
})
