import { describe, expect, it } from 'vitest'

import { getListOfReferences } from './get-list-of-references'

describe('get-list-of-references', () => {
  it('preserves literal references in OpenAPI 2 response examples', () => {
    const specification = {
      swagger: '2.0',
      info: { title: 'Examples', version: '1' },
      paths: {
        '/': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                examples: { 'application/json': { $ref: 'literal.json' } },
              },
            },
          },
        },
      },
    }
    expect(getListOfReferences(specification)).toStrictEqual([])
  })

  it('collects real references while skipping literal values and map names', () => {
    const literal = { $ref: 'literal.json' }
    expect(
      getListOfReferences({
        openapi: '3.1.0',
        components: {
          schemas: {
            Member: {
              properties: { $ref: { $ref: 'uri.json' }, example: { $ref: 'schema.json' } },
              examples: [literal],
              default: literal,
              enum: [literal],
              const: literal,
            },
          },
          examples: { example: { $ref: 'example.json' }, Original: { value: literal } },
        },
        paths: {
          '/': {
            get: {
              responses: {
                '200': {
                  content: { 'application/json': { example: literal, examples: { Named: { value: literal } } } },
                },
              },
            },
          },
        },
      }),
    ).toStrictEqual(['uri.json', 'schema.json', 'example.json'])
  })
})
