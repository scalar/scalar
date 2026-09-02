import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getTypeSignatureTokens } from './get-type-signature-tokens'

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

  it('hides model names when asked', () => {
    const tokens = getTypeSignatureTokens({ $ref: '#/components/schemas/Planet' } as never, { hideModelNames: true })

    // Without a resolvable value the ref yields nothing rather than a name.
    expect(tokens.some((token) => token.text === 'Planet')).toBe(false)
  })

  it('returns nothing for a missing schema', () => {
    expect(getTypeSignatureTokens(undefined)).toEqual([])
  })
})
