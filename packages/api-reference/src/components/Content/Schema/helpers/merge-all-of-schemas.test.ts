import { describe, expect, it } from 'vitest'
import { mergeAllOfSchemas } from './merge-all-of-schemas'

describe('mergeAllOfSchemas', () => {
  it('returns empty object for empty or invalid input', () => {
    expect(mergeAllOfSchemas([])).toEqual({})
    expect(mergeAllOfSchemas(null as any)).toEqual({})
    expect(mergeAllOfSchemas(undefined as any)).toEqual({})
    expect(mergeAllOfSchemas('not an array' as any)).toEqual({})
  })

  it('merges basic properties from multiple schemas', () => {
    const schemas = [
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
    const schemas = [
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
    const schemas = [
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
    const schemas = [
      {
        type: 'object',
        description: 'First description',
      },
      {
        type: 'array', // Should be ignored
        description: 'Second description', // Should be ignored
      },
    ]

    expect(mergeAllOfSchemas(schemas)).toEqual({
      type: 'object',
      description: 'First description',
    })
  })

  it('merges deeply nested schema structures', () => {
    const schemas = [
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

    expect(mergeAllOfSchemas(schemas)).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    })
  })

  it('merges allOf schemas within array items', () => {
    const schemas = [
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
    const schemas = [
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
})
