import { describe, expect, it } from 'vitest'

import { createOverridesProxy, unpackOverridesProxy } from '@/helpers/overrides-proxy'

describe('createOverridesProxy', () => {
  it('should return the original object if no overrides are provided', () => {
    const input = { a: 1, b: { c: 2 } }
    const result = createOverridesProxy(input)
    expect(result).toEqual(input)
  })

  it('should return the original object with overrides applied', () => {
    const input = { a: 1, b: { c: 2 } }
    const overrides = { a: 3, b: { c: 4 } }
    const result = createOverridesProxy(input, overrides)
    expect(result).toEqual({ a: 3, b: { c: 4 } })
  })

  it('should return the original object with nested overrides applied', () => {
    const input = { a: 1, b: { c: 2, d: { e: 5 } } }
    const overrides = { b: { c: 3, d: { e: 6 } } }
    const result = createOverridesProxy(input, overrides)
    expect(result).toEqual({ a: 1, b: { c: 3, d: { e: 6 } } })
  })

  it('should preserve non-overridden properties', () => {
    const input = { a: 1, b: { c: 2, d: 3 } }
    const overrides = { b: { c: 4 } }
    const result = createOverridesProxy(input, overrides)
    expect(result).toEqual({ a: 1, b: { c: 4, d: 3 } })
  })

  it('should unpack overrides proxy correctly', () => {
    const input = { a: 1, b: { c: 2 } }
    const overrides = { a: 3, b: { c: 4 } }
    const proxy = createOverridesProxy(input, overrides)
    expect(proxy).toEqual(overrides)
    const unpacked = unpackOverridesProxy(proxy)
    expect(unpacked).toEqual(input)
  })

  it('should set values on the original target object', () => {
    const input = { a: 1, b: { c: 2 } }
    const overrides = { a: 3 }
    const proxy = createOverridesProxy(input, overrides)
    proxy.b.c = 4
    expect(input.b.c).toBe(4)
    expect(overrides.a).toBe(3)
  })

  it('should set values on the overridden object', () => {
    const input = { a: 1, b: { c: 2 } }
    const overrides = { a: 3 }
    const proxy = createOverridesProxy(input, overrides)
    proxy.a = 5
    expect(input.b.c).toBe(2)
    expect(overrides.a).toBe(5)
  })
})
