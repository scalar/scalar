import { describe, expect, it } from 'vitest'

import { RequestBodyObjectSchema } from '../unprocessed/request-body-object'

describe('request-body-object', () => {
  describe('ContactObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#request-body-examples
    describe('Request Body Examples', () => {
      it('A request body with a referenced schema definition', () => {
        const result = RequestBodyObjectSchema.parse({
          description: 'user to add to the system',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
              examples: {
                user: {
                  summary: 'User Example',
                  externalValue: 'https://foo.bar/examples/user-example.json',
                },
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/User',
              },
              examples: {
                user: {
                  summary: 'User example in XML',
                  externalValue: 'https://foo.bar/examples/user-example.xml',
                },
              },
            },
            'text/plain': {
              examples: {
                user: {
                  summary: 'User example in Plain text',
                  externalValue: 'https://foo.bar/examples/user-example.txt',
                },
              },
            },
            '*/*': {
              examples: {
                user: {
                  summary: 'User example in other format',
                  externalValue: 'https://foo.bar/examples/user-example.whatever',
                },
              },
            },
          },
        })

        expect(result).toEqual({
          description: 'user to add to the system',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
              examples: {
                user: {
                  summary: 'User Example',
                  externalValue: 'https://foo.bar/examples/user-example.json',
                },
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/User',
              },
              examples: {
                user: {
                  summary: 'User example in XML',
                  externalValue: 'https://foo.bar/examples/user-example.xml',
                },
              },
            },
            'text/plain': {
              examples: {
                user: {
                  summary: 'User example in Plain text',
                  externalValue: 'https://foo.bar/examples/user-example.txt',
                },
              },
            },
            '*/*': {
              examples: {
                user: {
                  summary: 'User example in other format',
                  externalValue: 'https://foo.bar/examples/user-example.whatever',
                },
              },
            },
          },
        })
      })
    })
  })
})
