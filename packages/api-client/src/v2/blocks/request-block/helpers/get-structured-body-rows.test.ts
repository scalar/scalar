import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getStructuredBodyRows } from './get-structured-body-rows'

const schema: SchemaObject = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', description: 'The name' },
    age: { type: 'integer' },
    active: { type: 'boolean' },
    role: { type: 'string', enum: ['admin', 'user'] },
    tags: { type: 'array', items: { type: 'string' } },
    meta: {
      type: 'object',
      properties: {
        created: { type: 'string' },
      },
    },
  },
}

describe('getStructuredBodyRows', () => {
  it('builds one row per leaf with schema enrichment', () => {
    const rows = getStructuredBodyRows(
      {
        name: 'Ada',
        age: 36,
        active: true,
        tags: ['a'],
        meta: { created: '2020' },
        extra: 42,
      },
      schema,
    )

    expect(rows.map((row) => [row.name, row.value])).toEqual([
      ['name', 'Ada'],
      ['age', '36'],
      ['active', 'true'],
      // Declared in the schema but missing from the value: rendered as an empty input
      ['role', ''],
      // Arrays stay a single JSON-string leaf
      ['tags', '["a"]'],
      // Nested object schemas flatten into dotted leaves
      ['meta.created', '2020'],
      // Example-only keys come last
      ['extra', '42'],
    ])

    const byName = new Map(rows.map((row) => [row.name, row]))
    expect(byName.get('name')?.isRequired).toBe(true)
    expect(byName.get('name')?.description).toBe('The name')
    expect(byName.get('age')?.isRequired).toBe(false)
    expect(byName.get('role')?.schema).toEqual({
      type: 'string',
      enum: ['admin', 'user'],
    })
    expect(byName.get('meta.created')?.schema).toEqual({ type: 'string' })
    expect(byName.get('extra')?.schema).toBeUndefined()
  })

  it('renders null values as empty inputs', () => {
    const rows = getStructuredBodyRows({ name: null }, schema)
    expect(rows.find((row) => row.name === 'name')?.value).toBe('')
  })

  it('builds schema-only rows for an empty body', () => {
    const rows = getStructuredBodyRows({}, schema)
    expect(rows.map((row) => row.name)).toEqual(['name', 'age', 'active', 'role', 'tags', 'meta.created'])
    expect(rows.every((row) => row.value === '')).toBe(true)
  })

  it('returns no rows without an object value or object schema', () => {
    expect(getStructuredBodyRows('plain text')).toEqual([])
    expect(getStructuredBodyRows([1, 2, 3])).toEqual([])
    expect(getStructuredBodyRows(undefined)).toEqual([])
  })

  it('builds rows without a schema from the value alone', () => {
    const rows = getStructuredBodyRows({ a: 1, b: { c: 2 } })
    // Without a schema there is no signal to flatten, so objects stay JSON strings
    expect(rows.map((row) => [row.name, row.value])).toEqual([
      ['a', '1'],
      ['b', '{"c":2}'],
    ])
  })
})
