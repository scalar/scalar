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
})
