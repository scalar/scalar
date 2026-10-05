import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'

import { resolveSchemaWithAnnotations } from './resolve-schema-with-annotations'

describe('resolve-schema-with-annotations', () => {
  it.each([false, true])('resolves a reference and its annotation in either order (reversed: %s)', (reversed) => {
    const value: SchemaObject = { type: 'string', enum: ['one', 'two'] }
    const reference = { $ref: '#/components/schemas/Choice', '$ref-value': value }
    const annotation = { description: 'Choose a value.' }
    const schema = coerceValue(SchemaObjectSchema, {
      allOf: reversed ? [annotation, reference] : [reference, annotation],
    })
    const original = structuredClone(schema)
    expect(resolveSchemaWithAnnotations(schema)).toStrictEqual({
      ...value,
      $ref: reference.$ref,
      description: annotation.description,
    })
    expect(schema).toStrictEqual(original)
  })

  it('retains wrapper annotations while resolving nested wrappers', () => {
    expect(
      resolveSchemaWithAnnotations(
        coerceValue(SchemaObjectSchema, {
          description: 'Outer description',
          allOf: [{ allOf: [{ type: 'integer' }, { description: 'Inner description' }] }, { title: 'Count' }],
        }),
      ),
    ).toStrictEqual({ type: 'integer', description: 'Outer description', title: 'Count' })
  })

  it('keeps compositions with multiple value schemas intact', () => {
    const schema = coerceValue(SchemaObjectSchema, { allOf: [{ type: 'integer', minimum: 2 }, { maximum: 5 }] })
    expect(resolveSchemaWithAnnotations(schema)).toStrictEqual(schema)
  })

  it.each(['oneOf', 'anyOf'] as const)('preserves %s alternatives when resolving annotation wrappers', (keyword) => {
    const schema = coerceValue(SchemaObjectSchema, {
      [keyword]: [{ type: 'string' }, { type: 'integer' }],
    })
    expect(resolveSchemaWithAnnotations(schema)).toStrictEqual(schema)
    expect(
      resolveSchemaWithAnnotations(
        coerceValue(SchemaObjectSchema, { allOf: [schema, { description: 'Choose a value.' }] }),
      ),
    ).toStrictEqual({ [keyword]: schema[keyword], description: 'Choose a value.' })
  })

  it('keeps validation siblings on an outer schema intact', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: { mode: { type: 'string' } },
      allOf: [{ required: ['mode'] }],
    })
    expect(resolveSchemaWithAnnotations(schema)).toStrictEqual(schema)
  })

  it('keeps annotation-only compositions intact', () => {
    const schema = coerceValue(SchemaObjectSchema, { allOf: [{ description: 'A description' }, { title: 'A title' }] })
    expect(resolveSchemaWithAnnotations(schema)).toStrictEqual(schema)
    expect(resolveSchemaWithAnnotations(undefined)).toBeUndefined()
  })

  it('terminates on a circular referenced wrapper', () => {
    const document = createMagicProxy({
      components: {
        schemas: {
          Recursive: coerceValue(SchemaObjectSchema, { allOf: [{ $ref: '#/components/schemas/Recursive' }] }),
        },
      },
    })
    const result = resolveSchemaWithAnnotations(document.components.schemas.Recursive)
    expect(result && 'type' in result ? result.type : undefined).toBeUndefined()
  })
})
