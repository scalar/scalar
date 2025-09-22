import { bench, describe } from 'vitest'

import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getExampleFromSchema } from './get-example-from-schema'

// A deliberately complex schema exercising objects, arrays, allOf/anyOf/oneOf,
// patternProperties, additionalProperties with x-additionalPropertiesName, enums,
// formats, minimums, xml wrappers, and nested combinations.
const complexSchema = {
  type: 'object',
  required: ['id', 'entries'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    // Map-like metadata with named additional properties
    metadata: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        'x-additionalPropertiesName': 'meta',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
    // Arbitrary configuration keys by regex
    config: {
      type: 'object',
      patternProperties: {
        '^[A-Z_]+$': { type: 'string' },
      },
    },
    // Main data: array of complex entries
    entries: {
      type: 'array',
      xml: { wrapped: true },
      items: {
        allOf: [
          {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['A', 'B', 'C'] },
              id: { type: 'integer', minimum: 1 },
            },
          },
          {
            type: 'object',
            properties: {
              // Union payloads
              payload: {
                oneOf: [
                  {
                    type: 'object',
                    properties: {
                      a1: { type: 'number', minimum: 0 },
                      a2: { type: 'string', format: 'email' },
                    },
                  },
                  {
                    type: 'array',
                    items: { type: 'string', examples: ['v1', 'v2'] },
                  },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        patternProperties: {
                          '^[a-z]+$': {
                            type: 'object',
                            properties: {
                              value: { type: 'number', minimum: 0 },
                              ts: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            type: 'object',
            properties: {
              tags: { type: 'array', items: { type: 'string' } },
              related: {
                type: 'array',
                items: {
                  allOf: [
                    {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', minimum: 1 },
                        link: {
                          anyOf: [{ type: 'string', format: 'uri', example: 'https://example.com' }, { type: 'null' }],
                        },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        flags: { type: 'array', items: { type: 'boolean' } },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  },
} satisfies OpenAPIV3_1.SchemaObject

describe('bench:getExampleFromSchema', () => {
  bench('complex schema generation', () => {
    // Measure only the example generation step
    getExampleFromSchema(complexSchema)
  })
})
