import { describe, expect, it } from 'vitest'

import { OperationObjectSchema } from '../unprocessed/operation-object'

describe('example-object', () => {
  describe('ExampleObject', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-object-examples
    it('Example Object Example', () => {
      const result = OperationObjectSchema.parse({
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Address',
              },
              examples: {
                foo: {
                  summary: 'A foo example',
                  value: {
                    foo: 'bar',
                  },
                },
                bar: {
                  summary: 'A bar example',
                  value: {
                    bar: 'baz',
                  },
                },
              },
            },
            'application/xml': {
              examples: {
                xmlExample: {
                  summary: 'This is an example in XML',
                  externalValue: 'https://example.org/examples/address-example.xml',
                },
              },
            },
            'text/plain': {
              examples: {
                textExample: {
                  summary: 'This is a text example',
                  externalValue: 'https://foo.bar/examples/address-example.txt',
                },
              },
            },
          },
        },
      })

      expect(result).toEqual({
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Address',
              },
              examples: {
                foo: {
                  summary: 'A foo example',
                  value: {
                    foo: 'bar',
                  },
                },
                bar: {
                  summary: 'A bar example',
                  value: {
                    bar: 'baz',
                  },
                },
              },
            },
            'application/xml': {
              examples: {
                xmlExample: {
                  summary: 'This is an example in XML',
                  externalValue: 'https://example.org/examples/address-example.xml',
                },
              },
            },
            'text/plain': {
              examples: {
                textExample: {
                  summary: 'This is a text example',
                  externalValue: 'https://foo.bar/examples/address-example.txt',
                },
              },
            },
          },
        },
      })
    })
  })
})
