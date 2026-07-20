import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { foldStructuredBodyRows } from './fold-structured-body-rows'
import { getStructuredBodyRows } from './get-structured-body-rows'
import { getStructuredBodyCodec } from './structured-body-codec'

const schema: SchemaObject = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
    active: { type: 'boolean' },
    tags: { type: 'array', items: { type: 'string' } },
    meta: {
      type: 'object',
      properties: {
        created: { type: 'string' },
        count: { type: 'integer' },
      },
    },
  },
}

describe('foldStructuredBodyRows', () => {
  it('folds rows back into a typed nested object', () => {
    const folded = foldStructuredBodyRows(
      [
        { name: 'name', value: 'Ada' },
        { name: 'age', value: '36' },
        { name: 'active', value: 'true' },
        { name: 'tags', value: '["a","b"]' },
        { name: 'meta.created', value: '2020' },
        { name: 'meta.count', value: '2' },
      ],
      schema,
    )

    expect(folded).toEqual({
      name: 'Ada',
      age: 36,
      active: true,
      tags: ['a', 'b'],
      meta: { created: '2020', count: 2 },
    })
  })

  it('skips disabled rows, empty values, and unnamed rows', () => {
    const folded = foldStructuredBodyRows(
      [
        { name: 'name', value: 'Ada' },
        { name: 'age', value: '36', isDisabled: true },
        { name: 'active', value: '' },
        { name: '', value: 'orphan' },
      ],
      schema,
    )

    expect(folded).toEqual({ name: 'Ada' })
  })

  it('keeps string-typed values as text', () => {
    const folded = foldStructuredBodyRows([{ name: 'name', value: '5' }], schema)
    expect(folded).toEqual({ name: '5' })
  })

  it('best-effort coerces undeclared keys', () => {
    const folded = foldStructuredBodyRows(
      [
        { name: 'extraNumber', value: '42' },
        { name: 'extraText', value: 'hello' },
      ],
      schema,
    )
    expect(folded).toEqual({ extraNumber: 42, extraText: 'hello' })
  })

  it('treats dotted names on undeclared prefixes as literal keys', () => {
    const folded = foldStructuredBodyRows([{ name: 'user.email', value: 'a@b.c' }], schema)
    expect(folded).toEqual({ 'user.email': 'a@b.c' })
  })

  it('round-trips a JSON body through rows and back', () => {
    const codec = getStructuredBodyCodec('application/json')!
    const original = {
      name: 'Ada',
      age: 36,
      active: false,
      tags: ['a'],
      meta: { created: '2020', count: 1 },
    }

    const rows = getStructuredBodyRows(codec.parse(codec.stringify(original)), schema)
    const folded = foldStructuredBodyRows(rows, schema)

    expect(codec.parse(codec.stringify(folded))).toEqual(original)
  })

  it('round-trips a YAML body through rows and back', () => {
    const codec = getStructuredBodyCodec('application/yaml')!
    const original = {
      name: 'Ada',
      age: 36,
      active: true,
      meta: { created: '2020' },
    }

    const rows = getStructuredBodyRows(codec.parse(codec.stringify(original)), schema)
    const folded = foldStructuredBodyRows(rows, schema)

    expect(codec.parse(codec.stringify(folded))).toEqual(original)
  })
})

describe('getStructuredBodyCodec', () => {
  it('returns the JSON codec for json content types', () => {
    expect(getStructuredBodyCodec('application/json')?.language).toBe('json')
    expect(getStructuredBodyCodec('application/json; charset=utf-8')?.language).toBe('json')
    expect(getStructuredBodyCodec('application/vnd.api+json')?.language).toBe('json')
  })

  it('returns the YAML codec for yaml content types', () => {
    expect(getStructuredBodyCodec('application/yaml')?.language).toBe('yaml')
    expect(getStructuredBodyCodec('application/x-yaml')?.language).toBe('yaml')
    expect(getStructuredBodyCodec('text/yaml')?.language).toBe('yaml')
    expect(getStructuredBodyCodec('application/openapi+yaml')?.language).toBe('yaml')
  })

  it('returns undefined for everything else', () => {
    expect(getStructuredBodyCodec('text/plain')).toBeUndefined()
    expect(getStructuredBodyCodec('multipart/form-data')).toBeUndefined()
    expect(getStructuredBodyCodec('application/x-www-form-urlencoded')).toBeUndefined()
    expect(getStructuredBodyCodec('application/xml')).toBeUndefined()
  })
})
