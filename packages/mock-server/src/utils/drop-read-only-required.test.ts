import Ajv2020 from 'ajv/dist/2020.js'
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

  it('recognizes read-only annotations in nested property allOf schemas', () => {
    const schema = {
      type: 'object',
      required: ['id', 'name'],
      properties: {
        id: { allOf: [{ type: 'integer' }, { allOf: [{ readOnly: true }] }] },
        name: { type: 'string' },
      },
    }
    const original = structuredClone(schema)
    const validate = new Ajv2020({ strict: false }).compile(dropReadOnlyRequired(schema) as object)

    expect(validate({ name: 'Fido' })).toBe(true)
    expect(validate({})).toBe(false)
    expect(validate({ id: 'invalid', name: 'Fido' })).toBe(false)
    expect(schema).toStrictEqual(original)
  })

  it.each(['anyOf', 'oneOf', 'if', 'then', 'else'])('does not infer unconditional readOnly from %s', (keyword) => {
    const schema = {
      required: ['id'],
      properties: {
        id: { [keyword]: keyword === 'anyOf' || keyword === 'oneOf' ? [{ readOnly: true }] : { readOnly: true } },
      },
    }

    expect(dropReadOnlyRequired(schema)).toStrictEqual(schema)
  })

  it('shares read-only names with dependent schemas without relaxing nested objects', () => {
    const schema = {
      type: 'object',
      properties: { id: { readOnly: true }, name: { type: 'string' } },
      dependentSchemas: {
        name: {
          required: ['id', 'owner'],
          properties: { owner: { type: 'object', required: ['id'] } },
        },
      },
    }
    const validate = new Ajv2020({ strict: false }).compile(dropReadOnlyRequired(schema) as object)

    expect(validate({ name: 'Fido', owner: { id: 1 } })).toBe(true)
    expect(validate({ name: 'Fido', owner: {} })).toBe(false)
    expect(validate({ name: 'Fido' })).toBe(false)
    expect(validate({})).toBe(true)
  })

  it('preserves conditional predicates while relaxing both resulting branches', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'integer', readOnly: true } },
      if: { required: ['id'], properties: { id: { readOnly: true } } },
      // biome-ignore lint/suspicious/noThenProperty: JSON Schema uses then to define the matching conditional branch.
      then: { required: ['id', 'audit'] },
      else: { required: ['id', 'draft'] },
    }
    const original = structuredClone(schema)
    const validate = new Ajv2020({ strict: false }).compile(dropReadOnlyRequired(schema) as object)

    expect(validate({ draft: true })).toBe(true)
    expect(validate({ audit: true })).toBe(false)
    expect(validate({ id: 1, audit: true })).toBe(true)
    expect(validate({ id: 1, draft: true })).toBe(false)
    expect(validate({})).toBe(false)
    expect(schema).toStrictEqual(original)
  })
})
