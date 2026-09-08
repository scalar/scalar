import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import {
  getDisplayTypeSignatureTokens,
  getTypeSignatureTokens,
  typeSignatureInlinesEnum,
} from './get-type-signature-tokens'

/** Render tokens to a plain string for compact assertions. */
const text = (tokens: ReturnType<typeof getTypeSignatureTokens>): string => tokens.map((token) => token.text).join(' ')

describe('get-type-signature-tokens', () => {
  it('renders a primitive as an identifier', () => {
    const tokens = getTypeSignatureTokens(coerceValue(SchemaObjectSchema, { type: 'string' }))

    expect(tokens).toEqual([{ kind: 'ident', text: 'string' }])
  })

  it('renders an array of a named model as English plus the name', () => {
    const tokens = getTypeSignatureTokens({
      type: 'array',
      items: { $ref: '#/components/schemas/Planet' },
    } as never)

    expect(text(tokens)).toBe('array of Planet')
    expect(tokens[0]?.kind).toBe('word')
    expect(tokens[1]?.kind).toBe('ident')
  })

  it('renders nested arrays without bracket noise', () => {
    const tokens = getTypeSignatureTokens(
      coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: { type: 'array', items: { type: 'string' } },
      }),
    )

    expect(text(tokens)).toBe('array of array of string')
  })

  it('renders a type union with a muted pipe', () => {
    const tokens = getTypeSignatureTokens(coerceValue(SchemaObjectSchema, { type: ['string', 'null'] }))

    expect(text(tokens)).toBe('string | null')
    expect(tokens.find((token) => token.text === '|')?.kind).toBe('punctuation')
  })

  it('renders a short enum inline as its values', () => {
    const tokens = getTypeSignatureTokens(
      coerceValue(SchemaObjectSchema, {
        type: 'string',
        enum: ['standard', 'enterprise'],
      }),
    )

    expect(text(tokens)).toBe('"standard" or "enterprise"')
  })

  it('falls back to the plain type for a long enum', () => {
    const tokens = getTypeSignatureTokens(
      coerceValue(SchemaObjectSchema, {
        type: 'string',
        enum: ['a', 'b', 'c', 'd'],
      }),
    )

    expect(text(tokens)).toBe('string')
  })

  it('renders const as its quoted value', () => {
    const tokens = getTypeSignatureTokens(coerceValue(SchemaObjectSchema, { const: 'cat' }))

    expect(text(tokens)).toBe('"cat"')
    expect(tokens[0]?.kind).toBe('literal')
  })

  it('renders an object or array const as JSON, not [object Object]', () => {
    expect(text(getTypeSignatureTokens({ const: { tier: 'gold' } } as never))).toBe('{"tier":"gold"}')
    expect(text(getTypeSignatureTokens({ const: [1, 2] } as never))).toBe('[1,2]')
  })

  it('hides model names when asked', () => {
    const tokens = getTypeSignatureTokens({ $ref: '#/components/schemas/Planet' } as never, { hideModelNames: true })

    // Without a resolvable value the ref yields nothing rather than a name.
    expect(tokens.some((token) => token.text === 'Planet')).toBe(false)
  })

  it('returns nothing for a missing schema', () => {
    expect(getTypeSignatureTokens(undefined)).toEqual([])
  })
})

