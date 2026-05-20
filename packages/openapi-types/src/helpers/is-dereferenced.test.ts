import { describe, expect, expectTypeOf, it } from 'vitest'

import type { ReferenceObject as ReferenceObjectV3_1 } from '../../3.1/reference'
import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import type { OpenAPIV3_1 } from '../openapi-types'
import { isDereferenced } from './is-dereferenced'

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

  it('returns false when $ref is present alongside other properties', () => {
    expect(isDereferenced({ $ref: '#/components/schemas/Pet', description: 'a pet' })).toBe(false)
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

  it('treats a non-string $ref as dereferenced', () => {
    expect(isDereferenced({ $ref: 123 })).toBe(true)
  })

  it('narrows the loose OpenAPIV3_1 union to the SchemaObject', () => {
    const value: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject = {
      type: 'string',
      format: 'email',
    }

    if (isDereferenced(value)) {
      expectTypeOf(value).toExtend<OpenAPIV3_1.SchemaObject>()
      expectTypeOf(value).not.toExtend<{ $ref: string }>()
    }
  })

  it('narrows the strict 3.1 union to the SchemaObject', () => {
    const value: SchemaObjectV3_1 | ReferenceObjectV3_1 = {
      type: 'string',
    }

    if (isDereferenced(value)) {
      expectTypeOf(value).toExtend<SchemaObjectV3_1>()
      expectTypeOf(value).not.toExtend<ReferenceObjectV3_1>()
    }
  })
})
