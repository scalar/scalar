import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getResponseVariants } from './get-response-variants'

describe('get-response-variants', () => {
  it('numbers unnamed alternatives and starts at the first non-null variant', () => {
    expect(
      getResponseVariants({
        schema: coerceValue(SchemaObjectSchema, {
          anyOf: [{ type: 'null' }, { type: 'object' }, { type: 'object' }],
        }),
      }),
    ).toStrictEqual({
      composition: 'anyOf',
      examples: { '0': { summary: 'null 1' }, '1': { summary: 'object 2' }, '2': { summary: 'object 3' } },
      defaultKey: '1',
    })
  })

  it.each([
    undefined,
    {},
    { type: 'object' },
    { anyOf: [] },
    { oneOf: [{ type: 'string' }] },
    { allOf: [{ type: 'object' }, { type: 'object' }] },
    { anyOf: [{ $ref: '#/missing' }, { type: 'object' }] },
  ])('omits a picker without multiple resolved union branches: %j', (schema) => {
    expect(
      getResponseVariants(schema ? { schema: coerceValue(SchemaObjectSchema, schema) } : undefined),
    ).toBeUndefined()
  })

  it.each([
    { example: null },
    { examples: [false] },
    { default: '' },
    { const: 0 },
    { enum: ['explicit'] },
    { enum: [] },
  ])('omits a picker for an explicit schema value or enum constraint: %j', (sample) => {
    expect(
      getResponseVariants({
        schema: coerceValue(SchemaObjectSchema, {
          ...sample,
          anyOf: [{ type: 'string' }, { type: 'number' }],
        }),
      }),
    ).toBeUndefined()
  })

  it('preserves branch indexes when a reference cannot be resolved', () => {
    expect(
      getResponseVariants({
        schema: coerceValue(SchemaObjectSchema, {
          oneOf: [{ $ref: '#/missing' }, { title: 'Phone', type: 'object' }, { title: 'Email', type: 'object' }],
        }),
      }),
    ).toStrictEqual({
      composition: 'oneOf',
      examples: { '1': { summary: 'Phone' }, '2': { summary: 'Email' } },
      defaultKey: '1',
    })
  })
})
