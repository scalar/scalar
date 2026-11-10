import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getHeaderSchema } from './get-header-schema'

describe('get-header-schema', () => {
  it('overrides recursive compositions without changing the original schema', () => {
    const schema = coerceValue(SchemaObjectSchema, { type: 'string', examples: ['schema sample'] })
    schema.anyOf = [schema]

    const result = getHeaderSchema({ schema, example: 'header sample' })

    expect(result?.examples).toStrictEqual([{ value: 'header sample' }])
    expect(result?.anyOf?.[0]).toBe(result)
    expect(schema.examples).toStrictEqual(['schema sample'])
    expect(schema.anyOf[0]).toBe(schema)
  })

  it('keeps shared composition branches shared without changing nested values', () => {
    const property = coerceValue(SchemaObjectSchema, { type: 'string', example: 'property sample' })
    const items = coerceValue(SchemaObjectSchema, { type: 'string', example: 'item sample' })
    const branch = coerceValue(SchemaObjectSchema, {
      type: 'object',
      examples: [{ session: 'schema sample' }],
      properties: { session: property, values: { type: 'array', items } },
    })
    const schema = coerceValue(SchemaObjectSchema, { oneOf: [branch, branch] })

    const result = getHeaderSchema({ schema, example: { session: 'header sample' } })

    expect(result?.oneOf?.[0]).toBe(result?.oneOf?.[1])
    expect(branch.examples).toStrictEqual([{ session: 'schema sample' }])
    expect(property.example).toBe('property sample')
    expect(items.example).toBe('item sample')
  })
})
