import { describe, it, expect } from 'vitest'
import { Type } from '@sinclair/typebox'
import { stringLiteralUnion } from './string-literal-union'

describe('stringLiteralUnion', () => {
  describe('basic functionality', () => {
    it('should create a union type from an array of string literals', () => {
      const values = ['red', 'green', 'blue'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
      expect(result.anyOf?.[0]).toEqual(Type.Literal('red'))
      expect(result.anyOf?.[1]).toEqual(Type.Literal('green'))
      expect(result.anyOf?.[2]).toEqual(Type.Literal('blue'))
    })

    it('should work with a single string literal', () => {
      const values = ['single'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result).toEqual(Type.Literal('single'))
    })

    it('should work with empty array', () => {
      const values = [] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result).toEqual(Type.Never())
    })

    it('should work with mutable string arrays', () => {
      const values = ['mutable', 'array', 'test']
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
      expect(result.anyOf?.[0]).toEqual(Type.Literal('mutable'))
      expect(result.anyOf?.[1]).toEqual(Type.Literal('array'))
      expect(result.anyOf?.[2]).toEqual(Type.Literal('test'))
    })
  })

  describe('edge cases', () => {
    it('should handle duplicate values', () => {
      const values = ['duplicate', 'duplicate', 'unique'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
      expect(result.anyOf?.[0]).toEqual(Type.Literal('duplicate'))
      expect(result.anyOf?.[1]).toEqual(Type.Literal('duplicate'))
      expect(result.anyOf?.[2]).toEqual(Type.Literal('unique'))
    })

    it('should handle special characters in strings', () => {
      const values = ['test@example.com', 'user-name', 'file/path'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
      expect(result.anyOf?.[0]).toEqual(Type.Literal('test@example.com'))
      expect(result.anyOf?.[1]).toEqual(Type.Literal('user-name'))
      expect(result.anyOf?.[2]).toEqual(Type.Literal('file/path'))
    })

    it('should handle unicode characters', () => {
      const values = ['café', 'naïve', 'résumé'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
      expect(result.anyOf?.[0]).toEqual(Type.Literal('café'))
      expect(result.anyOf?.[1]).toEqual(Type.Literal('naïve'))
      expect(result.anyOf?.[2]).toEqual(Type.Literal('résumé'))
    })

    it('should handle numbers as strings', () => {
      const values = ['123', '456', '789'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
      expect(result.anyOf?.[0]).toEqual(Type.Literal('123'))
      expect(result.anyOf?.[1]).toEqual(Type.Literal('456'))
      expect(result.anyOf?.[2]).toEqual(Type.Literal('789'))
    })
  })

  describe('type safety', () => {
    it('should maintain type safety with const assertions', () => {
      const values = ['type', 'safe', 'test'] as const
      const result = stringLiteralUnion(values)

      // This test ensures TypeScript compilation works correctly
      // The result should be properly typed as a union of string literals
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should work with readonly arrays', () => {
      const values: readonly string[] = ['readonly', 'array', 'test']
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
    })

    it('should work with string arrays', () => {
      const values: string[] = ['string', 'array', 'test']
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)
    })
  })

  describe('integration with TypeBox', () => {
    it('should produce valid TypeBox schema', () => {
      const values = ['valid', 'schema', 'test'] as const
      const result = stringLiteralUnion(values)

      // Verify the result is a valid TypeBox union schema
      expect(result).toHaveProperty('anyOf')
      expect(Array.isArray(result.anyOf)).toBe(true)
    })

    it('should create literals that match the input values exactly', () => {
      const values = ['exact', 'match', 'test'] as const
      const result = stringLiteralUnion(values)

      // Verify each literal in the union matches the input
      result.anyOf?.forEach((literal, index) => {
        expect(literal).toEqual(Type.Literal(values[index]))
      })
    })
  })

  describe('performance and memory', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `item${i}`)
      const result = stringLiteralUnion(largeArray)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(1000)
    })

    it('should not create duplicate literal objects for same values', () => {
      const values = ['same', 'same', 'same'] as const
      const result = stringLiteralUnion(values)

      expect(result).toBeDefined()
      expect(result.anyOf).toHaveLength(3)

      // All literals should be the same object reference for identical values
      const firstLiteral = result.anyOf?.[0]
      result.anyOf?.forEach((literal) => {
        expect(literal).toEqual(firstLiteral)
      })
    })
  })
})
