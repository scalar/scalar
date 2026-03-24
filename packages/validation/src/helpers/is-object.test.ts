import { describe, expect, it } from 'vitest'

import { isObject } from './is-object'

describe('isObject', () => {
  it('returns true for plain empty objects', () => {
    expect(isObject({})).toBe(true)
  })

  it('returns true for objects with properties', () => {
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject({ a: 1, b: 2, c: 3 })).toBe(true)
  })

  it('returns true for objects with different value types', () => {
    const obj = {
      string: 'hello',
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
      array: [],
      nested: { x: 1 },
    }
    expect(isObject(obj)).toBe(true)
  })

  it('returns true for objects created with Object.create(null)', () => {
    const obj = Object.create(null)
    expect(isObject(obj)).toBe(true)
  })

  it('returns false for Date objects', () => {
    expect(isObject(new Date())).toBe(false)
  })

  it('returns false for RegExp objects', () => {
    expect(isObject(/test/)).toBe(false)
    expect(isObject(new RegExp('test'))).toBe(false)
  })

  it('returns false for Error objects', () => {
    expect(isObject(new Error('test'))).toBe(false)
  })

  it('returns false for Map objects', () => {
    expect(isObject(new Map())).toBe(false)
  })

  it('returns false for Set objects', () => {
    expect(isObject(new Set())).toBe(false)
  })

  it('returns false for WeakMap objects', () => {
    expect(isObject(new WeakMap())).toBe(false)
  })

  it('returns false for WeakSet objects', () => {
    expect(isObject(new WeakSet())).toBe(false)
  })

  it('returns false for Promise objects', () => {
    expect(isObject(Promise.resolve())).toBe(false)
  })

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false)
    expect(isObject([1, 2, 3])).toBe(false)
    expect(isObject(new Array(10))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isObject(undefined)).toBe(false)
  })

  it('returns false for numbers', () => {
    expect(isObject(0)).toBe(false)
    expect(isObject(123)).toBe(false)
    expect(isObject(-456)).toBe(false)
    expect(isObject(3.14)).toBe(false)
    expect(isObject(Number.NaN)).toBe(false)
    expect(isObject(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isObject(Number.NEGATIVE_INFINITY)).toBe(false)
  })

  it('returns false for strings', () => {
    expect(isObject('')).toBe(false)
    expect(isObject('string')).toBe(false)
    expect(isObject('hello world')).toBe(false)
  })

  it('returns false for booleans', () => {
    expect(isObject(true)).toBe(false)
    expect(isObject(false)).toBe(false)
  })

  it('returns false for functions', () => {
    expect(
      isObject(() => {
        return
      }),
    ).toBe(false)
    expect(
      isObject(() => {
        return
      }),
    ).toBe(false)
    expect(
      isObject(async () => {
        return await Promise.resolve()
      }),
    ).toBe(false)
  })

  it('returns false for symbols', () => {
    expect(isObject(Symbol('test'))).toBe(false)
    expect(isObject(Symbol.for('test'))).toBe(false)
  })

  it('returns false for BigInt values', () => {
    expect(isObject(BigInt(123))).toBe(false)
    expect(isObject(123n)).toBe(false)
  })

  it('works correctly as a type guard', () => {
    const value: unknown = { a: 1, b: 2 }

    if (isObject(value)) {
      // TypeScript should narrow the type to Record<string, unknown>
      const keys = Object.keys(value)
      expect(keys).toEqual(['a', 'b'])
      expect(value.a).toBe(1)
    }
  })

  it('handles objects with nested structures', () => {
    const obj = {
      nested: {
        deeper: {
          value: 'test',
        },
      },
    }
    expect(isObject(obj)).toBe(true)
  })

  it('returns false for class instances', () => {
    class CustomClass {
      prop = 'value'
    }
    const instance = new CustomClass()
    expect(isObject(instance)).toBe(false)
  })

  it('handles frozen objects', () => {
    const obj = Object.freeze({ a: 1 })
    expect(isObject(obj)).toBe(true)
  })

  it('handles sealed objects', () => {
    const obj = Object.seal({ a: 1 })
    expect(isObject(obj)).toBe(true)
  })
})
