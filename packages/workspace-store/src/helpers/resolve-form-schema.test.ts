import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'

import { resolveFormSchema } from './resolve-form-schema'

describe('resolve-form-schema', () => {
  it.each(['oneOf', 'anyOf'] as const)('exposes only the selected %s fields and their metadata', (keyword) => {
    const first = { type: 'object', properties: { name: { type: 'string' } } }
    const second = {
      type: 'object',
      properties: { count: { type: 'integer' } },
      required: ['count'],
      description: 'Count payload',
    }
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: { file: { [keyword]: [first, second] } },
      required: ['file'],
    })
    const original = structuredClone(schema)
    const result = resolveFormSchema(schema, { [`requestBody.file.${keyword}`]: 1 })
    expect(result && 'properties' in result ? result.properties?.file : undefined).toStrictEqual({
      [keyword]: coerceValue(SchemaObjectSchema, { [keyword]: [first, second] })[keyword],
      ...second,
      properties: { count: { type: 'integer' } },
    })
    expect(schema).toStrictEqual(original)
  })

  it('combines shared object fields and required names with the selected branch', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: { shared: { type: 'string' } },
      required: ['shared'],
      oneOf: [{ type: 'object', properties: { count: { type: 'integer' } }, required: ['count'] }],
    })
    const result = resolveFormSchema(schema)
    expect(result && 'properties' in result ? result.properties : undefined).toStrictEqual({
      shared: { type: 'string' },
      count: { type: 'integer' },
    })
    expect(result && 'required' in result ? result.required : undefined).toStrictEqual(['shared', 'count'])
  })

  it('uses the generator selection path for a union inside an annotated allOf wrapper', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      allOf: [{ oneOf: [{ type: 'string' }, { type: 'integer', description: 'Inner' }] }, { description: 'Outer' }],
    })
    const result = resolveFormSchema(schema, { 'requestBody.0.oneOf': 1 })
    expect(result && 'type' in result ? result.type : undefined).toBe('integer')
    expect(result?.description).toBe('Outer')
  })

  it('consumes a choice before visiting a union at the same path', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      oneOf: [{ type: 'boolean' }, { oneOf: [{ type: 'string' }, { type: 'integer' }] }],
    })
    const result = resolveFormSchema(schema, { 'requestBody.oneOf': 1 })
    expect(result && 'type' in result ? result.type : undefined).toBe('string')
  })

  it.each(['oneOf', 'anyOf'] as const)('keeps parent and selected %s numeric bounds', (keyword) => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'integer',
      minimum: 10,
      maximum: 100,
      [keyword]: [{ type: 'integer', minimum: 1, maximum: 50 }],
    })
    const result = resolveFormSchema(schema)
    expect(result && 'minimum' in result ? result.minimum : undefined).toBe(10)
    expect(result && 'maximum' in result ? result.maximum : undefined).toBe(50)
  })

  it('keeps numeric bounds when the chosen branch omits its type', () => {
    const result = resolveFormSchema(
      coerceValue(SchemaObjectSchema, {
        type: 'integer',
        minimum: 10,
        oneOf: [{ minimum: 1 }],
      }),
    )
    expect(result && 'minimum' in result ? result.minimum : undefined).toBe(10)
  })

  it('does not expand circular object references indefinitely', () => {
    const document = createMagicProxy({
      components: {
        schemas: {
          Node: { type: 'object' as const, properties: { next: { $ref: '#/components/schemas/Node' } } },
        },
      },
    })
    const result = resolveFormSchema(document.components.schemas.Node)
    expect(result && 'properties' in result ? result.properties?.next : undefined).toStrictEqual({
      type: 'object',
      $ref: '#/components/schemas/Node',
      properties: { next: { type: 'object', $ref: '#/components/schemas/Node', properties: undefined } },
    })
  })
})
