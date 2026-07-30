import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { type Schema, coerce, object, optional, string } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { generateSchema, generateSchemaObject } from '@/schemas/v3.1/openapi'
import { recursiveRef } from '@/schemas/v3.1/openapi/reference'

const defaultSchema = generateSchema(recursiveRef)
const typelessSchema = generateSchema(recursiveRef, {
  schemaObject: generateSchemaObject(recursiveRef, { typelessSchemas: true }),
})

const document = (schemas: Record<string, unknown>): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: 'Maps', version: '1.0.0' },
  paths: {},
  components: { schemas },
})

/** Coerces a document and returns the named component schema. */
const coerceSchema = (schema: Schema, name: string, schemas: Record<string, unknown>): any =>
  (coerce(schema, document(schemas)) as any).components.schemas[name]

describe('typeless-schemas', () => {
  describe('schemaObject injection', () => {
    it('uses the supplied Schema Object in every position that holds one', () => {
      // A deliberately minimal stand-in: if the document schema reaches for it, only `title`
      // survives coercion, which no default branch would do.
      const marker = object({ title: optional(string()) })
      const injected = generateSchema(recursiveRef, { schemaObject: marker })

      const schemas = (coerce(injected, document({ Target: { type: 'string', title: 'kept', minLength: 3 } })) as any)
        .components.schemas

      expect(schemas.Target).toEqual({ title: 'kept' })
    })

    it('defaults to `generateSchemaObject` when none is supplied', () => {
      const explicit = generateSchema(recursiveRef, { schemaObject: generateSchemaObject(recursiveRef) })
      const target = { Target: { type: 'object', properties: { a: { type: 'string' } } } }

      expect(coerce(explicit, document(target))).toEqual(coerce(defaultSchema, document(target)))
    })
  })

  describe('by default', () => {
    it('substitutes the internal marker for a type-less schema', () => {
      // Documents the behavior the option opts out of, so a change to either path is visible here.
      expect(coerceSchema(defaultSchema, 'Target', { Target: {} })).toEqual({ __scalar_: '' })
    })

    it('inverts a free-form `additionalProperties` to `false`', () => {
      const target = coerceSchema(defaultSchema, 'Target', { Target: { type: 'object', additionalProperties: {} } })

      expect(target.additionalProperties).toBe(false)
    })
  })

  describe('with `typelessSchemas`', () => {
    it('keeps a type-less schema as itself', () => {
      expect(coerceSchema(typelessSchema, 'Target', { Target: {} })).toEqual({})
    })

    it('keeps a type-less schema carrying only annotations', () => {
      const target = coerceSchema(typelessSchema, 'Target', { Target: { description: 'Any JSON value' } })

      expect(target).toEqual({ description: 'Any JSON value' })
    })

    it('keeps a free-form `additionalProperties` map open', () => {
      // The symptom this option exists for: `{}` permits any additional property, `false` forbids
      // all of them, so the substitution turned a free-form map into a closed object.
      const target = coerceSchema(typelessSchema, 'Target', { Target: { type: 'object', additionalProperties: {} } })

      expect(target.additionalProperties).toEqual({})
    })

    it('keeps type-less schemas in every position that holds one', () => {
      const schemas = coerce(
        typelessSchema,
        document({
          BareRoot: {},
          Target: { type: 'object', properties: { free: {}, typed: { type: 'string' } } },
          Composed: { allOf: [{}, { type: 'object' }] },
        }),
      ) as any

      expect(schemas.components.schemas.BareRoot).toEqual({})
      expect(schemas.components.schemas.Target.properties.free).toEqual({})
      expect(schemas.components.schemas.Composed.allOf[0]).toEqual({})
    })

    it('leaves typed schemas and author-written booleans alone', () => {
      // A branch matches these, so the permissive branch must never outscore it.
      const target = coerceSchema(typelessSchema, 'Target', {
        Target: { type: 'object', properties: { typed: { type: 'string' } }, additionalProperties: false },
      })

      expect(target.properties.typed).toMatchObject({ type: 'string' })
      expect(target.additionalProperties).toBe(false)
      expect(
        coerceSchema(typelessSchema, 'Open', { Open: { type: 'object', additionalProperties: true } })
          .additionalProperties,
      ).toBe(true)
    })

    it('keeps the validation keywords of a type-less schema', () => {
      // A type-less schema that still declares keywords is ordinary OpenAPI — `properties` without
      // `type: 'object'` is common. An empty disambiguation branch would score just high enough to
      // tie the typed branches and win on position, dropping exactly these keywords.
      const schemas = coerce(
        typelessSchema,
        document({
          ImplicitObject: { properties: { a: { type: 'string' } } },
          ImplicitArray: { items: { type: 'string' } },
          ImplicitMap: { additionalProperties: { type: 'string' } },
          Constrained: { minProperties: 1, minLength: 3, uniqueItems: true },
        }),
      ) as any

      expect(schemas.components.schemas.ImplicitObject).toEqual({ properties: { a: { type: 'string' } } })
      expect(schemas.components.schemas.ImplicitArray).toEqual({ items: { type: 'string' } })
      expect(schemas.components.schemas.ImplicitMap).toEqual({ additionalProperties: { type: 'string' } })
      expect(schemas.components.schemas.Constrained).toEqual({ minProperties: 1, minLength: 3, uniqueItems: true })
    })

    it('does not invent a `type` the author never wrote', () => {
      // The default narrows these to `type: 'object'`, which changes what the schema accepts.
      const target = coerceSchema(typelessSchema, 'Target', { Target: { properties: { a: { type: 'string' } } } })

      expect(target).not.toHaveProperty('type')
    })

    it('preserves references, with or without materialized `$ref-value` mirrors', () => {
      // The type-less branch declares keywords rather than matching anything, so it scores nothing
      // on a reference and the reference branch still wins.
      const plain = coerceSchema(typelessSchema, 'Target', { Target: { $ref: '#/components/schemas/Other' } })
      expect(plain.$ref).toBe('#/components/schemas/Other')

      const proxy = createMagicProxy(
        document({
          Target: { type: 'object', properties: { child: { $ref: '#/components/schemas/Other' } } },
          Other: { type: 'string' },
        }),
        { showInternal: true },
      )
      const target = (coerce(typelessSchema, JSON.parse(JSON.stringify(proxy))) as any).components.schemas.Target

      expect(target.properties.child.$ref).toBe('#/components/schemas/Other')
      expect(target.properties.child['$ref-value']).toMatchObject({ type: 'string' })
    })
  })
})
