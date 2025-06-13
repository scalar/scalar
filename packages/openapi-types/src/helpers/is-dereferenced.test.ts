import { describe, expect, expectTypeOf, it } from 'vitest'
import { isDereferenced } from './is-dereferenced'
import type { OpenAPIV3_1 } from '../openapi-types'

describe('isDereferenced', () => {
  it('returns true for objects without $ref', () => {
    const obj = { name: 'test', type: 'string' }
    expect(isDereferenced(obj)).toBe(true)
    expectTypeOf(isDereferenced).returns.toBeBoolean()
  })

  it('returns false for objects with $ref', () => {
    const obj = { $ref: '#/components/schemas/Pet' }
    expect(isDereferenced(obj)).toBe(false)
    expectTypeOf(isDereferenced).returns.toBeBoolean()
  })

  it('returns false for null', () => {
    expect(isDereferenced(null)).toBe(false)
    expectTypeOf(isDereferenced).returns.toBeBoolean()
  })

  it('returns false for undefined', () => {
    expect(isDereferenced(undefined)).toBe(false)
    expectTypeOf(isDereferenced).returns.toBeBoolean()
  })

  it('returns false for primitive values', () => {
    expect(isDereferenced('string')).toBe(false)
    expect(isDereferenced(123)).toBe(false)
    expect(isDereferenced(true)).toBe(false)
    expectTypeOf(isDereferenced).returns.toBeBoolean()
  })

  it('narrows type correctly when used in type guard', () => {
    const obj: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject = {
      type: 'string',
      format: 'email',
    }

    if (isDereferenced(obj)) {
      // Type should be narrowed to SchemaObject
      expectTypeOf(obj).toMatchTypeOf<OpenAPIV3_1.SchemaObject>()
    }
  })

  it('narrows type correctly when used in type guard', () => {
    const obj: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject = {
      type: 'string',
      format: 'email',
    }

    if (isDereferenced(obj)) {
      // Type should be narrowed to SchemaObject
      expectTypeOf(obj).toMatchTypeOf<OpenAPIV3_1.SchemaObject>()
    }
  })
})
