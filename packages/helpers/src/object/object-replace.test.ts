import { describe, it, expect } from 'vitest'
import { objectReplace } from './object-replace'

describe('objectReplace', () => {
  it('should replace all properties in the target object', () => {
    const target = { a: 1, b: 2 }
    const replacement = { a: 3, b: 4 }

    const result = objectReplace(target, replacement)

    expect(result).toEqual({ a: 3, b: 4 })
    expect(target).toBe(result) // Should modify the original object
  })

  it('should remove properties that exist in target but not in replacement', () => {
    const target = { a: 1, b: 2, c: 3 }
    const replacement = { a: 4, b: 5 }

    const result = objectReplace(target, replacement)

    expect(result).toEqual({ a: 4, b: 5 })
    expect('c' in result).toBe(false)
  })

  it('should add new properties from replacement', () => {
    const target = { a: 1 }
    const replacement = { a: 2, b: 3 }

    const result = objectReplace(target, replacement)

    expect(result).toEqual({ a: 2, b: 3 })
  })

  it('should handle empty objects', () => {
    const target = {}
    const replacement = {}

    const result = objectReplace(target, replacement)

    expect(result).toEqual({})
  })

  it('should handle nested objects', () => {
    const target = { a: { x: 1 }, b: 2 }
    const replacement = { a: { y: 2 }, b: 3 }

    const result = objectReplace(target, replacement)

    expect(result).toEqual({ a: { y: 2 }, b: 3 })
  })

  it('should preserve the original object reference', () => {
    const target = { a: 1 }
    const replacement = { b: 2 }

    const result = objectReplace(target, replacement)

    expect(result).toBe(target)
  })

  it('should handle different types of values', () => {
    const target = { a: 1, b: 'string', c: true }
    const replacement = { a: 'number', b: 42, c: null }

    const result = objectReplace(target, replacement)

    expect(result).toEqual({ a: 'number', b: 42, c: null })
  })
})
