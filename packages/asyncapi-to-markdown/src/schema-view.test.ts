import { describe, expect, it } from 'vitest'

import { createSchemaView } from './schema-view'

describe('schema-view', () => {
  it('caches safe display normalization without modifying the schema', () => {
    const schema = { allOf: [{ type: 'string' }], description: 'A value' }
    const view = createSchemaView()
    const result = view(schema)
    expect(result).toStrictEqual({ type: 'string', description: 'A value' })
    expect(view(schema)).toBe(result)
    expect(schema).toStrictEqual({ allOf: [{ type: 'string' }], description: 'A value' })
  })

  it('simplifies nullable and primitive unions but preserves overlapping oneOf branches', () => {
    const view = createSchemaView()
    expect(view({ anyOf: [{ type: 'string' }, { type: 'null' }] })).toStrictEqual({ type: ['string', 'null'] })
    const overlapping = { oneOf: [{ type: 'integer' }, { type: 'number' }] }
    expect(view(overlapping)).toBe(overlapping)
    const constrained = { allOf: [{ type: 'string' }], minLength: 2 }
    expect(view(constrained)).toBe(constrained)
  })
  it('normalizes constrained nullable strings, objects, arrays and enums without dropping constraints', () => {
    const view = createSchemaView()
    for (const branch of [
      { type: 'string', format: 'date-time', minLength: 1 },
      { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      { type: 'array', items: { type: 'string' }, minItems: 1 },
    ]) {
      expect(view({ anyOf: [branch, { type: 'null' }] })).toStrictEqual({ ...branch, type: [branch.type, 'null'] })
    }
    expect(view({ oneOf: [{ type: 'string', enum: ['A'] }, { type: 'null' }] })).toStrictEqual({
      type: ['string', 'null'],
      enum: ['A', null],
    })
    const conditional = { anyOf: [{ type: 'string', not: { const: null } }, { type: 'null' }] }
    expect(view(conditional)).toBe(conditional)
  })
  it('retains nullable compositions with intersecting const and enum constraints', () => {
    const schema = { anyOf: [{ type: 'string', const: 'A', enum: ['A', 'B'] }, { type: 'null' }] }
    expect(createSchemaView()(schema)).toBe(schema)
  })
})
