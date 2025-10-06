import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { validateParameter } from './validate-parameter'

describe('validateParameter', () => {
  it('returns true when there is no schema', () => {
    expect(validateParameter(undefined, 'some value')).toEqual({ ok: true })
  })

  it('returns true when schema has no type', () => {
    expect(validateParameter({ _: '' }, 'some value')).toEqual({ ok: true })
  })

  it('correctly validate a number type #1', () => {
    expect(validateParameter({ type: 'number' }, 'some value')).toEqual({
      ok: false,
      message: 'Value must be a number (e.g., 42.5)',
    })
  })

  it('correctly validate a number type #2', () => {
    expect(validateParameter({ type: 'number', minimum: 10, maximum: 100 }, '200')).toEqual({
      ok: false,
      message: 'Value must be 100 or less',
    })
  })

  it('correctly validate a number type #3', () => {
    expect(validateParameter({ type: 'number', minimum: 10, maximum: 100 }, '0')).toEqual({
      ok: false,
      message: 'Value must be 10 or greater',
    })
  })

  it.each([
    [{ schema: { type: 'string', format: 'date' }, value: 'some random value' }],
    [{ schema: { type: 'string', format: 'email' }, value: 'some random value' }],
    [{ schema: { type: 'string', format: 'uri' }, value: 'some random value' }],
  ])('validates different string formats', ({ schema, value }) => {
    expect(validateParameter(schema as SchemaObject, value)).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    )
  })

  it.each([
    [{ schema: { type: 'string', format: 'date' }, value: '2025-05-15' }],
    [{ schema: { type: 'string', format: 'email' }, value: 'someone@gmail.com' }],
    [{ schema: { type: 'string', format: 'uri' }, value: 'http://example.co' }],
  ])('validates different string formats to true', ({ schema, value }) => {
    expect(validateParameter(schema as SchemaObject, value)).toEqual(expect.objectContaining({ ok: true }))
  })
})
