import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { mergeAllOfSchemas } from './merge-all-of-schemas'

describe('mergeAllOfSchemas', () => {
  it('returns empty object for empty or invalid input', () => {
    expect(mergeAllOfSchemas({ allOf: [] } as any)).toEqual({})
    expect(mergeAllOfSchemas(null as any)).toEqual({})
    expect(mergeAllOfSchemas(undefined as any)).toEqual({})
    expect(mergeAllOfSchemas('not an array' as any)).toEqual({})
  })

  it('merges basic properties from multiple schemas', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        {
          properties: {
            age: { type: 'number' },
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    })
  })

  it('handles nested allOf schemas', () => {
    const schema = {
      allOf: [
        {
          allOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
            {
              properties: {
                name: { type: 'string' },
              },
            },
          ],
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    })
  })

  it('combines required fields from multiple schemas', () => {
    const schema = {
      allOf: [
        {
          required: ['name'],
        },
        {
          required: ['age'],
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      required: ['name', 'age'],
    })
  })

  it('preserves first type but lets a later allOf member override the description', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          description: 'First description',
        },
        {
          type: 'array', // Should be ignored
          description: 'Second description', // Overrides the first description
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'object',
      description: 'Second description',
    })
  })

  it('lets a later allOf member override the title', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          title: 'First title',
        },
        {
          type: 'object',
          title: 'Second title', // Overrides the first title
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'object',
      title: 'Second title',
    })
  })

  it('lets an inline allOf member override a referenced base schema description (#6974)', () => {
    // Mirrors the reported issue: a base schema is extended via allOf and the
    // extending member redefines the description and title.
    const schema = {
      title: 'UserDetailsHeader',
      allOf: [
        {
          type: 'object',
          title: 'BaseUser',
          description: 'Base user information',
          properties: {
            id: { type: 'integer', description: 'Unique user ID' },
          },
        },
        {
          type: 'object',
          title: 'UserDetails',
          description: 'Full user information',
          properties: {
            address: { type: 'string', description: 'Street address' },
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toMatchObject({
      // A later allOf member overrides the referenced base description
      description: 'Full user information',
      // The base (top-level) title still takes precedence over allOf members
      title: 'UserDetailsHeader',
      properties: {
        id: { description: 'Unique user ID' },
        address: { description: 'Street address' },
      },
    })
  })

  it('lets the base description take precedence over allOf member descriptions', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'array',
      description: 'Original description',
      allOf: [
        {
          type: 'object',
          description: 'First description',
        },
        {
          type: 'array', // Should be ignored
          description: 'Second description', // Should be ignored
        },
      ],
    })

    expect(mergeAllOfSchemas(schema)).toEqual({
      type: 'array',
      description: 'Original description',
    })
  })

  it('merges deeply nested schema structures', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
          required: ['user'],
        },
        {
          properties: {
            user: {
              properties: {
                name: { type: 'string' },
              },
            },
            metadata: { type: 'object' },
          },
          required: ['metadata'],
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        metadata: { type: 'object' },
      },
      required: ['user', 'metadata'],
    })
  })

  it('skips non-object schemas during merge', () => {
    const schemas = [
      null,
      undefined,
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      'invalid',
      {
        properties: {
          age: { type: 'number' },
        },
      },
    ] as any[]

    expect(mergeAllOfSchemas({ allOf: schemas } as SchemaObject)).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    })
  })

  it('merges allOf schemas within object items', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          items: {
            allOf: [
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                  email: { type: 'string' },
                },
              },
            ],
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        age: { type: 'number' },
        email: { type: 'string' },
      },
    })
  })

  it('merges allOf schemas within array items', () => {
    const schema = {
      allOf: [
        {
          type: 'array',
          items: {
            allOf: [
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                  email: { type: 'string' },
                },
                required: ['email'],
              },
            ],
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          age: { type: 'number' },
          email: { type: 'string' },
        },
        required: ['email'],
      },
    })
  })

  it('properly merges multiple top-level objects with array items containing allOf', () => {
    const schema = {
      allOf: [
        {
          'type': 'object',
          'properties': {
            'top-level-property': {
              'type': 'string',
            },
          },
        },
        {
          'type': 'object',
          'properties': {
            'top-level-array': {
              'type': 'array',
              'items': {
                'allOf': [
                  {
                    'type': 'object',
                    'properties': {
                      'all-of-schema-1': {
                        'type': 'string',
                      },
                    },
                  },
                  {
                    'type': 'object',
                    'allOf': [
                      {
                        'type': 'object',
                        'properties': {
                          'all-of-schema-2': {
                            'type': 'array',
                            'items': {
                              'allOf': [
                                {
                                  'type': 'object',
                                  'properties': {
                                    'all-of-schema-2-items-all-of-schema-1': {
                                      'type': 'string',
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      'type': 'object',
      'properties': {
        'top-level-property': {
          'type': 'string',
        },
        'top-level-array': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'all-of-schema-1': {
                'type': 'string',
              },
              'all-of-schema-2': {
                'type': 'array',
                'items': {
                  'type': 'object',
                  'properties': {
                    'all-of-schema-2-items-all-of-schema-1': {
                      'type': 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  it('merges allOf schemas within a large complex schema', () => {
    const schema = {
      'description': 'The big long nested list',
      'allOf': [
        {
          'type': 'object',
          'properties': {
            'next_page_token': {
              'type': 'string',
              'description': 'The next page token to paginate through large result sets.',
              'example': 'Usse957pzxvmYwlmCZ50a6CNXFrhztxuj82',
            },
          },
        },
        {
          'type': 'object',
          'properties': {
            'sessions': {
              'title': 'Recording session list',
              'type': 'array',
              'description': 'List of recording sessions',
              'items': {
                'allOf': [
                  {
                    'type': 'object',
                    'properties': {
                      'session_id': {
                        'type': 'string',
                        'description':
                          'Unique session identifier. Each instance of the session will have its own `session_id`.',
                        'example': 'JZiFOknTQ4yH/tJgaUTlkg==',
                      },
                    },
                  },
                  {
                    'type': 'object',
                    'description': 'List of recording files.',
                    'allOf': [
                      {
                        'type': 'object',
                        'properties': {
                          'recording_files': {
                            'title': 'Recording file list',
                            'type': 'array',
                            'description': 'List of recording files.',
                            'items': {
                              'allOf': [
                                {
                                  'type': 'object',
                                  'properties': {
                                    'id': {
                                      'type': 'string',
                                      'description':
                                        'The recording file ID. This is included in the general query response.',
                                      'example': '35497738-9fef-4f8a-97db-0ec34caef065',
                                    },
                                  },
                                  'description': 'Recording file object.',
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    'type': 'object',
                    'description': 'This is the one to check',
                    'items': {
                      'allOf': [
                        {
                          'type': 'object',
                          'properties': {
                            'participant_video_files': {
                              'title': 'The list of recording files for each participant.',
                              'type': 'array',
                              'description':
                                'A list of recording files. The API only returns this response when the **Record a separate audio file of each participant** setting is enabled.',
                              'items': {
                                'allOf': [
                                  {
                                    'type': 'object',
                                    'properties': {
                                      'id': {
                                        'type': 'string',
                                        'description':
                                          "The recording file's unique ID. This is included in the general query response.",
                                        'example': '24698bd1-589e-4c33-9ba3-bc788b2a0ac2',
                                      },
                                    },
                                    'description': 'The recording file object.',
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      'description': 'The big long nested list',
      'properties': {
        'next_page_token': {
          'type': 'string',
          'description': 'The next page token to paginate through large result sets.',
          'example': 'Usse957pzxvmYwlmCZ50a6CNXFrhztxuj82',
        },
        'sessions': {
          'title': 'Recording session list',
          'type': 'array',
          'description': 'List of recording sessions',
          'items': {
            'description': 'This is the one to check',
            'type': 'object',
            'properties': {
              'session_id': {
                'type': 'string',
                'description':
                  'Unique session identifier. Each instance of the session will have its own `session_id`.',
                'example': 'JZiFOknTQ4yH/tJgaUTlkg==',
              },
              'recording_files': {
                'title': 'Recording file list',
                'type': 'array',
                'description': 'List of recording files.',
                'items': {
                  'properties': {
                    'id': {
                      'type': 'string',
                      'description': 'The recording file ID. This is included in the general query response.',
                      'example': '35497738-9fef-4f8a-97db-0ec34caef065',
                    },
                  },
                  'type': 'object',
                  'description': 'Recording file object.',
                },
              },
              'participant_video_files': {
                'title': 'The list of recording files for each participant.',
                'type': 'array',
                'description':
                  'A list of recording files. The API only returns this response when the **Record a separate audio file of each participant** setting is enabled.',
                'items': {
                  'properties': {
                    'id': {
                      'type': 'string',
                      'description': "The recording file's unique ID. This is included in the general query response.",
                      'example': '24698bd1-589e-4c33-9ba3-bc788b2a0ac2',
                    },
                  },
                  'type': 'object',
                  'description': 'The recording file object.',
                },
              },
            },
          },
        },
      },
      'type': 'object',
    })
  })

  it('merges properties from oneOf/anyOf subschemas within allOf', () => {
    const schema = {
      allOf: [
        {
          allOf: [
            {
              properties: {
                a: { type: 'string', example: 'foo' },
              },
            },
            {
              oneOf: [
                {
                  properties: {
                    b: { type: 'number', example: 42 },
                  },
                },
                {
                  properties: {
                    c: { type: 'boolean', example: true },
                  },
                },
              ],
            },
            {
              anyOf: [
                {
                  properties: {
                    d: { type: 'integer', example: 7 },
                  },
                },
                {
                  properties: {
                    e: { type: 'array', items: { type: 'string' }, example: ['x', 'y'] },
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    // Base properties stay on the merged schema while the oneOf/anyOf
    // compositions are preserved, so the variant selectors keep rendering
    // instead of being flattened into a single object.
    expect(mergeAllOfSchemas(schema as any)).toEqual({
      properties: {
        a: { type: 'string', example: 'foo' },
      },
      oneOf: [
        { properties: { b: { type: 'number', example: 42 } } },
        { properties: { c: { type: 'boolean', example: true } } },
      ],
      anyOf: [
        { properties: { d: { type: 'integer', example: 7 } } },
        { properties: { e: { type: 'array', items: { type: 'string' }, example: ['x', 'y'] } } },
      ],
    })
  })

  it('preserves a oneOf composition nested inside allOf (issue #5577)', () => {
    const schema = {
      title: 'ConversionCreationRequest',
      allOf: [
        {
          type: 'object',
          properties: {
            customerComment: { type: 'string' },
          },
        },
        {
          oneOf: [
            {
              allOf: [{ title: 'With Quote Id', type: 'object', properties: { quoteId: { type: 'string' } } }],
            },
            {
              allOf: [
                {
                  title: 'With Currency Pair',
                  type: 'object',
                  properties: { sourceCurrencyCode: { type: 'string' }, destinationCurrencyCode: { type: 'string' } },
                },
              ],
            },
          ],
        },
      ],
    }

    const merged = mergeAllOfSchemas(schema as any) as any

    // The base property renders alongside the preserved oneOf variants.
    expect(merged.properties).toEqual({ customerComment: { type: 'string' } })
    expect(merged.oneOf).toHaveLength(2)
    expect(merged.oneOf[0].allOf[0].title).toBe('With Quote Id')
    expect(merged.oneOf[1].allOf[0].title).toBe('With Currency Pair')
  })

  it('lets a later allOf member override the title', () => {
    const schema = {
      allOf: [
        {
          title: 'Planet',
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        {
          title: 'Overrides the first title',
          type: 'object',
          properties: {
            size: { type: 'number' },
          },
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toEqual({
      title: 'Overrides the first title',
      type: 'object',
      properties: {
        name: { type: 'string' },
        size: { type: 'number' },
      },
    })
  })

  it('keeps $refs', () => {
    // Create schemas that reference each other using $ref
    const schemas = [
      coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: {
          parent: {
            $ref: '#/components/schemas/Node',
            '$ref-value': { type: 'object' },
          },
        },
      }),
    ]

    // This should not throw an error and should return a merged result
    const result = mergeAllOfSchemas({ allOf: schemas } as SchemaObject)

    expect(result).toStrictEqual({
      type: 'object',
      properties: {
        parent: {
          $ref: '#/components/schemas/Node',
          '$ref-value': { type: 'object' },
        },
      },
    })
  })

  it('handles $ref values', () => {
    // Create schemas that reference each other using $ref
    const schemas = [
      {
        type: 'object',
        properties: {
          id: { '$ref-value': { type: 'string' } },
          name: { type: 'string' },
          parent: {
            $ref: '#/components/schemas/Node',
            '$ref-value': { type: 'object' },
          },
          children: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Node',
              '$ref-value': { type: 'object' },
            },
          },
        },
      },
      {
        type: 'object',
        properties: {
          things: { '$ref-value': { type: 'string' } },
          stuff: {
            '$ref-value': { allOf: [{ '$ref-value': { type: 'string' } }] },
          },
        },
      },
    ]

    // This should not throw an error and should return a merged result
    const result = mergeAllOfSchemas({ allOf: schemas } as any)

    expect(result).toStrictEqual({
      properties: {
        id: { '$ref-value': { type: 'string' } },
        name: { type: 'string' },
        parent: {
          $ref: '#/components/schemas/Node',
          '$ref-value': { type: 'object' },
        },
        children: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Node',
            '$ref-value': { type: 'object' },
          },
        },
        things: { '$ref-value': { type: 'string' } },
        stuff: {
          '$ref-value': { allOf: [{ '$ref-value': { type: 'string' } }] },
        },
      },
      type: 'object',
    })
  })

  it('merges allOf schemas containing $ref circular references', () => {
    // Create a more complex scenario with allOf and $ref circular references
    const schema = {
      allOf: [
        {
          allOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            {
              $ref: '#/components/schemas/BaseEntity',
              '$ref-value': { type: 'object' },
            },
          ],
        },
        {
          allOf: [
            {
              type: 'object',
              properties: {
                relationships: {
                  type: 'object',
                  properties: {
                    parent: {
                      $ref: '#/components/schemas/Entity',
                      '$ref-value': { type: 'object' },
                    },
                    children: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Entity',
                        '$ref-value': { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
            {
              $ref: '#/components/schemas/TimestampMixin',
              '$ref-value': { type: 'object' },
            },
          ],
        },
      ],
    }

    const result = mergeAllOfSchemas(schema as any)

    expect(result).toStrictEqual({
      $ref: '#/components/schemas/BaseEntity',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        relationships: {
          type: 'object',
          properties: {
            parent: {
              '$ref': '#/components/schemas/Entity',
              '$ref-value': { type: 'object' },
            },
            children: {
              type: 'array',
              items: {
                '$ref': '#/components/schemas/Entity',
                '$ref-value': { type: 'object' },
              },
            },
          },
        },
      },
    })
  })

  it('handles deeply nested allOf with recursion limit', () => {
    // Create a deeply nested allOf structure that would exceed MAX_DEPTH
    const createDeepAllOf = (depth: number): SchemaObject => {
      if (depth === 0) {
        return coerceValue(SchemaObjectSchema, {
          type: 'object',
          properties: {
            baseProperty: { type: 'string' },
          },
        })
      }

      return coerceValue(SchemaObjectSchema, {
        allOf: [
          {
            type: 'object',
            properties: {
              [`level${depth}`]: { type: 'string' },
            },
          },
          createDeepAllOf(depth - 1),
        ],
      })
    }

    const deepSchema = createDeepAllOf(25)

    // This should not throw an error and should return a merged result
    const result = mergeAllOfSchemas({ allOf: [deepSchema] } as SchemaObject)

    expect(result).toBeDefined()
    expect(typeof result).toBe('object')

    // Should have at least some properties from the early levels
    expect((result as any).properties).toBeDefined()
    expect((result as any).type).toBe('object')
  })

  it('merges two objects with the same properties', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          format: 'date-time',
          title: 'First title',
          maxProperties: 20,
          minProperties: 2,
          enum: ['value1', 'value2'],
          properties: { a: { type: 'string' }, b: { description: 'First b' } },
        },
        {
          type: 'object',
          title: 'Second title',
          description: 'Second description',
          contentMediaType: 'application/json',
          format: 'hostname',
          enum: ['value3', 'value4'],
          properties: { a: { type: 'number' }, b: { description: 'Second b' } },
        },
        {
          description: 'Third description',
          enum: ['value5', 'value6'],
          maxProperties: 99,
          minProperties: 50,
        },
      ],
    }

    expect(mergeAllOfSchemas(schema as any)).toStrictEqual({
      type: 'object',
      format: 'date-time',
      // description and title reflect the last allOf member that defines them
      description: 'Third description',
      title: 'Second title',
      contentMediaType: 'application/json',
      enum: ['value1', 'value2', 'value3', 'value4', 'value5', 'value6'],
      properties: { a: { type: 'string' }, b: { description: 'First b' } },
      maxProperties: 20,
      minProperties: 2,
    })
  })

  it('merges schemas with all possible schema object properties', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      allOf: [
        {
          type: 'object',
          format: 'custom-format',
          title: 'First Schema',
          description: 'First description',
          default: { defaultValue: 'test' },
          enum: ['value1', 'value2'],
          const: 'constant-value',
          nullable: true,
          contentMediaType: 'application/json',
          contentEncoding: 'base64',
          contentSchema: {
            type: 'string',
          },
          deprecated: false,
          discriminator: {
            propertyName: 'type',
            mapping: {
              dog: '#/components/schemas/Dog',
              cat: '#/components/schemas/Cat',
            },
          },
          readOnly: false,
          writeOnly: false,
          xml: {
            name: 'xmlElement',
            namespace: 'http://example.com',
            prefix: 'ex',
            attribute: false,
            wrapped: true,
          },
          externalDocs: {
            description: 'External documentation',
            url: 'https://example.com/docs',
          },
          example: { exampleValue: 'test' },
          examples: [{ example1: 'value1' }, { example2: 'value2' }],
          'x-tags': ['tag1', 'tag2'],
          maxItems: 10,
          minItems: 1,
          uniqueItems: true,
          prefixItems: [{ type: 'string' }, { type: 'number' }],
          maxProperties: 20,
          minProperties: 2,
          required: ['prop1', 'prop2'],
          properties: {
            prop1: { type: 'string' },
            prop2: { type: 'number' },
          },
          additionalProperties: {
            type: 'string',
          },
          patternProperties: {
            '^S_': { type: 'string' },
            '^I_': { type: 'integer' },
          },
          maxLength: 100,
          minLength: 5,
          pattern: '^[a-zA-Z]+$',
          multipleOf: 2.5,
          maximum: 1000,
          exclusiveMaximum: 999,
          minimum: 0,
          exclusiveMinimum: true,
          'x-scalar-ignore': false,
          'x-internal': true,
          'x-variable': 'variableName',
          'x-enum-descriptions': {
            value1: 'Description for value1',
            value2: 'Description for value2',
          },
          'x-enum-varnames': ['VALUE_ONE', 'VALUE_TWO'],
        },
        {
          type: 'object',
          title: 'Second Schema',
          description: 'Second description',
          format: 'another-format',
          required: ['prop3', 'prop4'],
          properties: {
            prop3: { type: 'boolean' },
            prop4: { type: 'array', items: { type: 'string' } },
            prop1: {
              type: 'string',
              description: 'Enhanced prop1 description',
              minLength: 3,
            },
          },
          not: {
            type: 'null',
          },
          oneOf: [
            {
              properties: {
                oneOfProp2: { type: 'string' },
              },
            },
          ],
          maxItems: 5,
          minItems: 2,
          maxProperties: 15,
          minProperties: 3,
          maxLength: 50,
          minLength: 10,
          maximum: 500,
          minimum: 10,
        },
      ],
    })

    const result = mergeAllOfSchemas(schema)

    expect(result).toMatchObject({
      type: 'object',
      format: 'custom-format',
      // title and description reflect the last allOf member that defines them
      title: 'Second Schema',
      description: 'Second description',
      default: { defaultValue: 'test' },
      enum: ['value1', 'value2'],
      const: 'constant-value',
      not: {
        type: 'null',
      },
      nullable: true,
      contentMediaType: 'application/json',
      contentEncoding: 'base64',
      contentSchema: {
        type: 'string',
      },
      deprecated: false,
      // A member-contributed discriminator is dropped (see the tests below).
      readOnly: false,
      writeOnly: false,
      xml: {
        name: 'xmlElement',
        namespace: 'http://example.com',
        prefix: 'ex',
        attribute: false,
        wrapped: true,
      },
      externalDocs: {
        description: 'External documentation',
        url: 'https://example.com/docs',
      },
      example: { exampleValue: 'test' },
      examples: [{ example1: 'value1' }, { example2: 'value2' }],
      'x-tags': ['tag1', 'tag2'],
      maxItems: 10,
      minItems: 1,
      uniqueItems: true,
      prefixItems: [{ type: 'string' }, { type: 'number' }],
      maxProperties: 20,
      minProperties: 2,
      required: ['prop1', 'prop2', 'prop3', 'prop4'],
      properties: {
        prop1: {
          type: 'string',
          description: 'Enhanced prop1 description',
          minLength: 3,
        },
        prop2: { type: 'number' },
        prop3: { type: 'boolean' },
        prop4: { type: 'array', items: { type: 'string' } },
      },
      additionalProperties: {
        type: 'string',
      },
      patternProperties: {
        '^S_': { type: 'string' },
        '^I_': { type: 'integer' },
      },
      maxLength: 100,
      minLength: 5,
      pattern: '^[a-zA-Z]+$',
      multipleOf: 2.5,
      maximum: 1000,
      exclusiveMaximum: 999,
      minimum: 0,
      exclusiveMinimum: true,
      'x-scalar-ignore': false,
      'x-internal': true,
      'x-variable': 'variableName',
      'x-enum-descriptions': {
        value1: 'Description for value1',
        value2: 'Description for value2',
      },
      'x-enum-varnames': ['VALUE_ONE', 'VALUE_TWO'],
    })
  })

  // See issue #9674.
  it('drops a discriminator inherited from an allOf member', () => {
    const dog = coerceValue(SchemaObjectSchema, {
      allOf: [
        {
          type: 'object',
          discriminator: {
            propertyName: 'petType',
            mapping: { DOG: '#/components/schemas/Dog', CAT: '#/components/schemas/Cat' },
          },
          properties: { petType: { type: 'string' } },
        },
        { type: 'object', properties: { breed: { type: 'string' } } },
      ],
    })

    const result = mergeAllOfSchemas(dog)

    expect('discriminator' in result).toBe(false)
    expect(result).toMatchObject({
      properties: { petType: { type: 'string' }, breed: { type: 'string' } },
    })
  })

  it('keeps a discriminator the schema declares itself next to allOf', () => {
    const workingDog = coerceValue(SchemaObjectSchema, {
      discriminator: {
        propertyName: 'job',
        mapping: { GUIDE: '#/components/schemas/GuideDog' },
      },
      properties: { job: { type: 'string' } },
      allOf: [{ type: 'object', properties: { petType: { type: 'string' } } }],
    })

    const result = mergeAllOfSchemas(workingDog)

    expect(result.discriminator).toEqual({
      propertyName: 'job',
      mapping: { GUIDE: '#/components/schemas/GuideDog' },
    })
  })

  it('does not infinitely recurse on schemas with self-referencing $ref items', () => {
    // Reproduces a real crash observed against schemas like:
    //
    //   ValidationIssue:
    //     type: object
    //     properties:
    //       code: { type: string }
    //       children:
    //         type: array
    //         items: { $ref: '#/components/schemas/ValidationIssue' }
    //
    // The recursive $ref drives mergeItems ↔ mergePropertiesIntoResult into
    // infinite mutual recursion. The workspace-store dereferencer exposes
    // resolved refs as `{ $ref, '$ref-value': <node> }` so we mirror that
    // shape here to exercise the resolve.schema() path that the production
    // bug took.
    const issue: any = {
      type: 'object',
      properties: {
        code: { type: 'string' },
      },
    }
    issue.properties.children = {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ValidationIssue',
        '$ref-value': issue,
      },
    }

    expect(() => mergeAllOfSchemas({ allOf: [issue, issue] } as any)).not.toThrow()
  })

  it('does not infinitely recurse on schemas with a self-referencing $ref object property', () => {
    // The sibling case of the array-items cycle above: a schema that points
    // back at itself through a plain object property rather than array items.
    //
    //   TreeNode:
    //     type: object
    //     properties:
    //       value: { type: string }
    //       parent: { $ref: '#/components/schemas/TreeNode' }
    //
    // Here the recursion lives entirely inside mergePropertiesIntoResult's
    // object-merge branch and never passes through mergeItems, so it needs its
    // own cycle guard keyed on the property's $ref.
    const node: any = {
      type: 'object',
      properties: {
        value: { type: 'string' },
      },
    }
    node.properties.parent = {
      $ref: '#/components/schemas/TreeNode',
      '$ref-value': node,
    }

    expect(() => mergeAllOfSchemas({ allOf: [node, node] } as any)).not.toThrow()
  })

  it('does not infinitely recurse when a self-reference is reached through allOf', () => {
    // Reproduces https://github.com/scalar/scalar/issues/9570: a schema whose
    // self-reference sits inside an `allOf` branch (common output from tools
    // that model TypeScript inheritance as `allOf`).
    //
    //   Node:
    //     allOf:
    //       - { type: object, properties: { name: { type: string } } }
    //       - { type: object, properties: { self: { $ref: '#/components/schemas/Node' } } }
    //
    // `self` only ever appears as a brand-new property, so it took the
    // unguarded new-property branch and recursed forever.
    const node: any = {
      allOf: [
        { type: 'object', properties: { name: { type: 'string' } } },
        {
          type: 'object',
          properties: {
            self: { $ref: '#/components/schemas/Node', '$ref-value': null },
          },
        },
      ],
    }
    node.allOf[1].properties.self['$ref-value'] = node

    expect(() => mergeAllOfSchemas(node)).not.toThrow()
  })
})
