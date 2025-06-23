import { describe, expect, expectTypeOf, it } from 'vitest'

import { isDefined } from './is-defined'

describe('isDefined type', () => {
  it('should narrow type when filtering arrays', () => {
    const array = [1, null, 2, undefined, 3] as const
    const filtered = array.filter(isDefined)

    // Should be number[], not (number | null | undefined)[]
    expectTypeOf(filtered).toMatchTypeOf<number[]>()
  })

  it('should work with complex types', () => {
    const array = [{ foo: 'a', bar: 1 }, null, { foo: 'b', bar: 2 }, undefined] as const

    const filtered = array.filter(isDefined)

    // Should be Complex[], not (Complex | null | undefined)[]
    expectTypeOf(filtered).toMatchTypeOf<{ foo: string; bar: number }[]>()
  })

  it('should work with union types', () => {
    const array = ['a', 1, null, true, undefined] as const
    const filtered = array.filter(isDefined)

    // Should be (string | number | boolean)[], not (string | number | boolean | null | undefined)[]
    expectTypeOf(filtered).toMatchTypeOf<(string | number | boolean)[]>()
  })

  it('should preserve literal types', () => {
    const array = ['foo' as const, null, 'bar' as const, undefined] as const
    const filtered = array.filter(isDefined)

    // Should be ('foo' | 'bar')[], not string[]
    expectTypeOf(filtered).toEqualTypeOf<('foo' | 'bar')[]>()
  })

  it('should preserve empty strings', () => {
    const array = ['', ''] as const
    const filtered = array.filter(isDefined)
    expect(filtered).toEqual(['', ''])
  })
})

describe('isDefined runtime', () => {
  it('should filter out null and undefined values', () => {
    const array = [1, null, 2, undefined, 3]
    const filtered = array.filter(isDefined)
    expect(filtered).toEqual([1, 2, 3])
  })

  it('should keep falsy values that are not null or undefined', () => {
    const array = [0, '', false, null, undefined]
    const filtered = array.filter(isDefined)
    expect(filtered).toEqual([0, '', false])
  })
})
