import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it, vi } from 'vitest'

import { type Dereference, getResolvedRef } from './get-resolved-ref'

describe('get-resolved-ref', () => {
  describe.todo('multiple ref depth', () => {
    it('should resolved deeply nested $refs #1', () => {
      const input = createMagicProxy({
        a: { $ref: '#/b' },
        b: { $ref: '#/c' },
        c: 'world',
      })

      expect(getResolvedRef(input.a)).toEqual('world')
    })

    it('should resolved deeply nested $refs #2', () => {
      const input = createMagicProxy({
        a: { $ref: '#/b' },
        b: { $ref: '#/c' },
        c: { $ref: '#/d' },
        d: { $ref: '#/e' },
        e: { $ref: '#/f' },
        f: 'world',
      })

      expect(getResolvedRef(input.a)).toEqual('world')
    })

    it('should handle circular references', () => {
      const input = createMagicProxy({
        a: { $ref: '#/b' },
        b: { $ref: '#/c' },
        c: {
          prop: {
            inner: { $ref: '#/b' },
          },
        },
      })

      expect(getRaw(getResolvedRef(input.a))).toEqual({
        'prop': {
          'inner': {
            '$ref': '#/b',
          },
        },
      })
    })

    it('should handle self circular references', () => {
      const input = createMagicProxy({
        a: {
          $ref: '#/a',
        },
      })

      expect(getResolvedRef(input.a)).toEqual(input.a)
    })
  })

  describe('basic functionality', () => {
    it('should resolve a simple $ref', () => {
      const input = createMagicProxy({
        a: { $ref: '#/b' },
        b: 'hello',
      })

      expect(getResolvedRef(input.a)).toEqual('hello')
    })

    it('should return the node as-is when it does not contain a $ref', () => {
      const node = { name: 'test', value: 42 }
      const result = getResolvedRef(node)

      expect(result).toBe(node)
      expect(result).toEqual({ name: 'test', value: 42 })
    })

    it('should resolve a $ref node using default transform', () => {
      const refNode = { $ref: '#/components/schemas/User', '$ref-value': { id: 1, name: 'John' } }
      const result = getResolvedRef(refNode)

      expect(result).toEqual({ id: 1, name: 'John' })
    })

    it('should work with custom transform function', () => {
      const refNode = { $ref: '#/components/schemas/User', '$ref-value': { id: 1, name: 'John' } }
      const customTransform = (node: any) => ({ ...node['$ref-value'], transformed: true })

      const result = getResolvedRef(refNode, customTransform)

      expect(result).toEqual({ id: 1, name: 'John', transformed: true })
    })
  })

  describe('edge cases', () => {
    it('should handle null input', () => {
      const result = getResolvedRef(null)
      expect(result).toBeNull()
    })

    it('should handle undefined input', () => {
      const result = getResolvedRef(undefined)
      expect(result).toBeUndefined()
    })

    it('should handle primitive values', () => {
      expect(getResolvedRef('string')).toBe('string')
      expect(getResolvedRef(123)).toBe(123)
      expect(getResolvedRef(true)).toBe(true)
      expect(getResolvedRef(false)).toBe(false)
      expect(getResolvedRef(0)).toBe(0)
      expect(getResolvedRef('')).toBe('')
    })

    it('should handle empty object without $ref', () => {
      const emptyObj = {}
      const result = getResolvedRef(emptyObj)

      expect(result).toBe(emptyObj)
      expect(result).toEqual({})
    })

    it('should handle object with $ref property but not a ref node', () => {
      const objWithRef = { $ref: 'not-a-ref-node', other: 'property' }
      const result = getResolvedRef(objWithRef)

      // The function treats any object with $ref as a ref node, so it calls transform
      // The default transform tries to access '$ref-value' which is undefined
      expect(result).toBeUndefined()
    })

    it('should handle object with $ref-value but no $ref', () => {
      const objWithRefValue = { '$ref-value': { data: 'test' }, other: 'property' }
      const result = getResolvedRef(objWithRefValue)

      // Should return as-is since it doesn't have $ref
      expect(result).toBe(objWithRefValue)
      expect(result).toEqual({ '$ref-value': { data: 'test' }, other: 'property' })
    })
  })

  describe('transform function behavior', () => {
    it('should call transform function with the ref node', () => {
      const refNode = { $ref: '#/test', '$ref-value': { data: 'value' } }
      const mockTransform = vi.fn((node: any) => node['$ref-value'])

      getResolvedRef(refNode, mockTransform)

      expect(mockTransform).toHaveBeenCalledWith(refNode)
      expect(mockTransform).toHaveBeenCalledTimes(1)
    })

    it('should not call transform function for non-ref nodes', () => {
      const regularNode = { data: 'value' }
      const mockTransform = vi.fn()

      getResolvedRef(regularNode, mockTransform)

      expect(mockTransform).not.toHaveBeenCalled()
    })

    it('should handle transform function that returns different types', () => {
      const refNode = { $ref: '#/test', '$ref-value': { id: 1 } }

      // Transform that returns a string
      const stringTransform = () => 'transformed' as any
      expect(getResolvedRef(refNode, stringTransform)).toBe('transformed')

      // Transform that returns a number
      const numberTransform = () => 42 as any
      expect(getResolvedRef(refNode, numberTransform)).toBe(42)

      // Transform that returns null
      const nullTransform = () => null as any
      expect(getResolvedRef(refNode, nullTransform)).toBeNull()
    })
  })

  describe('type safety', () => {
    it('should maintain type safety with generic types', () => {
      type User = { id: number; name: string }
      type UserRef = Partial<User> & { $ref: string; '$ref-value': User }

      const userRef: UserRef = { $ref: '#/components/User', '$ref-value': { id: 1, name: 'John' } }
      const result = getResolvedRef(userRef)

      // TypeScript should infer this as User
      expect(result?.id).toBe(1)
      expect(result?.name).toBe('John')
    })

    it('should work with complex nested types', () => {
      const complexRef = {
        $ref: '#/components/Complex',
        '$ref-value': {
          id: 'complex-1',
          metadata: {
            tags: ['tag1', 'tag2'],
            created: '2023-01-01',
          },
        },
      }

      const result = getResolvedRef(complexRef)

      expect(result.id).toBe('complex-1')
      expect(result.metadata.tags).toEqual(['tag1', 'tag2'])
      expect(result.metadata.created).toBe('2023-01-01')
    })
  })

  describe('Dereference type helper', () => {
    it('should correctly infer types for ref nodes', () => {
      type User = { id: number; name: string }
      type UserRef = { $ref: string; '$ref-value': User }

      // This should compile and infer the correct type
      const _test: Dereference<UserRef> = { id: 1, name: 'John' }
      expect(_test).toBeDefined()
    })

    it('should correctly infer types for non-ref nodes', () => {
      type RegularNode = { data: string }

      // This should compile and infer the correct type
      const _test: Dereference<RegularNode> = { data: 'test' }
      expect(_test).toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle OpenAPI-style references', () => {
      const schemaRef = {
        $ref: '#/components/schemas/User',
        '$ref-value': {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
        },
      }

      const result = getResolvedRef(schemaRef)

      expect(result).toEqual({
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
      })
    })

    it('should handle deeply nested references', () => {
      const nestedRef = {
        $ref: '#/deeply/nested/reference',
        '$ref-value': {
          level1: {
            level2: {
              level3: {
                value: 'deeply nested',
              },
            },
          },
        },
      }

      const result = getResolvedRef(nestedRef)

      expect(result.level1.level2.level3.value).toBe('deeply nested')
    })

    it('should handle array references', () => {
      const arrayRef = {
        $ref: '#/components/arrays/Users',
        '$ref-value': [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
      } as any

      const result = getResolvedRef(arrayRef)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect((result as any)[0].name).toBe('User 1')
      expect((result as any)[1].name).toBe('User 2')
    })
  })
})
