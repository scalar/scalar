import { describe, expect, it } from 'vitest'

import { getListOfReferences } from './get-list-of-references'

describe('get-list-of-references', () => {
  it('collects OpenAPI 2 response definitions named like extensions', () => {
    expect(
      getListOfReferences({
        swagger: '2.0',
        responses: {
          'x-response': { $ref: 'response.json' },
        },
      }),
    ).toStrictEqual(['response.json'])
  })

  it('ignores Paths and Responses extension data while collecting x-prefixed component references', () => {
    expect(
      getListOfReferences({
        openapi: '3.1.0',
        paths: {
          'x-meta': { $ref: 'literal-path.json' },
          '/': {
            get: { responses: { '200': { $ref: 'response.json' }, 'x-meta': { $ref: 'literal-response.json' } } },
          },
        },
        components: {
          responses: { 'x-response': { $ref: 'component-response.json' } },
          schemas: {
            Thing: {
              properties: {
                'x-property': { $ref: 'property.json' },
                dependentRequired: { $ref: 'dependency-schema.json' },
              },
              dependentRequired: { $ref: ['other'] },
            },
          },
        },
      }),
    ).toStrictEqual(['response.json', 'component-response.json', 'property.json', 'dependency-schema.json'])
  })

  it('collects custom-operation dependencies but not scope descriptions, mappings, or literal Link and extension data', () => {
    const literal = { $ref: 'literal.json' }
    expect(
      getListOfReferences({
        openapi: '3.2.1',
        'x-data': literal,
        paths: { '/': { additionalOperations: { example: { requestBody: { $ref: 'body.json' } } } } },
        components: {
          schemas: { Demo: { discriminator: { propertyName: 'kind', mapping: { $ref: 'schema.json' } } } },
          links: { Next: { operationId: 'next', requestBody: literal, parameters: { filter: literal } } },
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://example.com/auth',
                  scopes: { $ref: 'Read reference resources' },
                },
              },
            },
          },
        },
      }),
    ).toStrictEqual(['body.json'])
  })

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