describe('getDisplayTypeSignatureTokens', () => {
  const planetRef = { $ref: '#/components/schemas/planet', '$ref-value': { type: 'object' } } as never

  it('passes the raw tokens through without a model name', () => {
    const tokens = getDisplayTypeSignatureTokens(coerceValue(SchemaObjectSchema, { type: 'string' }))

    expect(tokens).toEqual([{ kind: 'ident', text: 'string' }])
  })

  it('names an empty signature after the model', () => {
    const tokens = getDisplayTypeSignatureTokens(coerceValue(SchemaObjectSchema, {}), { modelName: 'Planet' })

    expect(tokens).toEqual([{ kind: 'ident', text: 'Planet' }])
  })

  it('names a bare object after the model', () => {
    const tokens = getDisplayTypeSignatureTokens(coerceValue(SchemaObjectSchema, { type: 'object' }), {
      modelName: 'Planet',
    })

    expect(tokens).toEqual([{ kind: 'ident', text: 'Planet' }])
  })

  it('renames a direct $ref to the model name', () => {
    const tokens = getDisplayTypeSignatureTokens(planetRef, { modelName: 'Planet' })

    expect(tokens).toEqual([{ kind: 'ident', text: 'Planet' }])
  })

  it('keeps the real type of an inline schema', () => {
    const tokens = getDisplayTypeSignatureTokens(coerceValue(SchemaObjectSchema, { type: 'integer' }), {
      modelName: 'Planet',
    })

    expect(text(tokens)).toBe('integer')
  })

  it('renames only the item of an array of $ref when the name describes the item', () => {
    const tokens = getDisplayTypeSignatureTokens({ type: 'array', items: planetRef } as never, {
      modelName: 'Planet[]',
    })

    expect(tokens).toEqual([
      { kind: 'word', text: 'array of' },
      { kind: 'ident', text: 'Planet' },
    ])
  })

  it('keeps the item of an array of $ref when the name describes the array', () => {
    const tokens = getDisplayTypeSignatureTokens({ type: 'array', items: planetRef } as never, {
      modelName: 'FilterList',
    })

    expect(text(tokens)).toBe('array of planet')
  })

  it('keeps the item of an array of $ref when the names already agree', () => {
    const tokens = getDisplayTypeSignatureTokens({ type: 'array', items: planetRef } as never, {
      modelName: 'planet[]',
    })

    expect(text(tokens)).toBe('array of planet')
  })

  it('keeps a union signature as it is', () => {
    const tokens = getDisplayTypeSignatureTokens(coerceValue(SchemaObjectSchema, { type: ['string', 'null'] }), {
      modelName: 'Planet',
    })

    expect(text(tokens)).toBe('string | null')
  })
})

describe('typeSignatureInlinesEnum', () => {
  it('reports a short, unannotated enum as inlined', () => {
    expect(typeSignatureInlinesEnum({ type: 'string', enum: ['a', 'b'] } as never)).toBe(true)
  })

  it('reports a long enum as not inlined', () => {
    expect(typeSignatureInlinesEnum({ type: 'string', enum: ['a', 'b', 'c', 'd'] } as never)).toBe(false)
  })

  it('reports an annotated enum as not inlined, so its value list survives', () => {
    expect(typeSignatureInlinesEnum({ type: 'string', enum: ['a', 'b'], 'x-enum-varnames': ['A', 'B'] } as never)).toBe(
      false,
    )
  })

  it('reports an enum with no type as inlined, matching the signature', () => {
    const schema = { enum: ['a', 'b'] } as never

    expect(typeSignatureInlinesEnum(schema)).toBe(true)
    // The signature does inline it, so the value list must not render a second copy.
    expect(text(getTypeSignatureTokens(schema))).toBe('"a" or "b"')
  })

  it('reports a schema carrying both a short enum and type array as inlined', () => {
    const schema = { type: ['array', 'null'], enum: ['a', 'b'], items: { type: 'string' } } as never

    expect(typeSignatureInlinesEnum(schema)).toBe(true)
    expect(text(getTypeSignatureTokens(schema))).toBe('"a" or "b"')
  })

  it("reports an array with no own enum by its items' enum", () => {
    expect(typeSignatureInlinesEnum({ type: 'array', items: { type: 'string', enum: ['a', 'b'] } } as never)).toBe(true)
    expect(typeSignatureInlinesEnum({ type: 'array', items: { type: 'string' } } as never)).toBe(false)
  })

  it('reports a named $ref as not inlined, since it renders as the model name', () => {
    expect(typeSignatureInlinesEnum({ $ref: '#/components/schemas/Planet' } as never)).toBe(false)
  })

  it('reports a plain type with no enum as not inlined', () => {
    expect(typeSignatureInlinesEnum({ type: 'string' } as never)).toBe(false)
  })
})
