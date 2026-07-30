import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { type Schema, coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { generateSchema } from '@/schemas/v3.1/openapi'
import { recursiveRef } from '@/schemas/v3.1/openapi/reference'

const defaultSchema = generateSchema(recursiveRef)
const typelessSchema = generateSchema(recursiveRef, { typelessSchemas: true })

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

    it('preserves references when the `$ref-value` mirrors are materialized', () => {
      // The option's precondition. Cloning through a magic proxy materializes the mirrors, which is
      // what lets the reference branch outscore the type-less one.
      const proxy = createMagicProxy(
        document({
          Target: { type: 'object', properties: { child: { $ref: '#/components/schemas/Other' } } },
          Other: { type: 'string' },
        }),
        { showInternal: true },
      )
      const materialized = JSON.parse(JSON.stringify(proxy))

      const target = (coerce(typelessSchema, materialized) as any).components.schemas.Target

      expect(target.properties.child.$ref).toBe('#/components/schemas/Other')
      expect(target.properties.child['$ref-value']).toMatchObject({ type: 'string' })
    })

    it('erases references when the mirrors are absent', () => {
      // Guards the precondition above rather than endorsing this: a type-less branch matches any
      // object, so without mirrors it outscores the reference branch. Callers that coerce a plain
      // document must leave the option off.
      const target = coerceSchema(typelessSchema, 'Target', { Target: { $ref: '#/components/schemas/Other' } })

      expect(target).toEqual({})
    })
  })
})
