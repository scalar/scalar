import { describe, expect, it } from 'vitest'

import { dropReadOnlyRequired } from './drop-read-only-required'

describe('drop-read-only-required', () => {
  it('removes read-only properties from required', () => {
    expect(
      dropReadOnlyRequired({
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'integer', readOnly: true }, name: { type: 'string' } },
      }),
    ).toStrictEqual({
      type: 'object',
      required: ['name'],
      properties: { id: { type: 'integer', readOnly: true }, name: { type: 'string' } },
    })
  })

  it('applies read-only properties declared in a sibling allOf member', () => {
    expect(
      dropReadOnlyRequired({
        allOf: [
          { type: 'object', properties: { id: { type: 'string', readOnly: true } } },
          { type: 'object', required: ['id', 'email'], properties: { email: { type: 'string' } } },
        ],
      }),
    ).toStrictEqual({
      allOf: [
        { type: 'object', properties: { id: { type: 'string', readOnly: true } } },
        { type: 'object', required: ['email'], properties: { email: { type: 'string' } } },
      ],
    })
  })

  it('applies parent read-only properties to union branches', () => {
    expect(
      dropReadOnlyRequired({
        properties: { id: { type: 'string', readOnly: true } },
        oneOf: [{ required: ['id', 'a'] }, { required: ['id', 'b'] }],
      }),
    ).toStrictEqual({
      properties: { id: { type: 'string', readOnly: true } },
      oneOf: [{ required: ['a'] }, { required: ['b'] }],
    })
  })

  it('handles nested objects and array items independently', () => {
    expect(
      dropReadOnlyRequired({
        type: 'object',
        required: ['items'],
        properties: {
          id: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'sku'],
              properties: { id: { type: 'string', readOnly: true }, sku: { type: 'string' } },
            },
          },
        },
      }),
    ).toStrictEqual({
      type: 'object',
      required: ['items'],
      properties: {
        id: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['sku'],
            properties: { id: { type: 'string', readOnly: true }, sku: { type: 'string' } },
          },
        },
      },
    })
  })

  it('does not let a nested read-only property relax its parent', () => {
    const schema = {
      type: 'object',
      required: ['id', 'owner'],
      properties: {
        id: { type: 'string' },
        owner: { type: 'object', properties: { id: { type: 'string', readOnly: true } } },
      },
    }

    expect(dropReadOnlyRequired(schema)).toStrictEqual(schema)
  })
})
