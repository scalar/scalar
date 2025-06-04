import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'
import { mergeAllOfSchemas } from './merge-all-of-schemas'

type SchemaObject = OpenAPIV3_1.SchemaObject

describe('mergeAllOfSchemas', () => {
  it('returns empty object for empty or invalid input', () => {
    expect(mergeAllOfSchemas([])).toEqual({})
    expect(mergeAllOfSchemas(null as any)).toEqual({})
    expect(mergeAllOfSchemas(undefined as any)).toEqual({})
    expect(mergeAllOfSchemas('not an array' as any)).toEqual({})
  })

  it('merges basic properties from multiple schemas', () => {
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    })
  })

  it('handles nested allOf schemas', () => {
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    })
  })

  it('combines required fields from multiple schemas', () => {
    const schemas: SchemaObject[] = [
      {
        required: ['name'],
      },
      {
        required: ['age'],
      },
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      required: ['name', 'age'],
    })
  })

  it('preserves first type and description when duplicates exist', () => {
    const schemas: SchemaObject[] = [
      {
        type: 'object',
        description: 'First description',
      },
      {
        type: 'array', // Should be ignored
        description: 'Second description', // Should be ignored
      },
    ] satisfies SchemaObject[]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      type: 'object',
      description: 'First description',
    })
  })

  it('merges deeply nested schema structures', () => {
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
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
    const schemas: SchemaObject[] = [
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

    expect(mergeAllOfSchemas(schemas)).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    })
  })

  it('merges allOf schemas within object items', () => {
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
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
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
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
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
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

    expect(mergeAllOfSchemas([schema])).toEqual({
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
    const schemas: SchemaObject[] = [
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
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      properties: {
        a: { type: 'string', example: 'foo' },
        b: { type: 'number', example: 42 },
        c: { type: 'boolean', example: true },
        d: { type: 'integer', example: 7 },
        e: { type: 'array', items: { type: 'string' }, example: ['x', 'y'] },
      },
    })
  })

  it('preserves title and name from first schema that has them', () => {
    const schemas: SchemaObject[] = [
      {
        title: 'Planet',
        name: 'PlanetModel',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      {
        title: 'Should be ignored',
        name: 'ShouldBeIgnored',
        type: 'object',
        properties: {
          size: { type: 'number' },
        },
      },
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      title: 'Planet',
      name: 'PlanetModel',
      type: 'object',
      properties: {
        name: { type: 'string' },
        size: { type: 'number' },
      },
    })
  })
})
