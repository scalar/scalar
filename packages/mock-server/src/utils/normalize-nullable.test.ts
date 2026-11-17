import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'

import { normalizeNullable } from './normalize-nullable'

/** Compile with the Ajv options the request validator uses, so a refused schema throws here as well */
const compile = (schema: unknown) => new Ajv2020({ strict: false, allErrors: true }).compile(schema as object)

const NULL_ARM = { type: 'null' }

const union = { nullable: true, oneOf: [{ type: 'string' }, { type: 'integer' }] }
const wrapped = { anyOf: [{ oneOf: [{ type: 'string' }, { type: 'integer' }] }, NULL_ARM] }

describe('normalizeNullable', () => {
  it.each(['oneOf', 'anyOf', 'allOf'])('wraps a nullable %s in a union with null', (keyword) => {
    const members = [{ type: 'string' }, { type: 'integer' }]

    expect(normalizeNullable({ nullable: true, [keyword]: members })).toStrictEqual({
      anyOf: [{ [keyword]: members }, NULL_ARM],
    })
  })

  it('keeps the other keywords of a nullable union beside its branches', () => {
    expect(
      normalizeNullable({ nullable: true, description: 'Either', oneOf: [{ type: 'string' }, { type: 'integer' }] }),
    ).toStrictEqual({ anyOf: [{ description: 'Either', oneOf: [{ type: 'string' }, { type: 'integer' }] }, NULL_ARM] })
  })

  it.each([
    ['nothing else', { nullable: true }, {}],
    ['an annotation', { nullable: true, description: 'Anything' }, { description: 'Anything' }],
    ['an enum', { nullable: true, enum: ['a', 'b'] }, { enum: ['a', 'b'] }],
    ['properties', { nullable: true, properties: { a: {} } }, { properties: { a: {} } }],
  ])('drops a nullable that sits beside %s and has nothing to widen', (_name, schema, expected) => {
    expect(normalizeNullable(schema)).toStrictEqual(expected)
  })

  it.each([
    [
      'a union',
      { nullable: false, oneOf: [{ type: 'string' }, { type: 'integer' }] },
      { oneOf: [{ type: 'string' }, { type: 'integer' }] },
    ],
    ['a bare schema', { nullable: false }, {}],
  ])('drops nullable false beside %s without adding null', (_name, schema, expected) => {
    expect(normalizeNullable(schema)).toStrictEqual(expected)
  })

  it.each(['yes', 1, null])('drops a nullable that is not a boolean: %j', (nullable) => {
    expect(normalizeNullable({ nullable, oneOf: [{ type: 'string' }] })).toStrictEqual({ oneOf: [{ type: 'string' }] })
  })

  it.each([
    ['a string type', { type: 'string', nullable: true }],
    ['a list type', { type: ['string', 'integer'], nullable: true }],
    ['a type that already has null', { type: ['string', 'null'], nullable: true }],
    ['a typed union', { type: 'string', nullable: true, oneOf: [{ minLength: 1 }, { maxLength: 0 }] }],
    ['nullable false', { type: 'string', nullable: false }],
  ])('leaves a schema with %s to Ajv', (_name, schema) => {
    expect(normalizeNullable(schema)).toBe(schema)
  })

  it.each([
    ['null', { type: 'null', nullable: false }, { type: 'null' }],
    ['a list with null', { type: ['string', 'null'], nullable: false }, { type: ['string', 'null'] }],
  ])('drops nullable false beside the type %s', (_name, schema, expected) => {
    const result = normalizeNullable(schema)

    expect(result).toStrictEqual(expected)
    expect(() => compile(schema)).toThrow('type: null contradicts nullable: false')
    expect(() => compile(result)).not.toThrow()
  })

  it('treats an empty type list as no type', () => {
    expect(normalizeNullable({ type: [], nullable: true, oneOf: [{ type: 'string' }] })).toStrictEqual({
      anyOf: [{ type: [], oneOf: [{ type: 'string' }] }, NULL_ARM],
    })
  })

  it.each([
    ['properties', { properties: { value: union } }, { properties: { value: wrapped } }],
    ['items', { items: union }, { items: wrapped }],
    ['prefixItems', { prefixItems: [union] }, { prefixItems: [wrapped] }],
    ['additionalProperties', { additionalProperties: union }, { additionalProperties: wrapped }],
    ['patternProperties', { patternProperties: { '^x': union } }, { patternProperties: { '^x': wrapped } }],
    ['$defs', { $defs: { value: union } }, { $defs: { value: wrapped } }],
    ['allOf', { allOf: [union] }, { allOf: [wrapped] }],
    ['not', { not: union }, { not: wrapped }],
    ['if and then', { if: union, then: union }, { if: wrapped, then: wrapped }],
    ['dependentSchemas', { dependentSchemas: { a: union } }, { dependentSchemas: { a: wrapped } }],
    [
      'a nested object',
      { properties: { a: { items: { properties: { b: union } } } } },
      { properties: { a: { items: { properties: { b: wrapped } } } } },
    ],
  ])('reaches a nullable union under %s', (_name, schema, expected) => {
    const result = normalizeNullable(schema)

    expect(result).toStrictEqual(expected)
    expect(() => compile(result)).not.toThrow()
  })

  it('rewrites a schema that Ajv refuses to compile', () => {
    const schema = { properties: { value: union } }

    expect(() => compile(schema)).toThrow('"nullable" cannot be used without "type"')
    expect(() => compile(normalizeNullable(schema))).not.toThrow()
  })

  it.each(['nullable', 'oneOf', 'type', 'properties', '__proto__', 'constructor'])(
    'keeps a property named %s as a name and not as a keyword',
    (name) => {
      const properties = JSON.parse(`{ ${JSON.stringify(name)}: { "type": "string" } }`)
      const schema = { type: 'object', properties }

      expect(normalizeNullable(schema)).toBe(schema)
    },
  )

  it('rewrites the schema a property named nullable holds', () => {
    const properties = JSON.parse('{ "nullable": { "nullable": true, "oneOf": [{ "type": "string" }] } }')
    const result = normalizeNullable({ type: 'object', properties }) as { properties: Record<string, unknown> }

    expect(Object.keys(result.properties)).toStrictEqual(['nullable'])
    expect(result.properties.nullable).toStrictEqual({ anyOf: [{ oneOf: [{ type: 'string' }] }, NULL_ARM] })
  })

  it('keeps a schema named __proto__ as an own property when it is rewritten', () => {
    const properties = JSON.parse(`{ "__proto__": ${JSON.stringify(union)}, "other": { "type": "string" } }`)
    const result = normalizeNullable({ type: 'object', properties }) as { properties: Record<string, unknown> }

    expect(Object.getPrototypeOf(result.properties)).toBe(Object.prototype)
    expect(Object.keys(result.properties)).toStrictEqual(['__proto__', 'other'])
    expect(Object.getOwnPropertyDescriptor(result.properties, '__proto__')?.value).toStrictEqual(wrapped)
  })

  it.each(['enum', 'const', 'default', 'example', 'examples', 'x-extension'])(
    'leaves a nullable object inside %s alone',
    (keyword) => {
      const schema = { type: 'object', [keyword]: [{ nullable: true, oneOf: [] }] }

      expect(normalizeNullable(schema)).toBe(schema)
    },
  )

  it('does not mutate its input', () => {
    const schema = { type: 'object', properties: { value: union, list: { type: 'array', items: union } } }
    const before = structuredClone(schema)

    normalizeNullable(schema)

    expect(schema).toStrictEqual(before)
  })

  it('shares the subtrees it does not rewrite with its input', () => {
    const untouched = { type: 'string' }
    const result = normalizeNullable({ properties: { a: untouched, b: union } }) as {
      properties: { a: unknown; b: unknown }
    }

    expect(result.properties.a).toBe(untouched)
  })

  it('rewrites a schema shared by several places once and keeps them shared', () => {
    const shared = { nullable: true, anyOf: [{ type: 'string' }] }
    const result = normalizeNullable({ properties: { a: shared, b: shared }, items: shared }) as {
      properties: { a: unknown; b: unknown }
      items: unknown
    }

    expect(result.properties.a).toBe(result.properties.b)
    expect(result.properties.a).toBe(result.items)
  })

  it('reads the same object as a schema and as a schema map without mixing them up', () => {
    const shared = { nullable: { nullable: true, oneOf: [{ type: 'string' }] } }
    const result = normalizeNullable({ properties: shared, not: shared }) as {
      properties: { nullable: unknown }
      not: Record<string, unknown>
    }

    expect(result.properties.nullable).toStrictEqual({ anyOf: [{ oneOf: [{ type: 'string' }] }, NULL_ARM] })
    // Read as a schema, the same object carries a `nullable` keyword with nothing to widen, which goes.
    expect(result.not).toStrictEqual({})
  })

  it.each(['oneOf', 'anyOf'])('turns a %s arm that only says nullable into the null arm', (keyword) => {
    expect(
      normalizeNullable({ [keyword]: [{ nullable: true, description: 'None', 'x-tag': 1 }, { type: 'string' }] }),
    ).toStrictEqual({ [keyword]: [{ description: 'None', 'x-tag': 1, type: 'null' }, { type: 'string' }] })
  })

  it.each([
    ['a constrained oneOf arm', { oneOf: [{ nullable: true, enum: ['a'] }] }, { oneOf: [{ enum: ['a'] }] }],
    ['an allOf member', { allOf: [{ nullable: true }] }, { allOf: [{}] }],
    ['a not', { not: { nullable: true } }, { not: {} }],
  ])('drops the nullable of %s rather than reading it as the null arm', (_name, schema, expected) => {
    expect(normalizeNullable(schema)).toStrictEqual(expected)
  })

  it('returns values that are not schemas as they are', () => {
    expect(normalizeNullable(true)).toBe(true)
    expect(normalizeNullable(null)).toBe(null)
    expect(normalizeNullable('[circular]')).toBe('[circular]')
  })

  describe('with Ajv', () => {
    it.each([
      ['oneOf', [{ type: 'string' }, { type: 'integer' }], ['text', 3, null], [true, {}, []]],
      ['anyOf', [{ type: 'string' }, { type: 'integer' }], ['text', 3, null], [true, {}, []]],
      ['allOf', [{ type: 'string' }], ['text', null], [3, true]],
    ])('accepts null and the declared values for a nullable %s', (keyword, members, valid, invalid) => {
      const validate = compile(normalizeNullable({ nullable: true, [keyword]: members }))

      for (const value of valid) {
        expect(validate(value)).toBe(true)
      }
      for (const value of invalid) {
        expect(validate(value)).toBe(false)
      }
    })

    it('accepts null for a oneOf whose branch already accepts null', () => {
      const validate = compile(
        normalizeNullable({ nullable: true, oneOf: [{ type: 'string' }, { type: ['integer', 'null'] }] }),
      )

      expect(validate(null)).toBe(true)
      expect(validate(3)).toBe(true)
      expect(validate(true)).toBe(false)
    })

    it('accepts the real arm of a oneOf whose other arm only says nullable', () => {
      const validate = compile(normalizeNullable({ oneOf: [{ nullable: true }, { type: 'string' }] }))

      expect(validate('text')).toBe(true)
      expect(validate(null)).toBe(true)
      expect(validate(3)).toBe(false)
    })

    it('still enforces the required properties around a nullable union', () => {
      const validate = compile(
        normalizeNullable({
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' }, value: union },
        }),
      )

      expect(validate({ name: 'x', value: null })).toBe(true)
      expect(validate({ name: 'x', value: 'y' })).toBe(true)
      expect(validate({ name: 'x', value: true })).toBe(false)
      expect(validate({})).toBe(false)
    })

    it('keeps the meaning of a not whose schema is nullable', () => {
      const validate = compile(normalizeNullable({ not: { nullable: true, oneOf: [{ type: 'string' }] } }))

      expect(validate(3)).toBe(true)
      expect(validate('text')).toBe(false)
      expect(validate(null)).toBe(false)
    })
  })
})
