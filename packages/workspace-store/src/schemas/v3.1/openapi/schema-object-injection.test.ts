import { coerce, object, optional, string } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { generateSchema, generateSchemaObject } from '@/schemas/v3.1/openapi'
import { recursiveRef } from '@/schemas/v3.1/openapi/reference'

const defaultSchema = generateSchema(recursiveRef)

const document = (schemas: Record<string, unknown>): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: 'Maps', version: '1.0.0' },
  paths: {},
  components: { schemas },
})

const componentSchemas = (schema: Parameters<typeof coerce>[0], schemas: Record<string, unknown>): any =>
  (coerce(schema, document(schemas)) as any).components.schemas

describe('schema-object-injection', () => {
  it('uses the supplied Schema Object in every position that holds one', () => {
    // A deliberately minimal stand-in: if the document schema reaches for it, only `title` survives
    // coercion, which no default branch would do.
    const injected = generateSchema(recursiveRef, { schemaObject: object({ title: optional(string()) }) })

    const schemas = componentSchemas(injected, {
      Target: { type: 'object', title: 'kept', properties: { child: { type: 'string' } } },
    })

    expect(schemas.Target).toEqual({ title: 'kept' })
  })

  it('defaults to `generateSchemaObject` when none is supplied', () => {
    const explicit = generateSchema(recursiveRef, { schemaObject: generateSchemaObject(recursiveRef) })
    const schemas = { Target: { type: 'object', properties: { a: { type: 'string' } } } }

    expect(coerce(explicit, document(schemas))).toEqual(coerce(defaultSchema, document(schemas)))
  })

  it('leaves the default representation of a type-less schema in place', () => {
    // Not an endorsement — this is the behavior the injection point exists to let callers replace.
    // Every branch of the default Schema Object union keys off `type`, so a schema without one is
    // not a member of the type: coercion substitutes the internal marker, and `false` under
    // `additionalProperties`, which inverts "any additional property is allowed" into "none are".
    const schemas = componentSchemas(defaultSchema, {
      Bare: {},
      Map: { type: 'object', additionalProperties: {} },
    })

    expect(schemas.Bare).toEqual({ __scalar_: '' })
    expect(schemas.Map.additionalProperties).toBe(false)
  })

  it('keeps typed schemas and author-written booleans intact by default', () => {
    const schemas = componentSchemas(defaultSchema, {
      Closed: { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false },
      Open: { type: 'object', additionalProperties: true },
      Typed: { type: 'object', additionalProperties: { type: 'string' } },
    })

    expect(schemas.Closed.properties.a).toMatchObject({ type: 'string' })
    expect(schemas.Closed.additionalProperties).toBe(false)
    expect(schemas.Open.additionalProperties).toBe(true)
    expect(schemas.Typed.additionalProperties).toMatchObject({ type: 'string' })
  })
})
