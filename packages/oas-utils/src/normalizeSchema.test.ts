import { describe, expect, it } from 'vitest'

import { normalizeSchema } from './normalizeSchema'

describe('normalizeSchema', () => {
  it('preserves normalized schema', () => {
    const schema = Object.freeze({
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              baz: { type: 'string' },
            },
          },
        },
        qux: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
        },
        quux: {
          allOf: [{ type: 'string' }, { maxLength: 16 }],
        },
      },
    })
    expect(normalizeSchema(schema)).toMatchObject(schema)
  })

  it('normalizes allOf with a single item', () => {
    const schema = Object.freeze({
      allOf: [{ type: 'string' }],
      readOnly: true,
    })
    expect(normalizeSchema(schema)).toMatchObject({
      type: 'string',
      readOnly: true,
    })
  })

  it('normalizes single-value enums to const', () => {
    const schema = Object.freeze({
      type: 'string',
      enum: ['foo'],
      readOnly: true,
    })
    expect(normalizeSchema(schema)).toMatchObject({
      type: 'string',
      const: 'foo',
      readOnly: true,
    })
  })

  it('normalizes enums with description', () => {
    const schema = Object.freeze({
      type: 'string',
      anyOf: [
        { enum: ['foo'], description: 'Foo' },
        { enum: ['bar'], description: 'Bar' },
      ],
    })
    expect(normalizeSchema(schema)).toMatchObject({
      type: 'string',
      anyOf: [
        { const: 'foo', description: 'Foo' },
        { const: 'bar', description: 'Bar' },
      ],
    })
  })
})
