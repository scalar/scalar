import { describe, expect, it } from 'vitest'

import { objectEntries } from './object-entries'

describe('objectEntries', () => {
  it('returns entries of a simple object with correct key-value pairs', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const entries = objectEntries(obj)
    expect(entries).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])
  })

  it('preserves type information for keys and values', () => {
    const obj = { name: 'John', age: 30 } as const
    const entries = objectEntries(obj)

    // TypeScript should infer entries as [('name' | 'age'), string | number][]
    type ExpectedKey = 'name' | 'age'
    type ExpectedValue = 'John' | 30

    // Type check: keys should be the union of object keys
    const firstEntry = entries[0]
    if (firstEntry) {
      const _keyCheck: ExpectedKey = firstEntry[0]
      _keyCheck

      // Type check: values should be the union of object values
      const _valueCheck: ExpectedValue = firstEntry[1]
      _valueCheck
    }
  })

  it('handles objects with mixed value types correctly', () => {
    const obj = {
      string: 'hello',
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
      array: [1, 2, 3],
      object: { nested: 'value' },
    }
    const entries = objectEntries(obj)

    expect(entries).toHaveLength(7)
    expect(entries).toContainEqual(['string', 'hello'])
    expect(entries).toContainEqual(['number', 42])
    expect(entries).toContainEqual(['boolean', true])
    expect(entries).toContainEqual(['null', null])
    expect(entries).toContainEqual(['undefined', undefined])
    expect(entries).toContainEqual(['array', [1, 2, 3]])
    expect(entries).toContainEqual(['object', { nested: 'value' }])
  })

  it('returns empty array for empty object', () => {
    const obj = {}
    const entries = objectEntries(obj)
    expect(entries).toEqual([])
  })

  it('maintains type narrowing for discriminated unions', () => {
    type Success = { status: 'success'; data: string }
    type Error = { status: 'error'; message: string }
    type Result = Success | Error

    const successResult: Result = { status: 'success', data: 'hello' }
    const entries = objectEntries(successResult)

    // Type check: entries should work with discriminated unions
    // Note: keyof Result only includes common keys ('status')
    // For all possible keys, we need to use keyof Success | keyof Error
    type AllKeys = keyof Success | keyof Error
    type AllValues = Success[keyof Success] | Error[keyof Error]

    const firstEntry = entries[0]
    if (firstEntry) {
      const _keyCheck: AllKeys = firstEntry[0]
      const _valueCheck: AllValues = firstEntry[1]
      _keyCheck
      _valueCheck
    }

    // Runtime check
    expect(entries).toContainEqual(['status', 'success'])
    expect(entries).toContainEqual(['data', 'hello'])
  })

  it('handles objects with optional properties', () => {
    type User = {
      id: string
      name: string
      email?: string
      age?: number
    }

    const userWithOptional: User = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
    }

    const entries = objectEntries(userWithOptional)

    // Type check: keys should include optional properties
    type ExpectedKey = keyof User
    const firstEntry = entries[0]
    if (firstEntry) {
      const _keyCheck: ExpectedKey = firstEntry[0]
      _keyCheck
    }

    // Runtime check
    expect(entries).toHaveLength(3)
    expect(entries).toContainEqual(['id', '123'])
    expect(entries).toContainEqual(['name', 'John'])
    expect(entries).toContainEqual(['email', 'john@example.com'])
  })

  it('works with objects containing symbol keys', () => {
    const sym = Symbol('test')
    const obj = {
      regular: 'value',
      [sym]: 'symbol value',
    }

    const entries = objectEntries(obj)

    // Object.entries does not include symbol keys
    expect(entries).toHaveLength(1)
    expect(entries).toContainEqual(['regular', 'value'])
  })

  it('handles readonly objects correctly', () => {
    const obj = {
      a: 1,
      b: 2,
    } as const

    const entries = objectEntries(obj)

    // Type check: should work with readonly objects
    type ExpectedKey = 'a' | 'b'
    type ExpectedValue = 1 | 2

    const firstEntry = entries[0]
    if (firstEntry) {
      const _keyCheck: ExpectedKey = firstEntry[0]
      const _valueCheck: ExpectedValue = firstEntry[1]
      _keyCheck
      _valueCheck
    }

    // Runtime check
    expect(entries).toEqual([
      ['a', 1],
      ['b', 2],
    ])
  })

  it('preserves value types for objects with function properties', () => {
    const obj = {
      name: 'test',
      execute: () => 'result',
      compute: (x: number) => x * 2,
    }

    const entries = objectEntries(obj)

    // Type check: functions should be preserved in the type
    type ExpectedKey = 'name' | 'execute' | 'compute'
    const firstEntry = entries[0]
    if (firstEntry) {
      const _keyCheck: ExpectedKey = firstEntry[0]
      _keyCheck
    }

    // Runtime check
    expect(entries).toHaveLength(3)
    const entry0 = entries[0]
    const entry1 = entries[1]
    const entry2 = entries[2]
    if (entry0) {
      expect(entry0).toEqual(['name', 'test'])
    }
    if (entry1) {
      expect(entry1[0]).toBe('execute')
      expect(typeof entry1[1]).toBe('function')
    }
    if (entry2) {
      expect(entry2[0]).toBe('compute')
      expect(typeof entry2[1]).toBe('function')
    }
  })

  it('handles nested objects without flattening', () => {
    const obj = {
      user: {
        name: 'John',
        address: {
          city: 'NYC',
          zip: '10001',
        },
      },
      settings: {
        theme: 'dark',
      },
    }

    const entries = objectEntries(obj)

    // Type check: nested objects should remain as objects in the value type
    type ExpectedKey = 'user' | 'settings'
    const firstEntry = entries[0]
    if (firstEntry) {
      const _keyCheck: ExpectedKey = firstEntry[0]
      _keyCheck
    }

    // Runtime check: nested objects should not be flattened
    expect(entries).toHaveLength(2)
    expect(entries).toContainEqual([
      'user',
      {
        name: 'John',
        address: {
          city: 'NYC',
          zip: '10001',
        },
      },
    ])
    expect(entries).toContainEqual(['settings', { theme: 'dark' }])
  })
})
