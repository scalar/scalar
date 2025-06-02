import { describe, it, expect } from 'vitest'
import { objectKeys } from './object-keys'

describe('objectKeys', () => {
  it('should return keys of a simple object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const keys = objectKeys(obj)
    expect(keys).toEqual(['a', 'b', 'c'])
  })

  it('should return keys of an object with different value types', () => {
    const obj = {
      string: 'hello',
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
    }
    const keys = objectKeys(obj)
    expect(keys).toEqual(['string', 'number', 'boolean', 'null', 'undefined'])
  })

  it('should return empty array for empty object', () => {
    const obj = {}
    const keys = objectKeys(obj)
    expect(keys).toEqual([])
  })

  it('should preserve type information', () => {
    const obj = { a: 1, b: 2 } as const
    const keys = objectKeys(obj)
    // TypeScript should infer keys as ('a' | 'b')[]
    type Keys = typeof keys
    type Expected = ('a' | 'b')[]
    const _typeCheck: Keys = [] as Expected
    _typeCheck
  })

  it('should work with nested objects', () => {
    const obj = {
      a: { x: 1 },
      b: { y: 2 },
    }
    const keys = objectKeys(obj)
    expect(keys).toEqual(['a', 'b'])
  })
})
