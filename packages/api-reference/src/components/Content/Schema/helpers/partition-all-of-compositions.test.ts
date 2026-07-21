import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { partitionAllOfCompositions } from './partition-all-of-compositions'

describe('partitionAllOfCompositions', () => {
  it('returns a single object segment when there is no allOf', () => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } } as SchemaObject
    const { segments } = partitionAllOfCompositions(schema)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toEqual({ kind: 'object', schema })
  })

  it('keeps every oneOf group (not just the first) and interleaves them in source order', () => {
    const schema = {
      allOf: [
        { type: 'object', properties: { id: { type: 'string' } } },
        { oneOf: [{ required: ['effective_date_time'] }, { required: ['effective_period'] }] },
        { type: 'object', properties: { issued: { type: 'string' } } },
        { oneOf: [{ required: ['value_quantity'] }, { required: ['value_string'] }] },
      ],
    } as SchemaObject

    const { segments } = partitionAllOfCompositions(schema)

    expect(segments.map((s) => s.kind)).toEqual(['object', 'choice', 'object', 'choice'])
    // both choice groups survive (the merge would have dropped the second)
    expect(segments[1]).toMatchObject({ kind: 'choice', composition: 'oneOf', choiceIndex: 0 })
    expect(segments[3]).toMatchObject({ kind: 'choice', composition: 'oneOf', choiceIndex: 1 })
    // fields stay in place around the choices
    expect((segments[0] as any).schema.properties).toHaveProperty('id')
    expect((segments[2] as any).schema.properties).toHaveProperty('issued')
  })

  it('coalesces consecutive object members into one segment', () => {
    const schema = {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'string' } } },
      ],
    } as SchemaObject

    const { segments } = partitionAllOfCompositions(schema)
    expect(segments).toHaveLength(1)
    expect(segments[0].kind).toBe('object')
    expect((segments[0] as any).schema.properties).toEqual({ a: { type: 'string' }, b: { type: 'string' } })
  })

  it('flattens nested allOf while preserving order', () => {
    const schema = {
      allOf: [
        {
          allOf: [
            { type: 'object', properties: { id: { type: 'string' } } },
            { oneOf: [{ required: ['a'] }, { required: ['b'] }] },
          ],
        },
        { type: 'object', properties: { context: { type: 'string' } } },
      ],
    } as SchemaObject

    const { segments } = partitionAllOfCompositions(schema)
    expect(segments.map((s) => s.kind)).toEqual(['object', 'choice', 'object'])
    expect(segments[1]).toMatchObject({ choiceIndex: 0 })
  })

  it('drops pure-constraint members (not / if-then-else) from object segments', () => {
    const schema = {
      allOf: [
        { type: 'object', properties: { id: { type: 'string' } } },
        { not: { required: ['a', 'b'] } },
        { if: { required: ['x'] }, then: { required: ['y'] } },
      ],
    } as SchemaObject

    const { segments } = partitionAllOfCompositions(schema)
    expect(segments).toHaveLength(1)
    const merged = (segments[0] as any).schema
    expect(merged.properties).toHaveProperty('id')
    expect(merged.not).toBeUndefined()
    expect(merged.if).toBeUndefined()
  })
})
