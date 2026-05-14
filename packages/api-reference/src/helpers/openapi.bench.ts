import type {
  OperationObject,
  ParameterObject,
  ReferenceType,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { bench, describe } from 'vitest'

import {
  extractBodyDescriptions,
  extractBodyFieldNames,
  extractParameterDescriptions,
  extractParameterNames,
  extractSchemaDescriptions,
  extractSchemaFieldNames,
} from './openapi'

/** 20 query parameters with descriptions — a realistic upper bound for heavily-parameterised endpoints. */
const manyParameters: ReferenceType<ParameterObject>[] = Array.from({ length: 20 }, (_, i) => ({
  in: 'query' as const,
  name: `param${i}`,
  description: `Description for parameter ${i}. Explains what this query field controls and its valid range.`,
  required: i % 2 === 0,
  schema: { type: 'string' as const },
}))

/**
 * A schema with 15 top-level object properties, each containing 5 nested
 * properties. Exercises the two-level recursion in collectSchemaProperties.
 */
const deepBodySchema: SchemaObject = {
  type: 'object',
  properties: Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `field${i}`,
      {
        type: 'object',
        description: `Top-level description for field ${i}`,
        properties: Object.fromEntries(
          Array.from({ length: 5 }, (_, j) => [
            `nestedField${j}`,
            { type: 'string', description: `Nested description ${j} under field ${i}` },
          ]),
        ),
      },
    ]),
  ),
} as unknown as SchemaObject

const operationWithDeepBody: OperationObject = {
  summary: 'Create Item',
  requestBody: {
    content: {
      'application/json': { schema: deepBodySchema },
    },
  },
  responses: {},
}

/**
 * A schema that uses oneOf/anyOf composition, which triggers recursive
 * traversal of variant schemas in extractSchemaFieldNames.
 */
const compositionSchema: SchemaObject = {
  title: 'ComposedModel',
  oneOf: [
    {
      type: 'object',
      properties: {
        typeAField: { type: 'string', description: 'Field only in variant A' },
        sharedField: { type: 'string', description: 'Shared across variants' },
      },
    },
    {
      type: 'object',
      properties: {
        typeBField: { type: 'number', description: 'Field only in variant B' },
        sharedField: { type: 'string', description: 'Shared across variants' },
      },
    },
    {
      anyOf: [
        {
          type: 'object',
          properties: {
            nestedVariantField: { type: 'boolean', description: 'Field inside a nested anyOf' },
          },
        },
      ],
    },
  ],
} as unknown as SchemaObject

describe('extractParameterNames', () => {
  bench('20 parameters', () => {
    extractParameterNames(manyParameters)
  })
})

describe('extractParameterDescriptions', () => {
  bench('20 parameters', () => {
    extractParameterDescriptions(manyParameters)
  })
})

describe('extractBodyFieldNames', () => {
  bench('deep schema (15 top-level × 5 nested properties)', () => {
    extractBodyFieldNames(operationWithDeepBody)
  })
})

describe('extractBodyDescriptions', () => {
  bench('deep schema (15 top-level × 5 nested properties)', () => {
    extractBodyDescriptions(operationWithDeepBody)
  })
})

describe('extractSchemaFieldNames', () => {
  bench('composition schema (oneOf + anyOf variants)', () => {
    extractSchemaFieldNames(compositionSchema)
  })
})

describe('extractSchemaDescriptions', () => {
  bench('composition schema (oneOf + anyOf variants)', () => {
    extractSchemaDescriptions(compositionSchema)
  })
})
