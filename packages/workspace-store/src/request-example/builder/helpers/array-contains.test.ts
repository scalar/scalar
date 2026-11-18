import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'

import { generateContainsArray } from './array-contains'
import { getExampleFromSchema } from './get-example-from-schema'

const numbers = {
  type: 'array',
  items: { type: 'integer' },
  minItems: 3,
  maxItems: 3,
  contains: { const: 2 },
  minContains: 1,
  maxContains: 1,
}

describe('array-contains', () => {
  it.each([
    { changes: {}, expected: [2, 1, 1] },
    { changes: { uniqueItems: true }, expected: [2, 1, 3] },
    { changes: { minContains: 2, maxContains: 2 }, expected: [2, 2, 1] },
    { changes: { minContains: 0, maxContains: 0 }, expected: [1, 1, 1] },
    { changes: { contains: false, minContains: 0 }, expected: [1, 1, 1] },
    { changes: { contains: true, maxContains: 3 }, expected: [1, 1, 1] },
    { changes: { items: { enum: [2, 4] } }, expected: [2, 4, 4] },
    { changes: { items: { type: 'integer', minimum: 2, maximum: 3 } }, expected: [2, 3, 3] },
    { changes: { items: { type: 'string' }, contains: { enum: ['x', 'y'] } }, expected: ['x', '', ''] },
    { changes: { items: { type: 'boolean' }, contains: { const: false } }, expected: [false, true, true] },
    { changes: { items: true }, expected: [2, null, null] },
    { changes: { items: {} }, expected: [2, null, null] },
    { changes: { items: undefined }, expected: [2, null, null] },
    { changes: { prefixItems: [{ const: 2 }] }, expected: [2, 1, 1] },
    { changes: { prefixItems: [{ const: 1 }], minItems: 0, maxItems: 2 }, expected: [1, 2] },
    { changes: { prefixItems: [{ const: 1 }, { const: 1 }] }, expected: [1, 1, 2] },
    { changes: { prefixItems: [{ const: 1 }, { const: 2 }, { const: 3 }], items: false }, expected: [1, 2, 3] },
    { changes: { maxItems: 0, minItems: 0, minContains: 0 }, expected: [] },
  ])('generates a valid direct array: $changes', ({ changes, expected }) => {
    const schema = { ...numbers, ...changes }
    const value = getExampleFromSchema(schema as SchemaObject)
    expect(value).toStrictEqual(expected)
    const validate = new Ajv2020({ strict: false }).compile(schema)
    expect({ valid: validate(value), errors: validate.errors }).toStrictEqual({ valid: true, errors: null })
  })

  it.each([
    { changes: { items: { const: 1 } }, expected: [] },
    { changes: { contains: false }, expected: [] },
    { changes: { contains: true }, expected: [1] },
    { changes: { items: { const: 2 } }, expected: [2] },
    { changes: { items: { enum: [1, 2] }, uniqueItems: true }, expected: [2, 1] },
    { changes: { prefixItems: [{ const: 2 }, { const: 2 }] }, expected: [2] },
    { changes: { prefixItems: [{ const: 2 }], items: false }, expected: [2] },
    { changes: { items: { type: 'integer', example: 1 } }, expected: [1, 1, 1] },
    { changes: { items: { example: 1 } }, expected: [1, 1, 1] },
  ])('returns a partial example when simple constraints cannot be met: $changes', ({ changes, expected }) => {
    expect(getExampleFromSchema({ ...numbers, ...changes } as SchemaObject)).toStrictEqual(expected)
  })

  it.each([{ example: 'user' }, { examples: ['user'] }])(
    'preserves authored item values when contains cannot match: %j',
    (items) => {
      expect(
        getExampleFromSchema({
          type: 'array',
          items: { type: 'string', ...items },
          contains: { const: 'admin' },
        } as SchemaObject),
      ).toStrictEqual(['user'])
    },
  )

  it('preserves authored matches beyond maxContains while respecting length and uniqueness', () => {
    expect(getExampleFromSchema({ ...numbers, items: { type: 'integer', example: 2 } } as SchemaObject)).toStrictEqual([
      2, 2, 2,
    ])
    expect(
      getExampleFromSchema({ ...numbers, items: { type: 'integer', example: 2 }, uniqueItems: true } as SchemaObject),
    ).toStrictEqual([2])
  })

  it.each([{ example: [7] }, { examples: [[7]] }, { default: [7] }])('preserves authored array values: %j', (value) => {
    expect(getExampleFromSchema({ ...numbers, ...value } as SchemaObject)).toStrictEqual([7])
  })

  it.each([
    { options: { openapiVersion: '3.0.4' }, expected: [1, 1, 1] },
    { options: { openapiVersion: '3.1.2' }, expected: [1, 1, 1] },
    { options: { jsonSchemaDialect: 'http://json-schema.org/draft-07/schema#' }, expected: [2, 1, 1] },
    { options: { jsonSchemaDialect: 'urn:custom' }, expected: [1, 1, 1] },
    { options: { openapiVersion: '3.1.2', originalOpenapiVersion: '3.0.4' }, expected: [1, 1, 1] },
  ])('honors version and dialect without leaking cached values: $options', ({ options, expected }) => {
    const schema = { ...numbers, minContains: 0, maxContains: 0 } as SchemaObject
    expect(getExampleFromSchema(schema, options)).toStrictEqual(expected)
    expect(getExampleFromSchema(schema)).toStrictEqual([1, 1, 1])
  })

  it('uses a resource dialect instead of the document default', () => {
    const schema = { ...numbers, $schema: 'http://json-schema.org/draft-07/schema#', minContains: 0, maxContains: 0 }
    expect(getExampleFromSchema(schema as SchemaObject, { jsonSchemaDialect: 'urn:custom' })).toStrictEqual([2, 1, 1])
  })

  it('retains contains and boolean item keywords through schema coercion', () => {
    const schema = coerceValue(SchemaObjectSchema, { ...numbers, items: true, prefixItems: [false] })
    expect(schema).toStrictEqual({
      ...numbers,
      items: true,
      prefixItems: [false],
      contains: { const: 2, __scalar_: '' },
    })
    expect(getExampleFromSchema(coerceValue(SchemaObjectSchema, numbers))).toStrictEqual([2, 1, 1])
  })

  it.each([
    { ...numbers, contains: { type: 'object', properties: { id: { const: 2 } } } },
    { ...numbers, contains: { pattern: '^x' } },
    { ...numbers, items: { type: ['integer'] } },
    { ...numbers, contains: { const: { id: 2 } } },
    { ...numbers, items: { anyOf: [{ type: 'integer' }, { type: 'string' }] } },
    { ...numbers, allOf: [{ contains: { const: 3 } }] },
    { ...numbers, $ref: '#/numbers' },
    { ...numbers, contains: { $schema: 'urn:custom', const: 2 } },
  ])('leaves unsupported combinations to the existing generator: %j', (schema) => {
    expect(generateContainsArray(schema, [], () => 1, 'modern')).toBeUndefined()
  })

  it('bounds generation for very large array minima', () => {
    const schema = { ...numbers, minItems: Number.MAX_SAFE_INTEGER, maxItems: Number.MAX_SAFE_INTEGER, maxContains: 1 }
    const result = getExampleFromSchema(schema as SchemaObject) as number[]
    expect(result.length).toBe(999)
    expect(result.filter((value) => value === 2)).toStrictEqual([2])
  })
})
