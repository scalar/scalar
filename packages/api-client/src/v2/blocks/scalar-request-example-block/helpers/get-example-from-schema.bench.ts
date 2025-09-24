import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { bench, describe } from 'vitest'

import { getExampleFromSchema } from '@/v2/blocks/scalar-request-example-block/helpers/get-example-from-schema'

// A deliberately complex schema exercising objects, arrays, allOf/anyOf/oneOf,
// patternProperties, additionalProperties with x-additionalPropertiesName, enums,
// formats, minimums, xml wrappers, and nested combinations.
const complexSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', format: 'int64' },
    name: { type: 'string' },
    tag: { type: 'string' },
    releaseDate: { type: 'string', format: 'date-time' },
    available: { type: 'boolean' },
    price: { type: 'number', format: 'float' },
    dimensions: {
      type: 'object',
      properties: {
        width: { type: 'number' },
        height: { type: 'number' },
        depth: { type: 'number' },
        unit: { type: 'string', enum: ['mm', 'cm', 'in'] },
      },
      required: ['width', 'height', 'depth', 'unit'],
    },
    manufacturer: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        country: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string' },
          },
          required: ['street', 'city', 'zipCode'],
        },
      },
      required: ['name', 'country', 'address'],
    },
    reviews: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          author: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          date: { type: 'string', format: 'date' },
        },
        required: ['author', 'rating', 'comment', 'date'],
      },
    },
    relatedProducts: {
      type: 'array',
      items: { type: 'integer', format: 'int64' },
    },
    specifications: {
      type: 'object',
      properties: {
        weight: { type: 'number' },
        powerConsumption: { type: 'string' },
        batteryLife: { type: 'string' },
        displaySize: { type: 'string' },
        memory: { type: 'string' },
        storage: { type: 'string' },
      },
    },
  },
  required: ['id', 'name', 'price'],
} satisfies SchemaObject

describe('bench:getExampleFromSchema', () => {
  bench('complex schema generation', () => {
    // Measure only the example generation step
    getExampleFromSchema(complexSchema)
  })
})
