import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { getResolvedRefDeep } from './get-resolved-ref-deep'
import { describe, expect, it } from 'vitest'

describe('getResolvedRefDeep', () => {
  describe('basic functionality', () => {
    it('should return the node as-is when it does not contain a $ref', () => {
      const node = { name: 'test', value: 42 }
      const result = getResolvedRefDeep(node)

      expect(result).toEqual({ name: 'test', value: 42 })
    })

    it('should resolve a single level $ref node', () => {
      const refNode = { $ref: '#/components/schemas/User', '$ref-value': { id: 1, name: 'John' } }
      const result = getResolvedRefDeep(refNode)

      expect(result).toEqual({ id: 1, name: 'John' })
    })

    it('should handle primitives', () => {
      expect(getResolvedRefDeep('string')).toBe('string')
      expect(getResolvedRefDeep(123)).toBe(123)
      expect(getResolvedRefDeep(true)).toBe(true)
      expect(getResolvedRefDeep(null)).toBe(null)
      expect(getResolvedRefDeep(undefined)).toBe(undefined)
    })
  })

  describe('deep reference resolution', () => {
    it('should resolve nested $ref objects', () => {
      const deepRefNode = {
        $ref: '#/components/schemas/Response',
        '$ref-value': {
          data: {
            $ref: '#/components/schemas/User',
            '$ref-value': { id: 1, name: 'John' },
          },
          metadata: {
            total: 1,
          },
        },
      }

      const result = getResolvedRefDeep(deepRefNode)

      expect(result).toEqual({
        data: { id: 1, name: 'John' },
        metadata: { total: 1 },
      })
    })

    it('should resolve multiple nested $ref objects at the same level', () => {
      const multiRefNode = {
        user: {
          $ref: '#/components/schemas/User',
          '$ref-value': { id: 1, name: 'John' },
        },
        profile: {
          $ref: '#/components/schemas/Profile',
          '$ref-value': { bio: 'Software Engineer', location: 'NYC' },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      }

      const result = getResolvedRefDeep(multiRefNode)

      expect(result).toEqual({
        user: { id: 1, name: 'John' },
        profile: { bio: 'Software Engineer', location: 'NYC' },
        settings: { theme: 'dark', notifications: true },
      })
    })

    it('should resolve deeply nested $ref objects (3+ levels)', () => {
      const veryDeepRefNode = {
        $ref: '#/components/schemas/Organization',
        '$ref-value': {
          name: 'Acme Corp',
          departments: {
            engineering: {
              $ref: '#/components/schemas/Department',
              '$ref-value': {
                name: 'Engineering',
                lead: {
                  $ref: '#/components/schemas/User',
                  '$ref-value': { id: 1, name: 'John', role: 'Tech Lead' },
                },
                members: [
                  {
                    $ref: '#/components/schemas/User',
                    '$ref-value': { id: 2, name: 'Jane', role: 'Developer' },
                  },
                  {
                    $ref: '#/components/schemas/User',
                    '$ref-value': { id: 3, name: 'Bob', role: 'Designer' },
                  },
                ],
              },
            },
          },
        },
      }

      const result = getResolvedRefDeep(veryDeepRefNode)

      expect(result).toEqual({
        name: 'Acme Corp',
        departments: {
          engineering: {
            name: 'Engineering',
            lead: { id: 1, name: 'John', role: 'Tech Lead' },
            members: [
              { id: 2, name: 'Jane', role: 'Developer' },
              { id: 3, name: 'Bob', role: 'Designer' },
            ],
          },
        },
      })
    })

    it('should resolve refs inside arrays', () => {
      const arrayWithRefs = [
        {
          $ref: '#/components/schemas/User',
          '$ref-value': { id: 1, name: 'John' },
        },
        {
          $ref: '#/components/schemas/User',
          '$ref-value': { id: 2, name: 'Jane' },
        },
        { id: 3, name: 'Bob' }, // Non-ref object
      ]

      const result = getResolvedRefDeep(arrayWithRefs)

      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 3, name: 'Bob' },
      ])
    })

    it('should resolve nested arrays with refs', () => {
      const nestedArrayWithRefs = {
        users: [
          {
            $ref: '#/components/schemas/User',
            '$ref-value': {
              id: 1,
              name: 'John',
              tags: [
                {
                  $ref: '#/components/schemas/Tag',
                  '$ref-value': { name: 'admin', color: 'red' },
                },
              ],
            },
          },
        ],
      }

      const result = getResolvedRefDeep(nestedArrayWithRefs)

      expect(result).toEqual({
        users: [
          {
            id: 1,
            name: 'John',
            tags: [{ name: 'admin', color: 'red' }],
          },
        ],
      })
    })

    it('should handle mixed data types with refs', () => {
      const mixedData = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayValue: ['item1', 'item2'],
        refValue: {
          $ref: '#/components/schemas/Config',
          '$ref-value': {
            enabled: true,
            nested: {
              $ref: '#/components/schemas/NestedConfig',
              '$ref-value': { timeout: 5000 },
            },
          },
        },
      }

      const result = getResolvedRefDeep(mixedData)

      expect(result).toEqual({
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayValue: ['item1', 'item2'],
        refValue: {
          enabled: true,
          nested: { timeout: 5000 },
        },
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const result = getResolvedRefDeep({})
      expect(result).toEqual({})
    })

    it('should handle empty arrays', () => {
      const result = getResolvedRefDeep([])
      expect(result).toEqual([])
    })

    it('should handle refs with no $ref-value', () => {
      const invalidRef = { $ref: '#/invalid' }
      const result = getResolvedRefDeep(invalidRef)

      // Should resolve to undefined since $ref-value is missing
      expect(result).toBeUndefined()
    })

    it('should handle refs with null $ref-value', () => {
      const nullRef = { $ref: '#/null', '$ref-value': null }
      // @ts-expect-error - just a test
      const result = getResolvedRefDeep(nullRef)

      expect(result).toBeNull()
    })

    it('should handle refs with array $ref-value', () => {
      type User = { id: number; name: string }

      const arrayRef = {
        $ref: '#/components/arrays/Users',
        '$ref-value': [
          {
            $ref: '#/components/schemas/User',
            '$ref-value': { id: 1, name: 'John' } as User,
          },
        ],
      }

      // @ts-expect-error - just a test
      const result = getResolvedRefDeep(arrayRef)

      expect(result).toEqual([{ id: 1, name: 'John' }])
    })

    it('should handle true circular references gracefully', () => {
      // Create objects that will reference each other
      type User = { id: number; name: string; department: Department }
      type Department = { id: string; name: string; manager: User; employees: User[] }

      const userRef = {
        $ref: '#/components/schemas/User',
        '$ref-value': {} as User,
      }

      const departmentRef = {
        $ref: '#/components/schemas/Department',
        '$ref-value': {} as Department,
      }

      // Set up circular references
      userRef['$ref-value'] = {
        id: 1,
        name: 'John',
        // @ts-expect-error - just a test
        department: departmentRef,
      }

      departmentRef['$ref-value'] = {
        id: 'eng',
        name: 'Engineering',
        // @ts-expect-error - just a test
        manager: userRef,
        // @ts-expect-error - just a test
        employees: [userRef],
      }

      const testData = {
        user: userRef,
        department: departmentRef,
      }

      // Should handle circular references gracefully without infinite loops
      const result = getResolvedRefDeep(testData)
      expect(result).toBeDefined()
      expect(result?.user?.id).toBe(1)
      expect(result?.user?.name).toBe('John')
      expect(result?.department?.id).toBe('eng')
      expect(result?.department?.name).toBe('Engineering')
      expect(result?.department?.manager?.department).toBe('[circular]')
    })

    it('should handle self-referencing objects gracefully', () => {
      type Node = { id: string; value: string; parent: Node; children: Node[] }

      const selfRef = {
        $ref: '#/components/schemas/Node',
        '$ref-value': {} as Node,
      }

      // Create a self-referencing structure
      selfRef['$ref-value'] = {
        id: 'root',
        value: 'test',
        // @ts-expect-error - just a test
        parent: selfRef,
        // @ts-expect-error - just a test
        children: [selfRef],
      }

      // Should handle self-references gracefully without infinite loops
      const result = getResolvedRefDeep(selfRef)
      expect(result).toBeDefined()
      expect(result.id).toBe('root')
      expect(result.value).toBe('test')
      // The circular references should be handled gracefully
      expect(result.parent).toBeDefined()
      expect(Array.isArray(result.children)).toBe(true)
    })

    it('should handle indirect circular references gracefully', () => {
      type NodeA = { id: string; next: NodeB }
      type NodeB = { id: string; next: NodeC }
      type NodeC = { id: string; next: NodeA }

      const nodeARef = {
        $ref: '#/components/schemas/NodeA',
        '$ref-value': {} as NodeA,
      }

      const nodeBRef = {
        $ref: '#/components/schemas/NodeB',
        '$ref-value': {} as NodeB,
      }

      const nodeCRef = {
        $ref: '#/components/schemas/NodeC',
        '$ref-value': {} as NodeC,
      }

      // Create A -> B -> C -> A circular chain
      nodeARef['$ref-value'] = {
        id: 'A',
        // @ts-expect-error - just a test
        next: nodeBRef,
      }

      nodeBRef['$ref-value'] = {
        id: 'B',
        // @ts-expect-error - just a test
        next: nodeCRef,
      }

      nodeCRef['$ref-value'] = {
        id: 'C',
        // @ts-expect-error - just a test
        next: nodeARef, // Back to A
      }

      // Should handle indirect circular references gracefully
      const result = getResolvedRefDeep(nodeARef)
      expect(result).toBeDefined()
      expect(result.id).toBe('A')
      expect(result.next).toBeDefined()
      expect(result.next.id).toBe('B')
      expect(result.next.next).toBeDefined()
      expect(result.next.next.id).toBe('C')
      // The circular reference should be broken gracefully
      expect(result.next.next.next).toBeDefined()
    })
  })

  describe('real-world OpenAPI scenarios', () => {
    it('should resolve OpenAPI response with nested schema refs', () => {
      const doc = {
        openapi: '3.0.1',
        info: {
          title: 'API with Circular Dependencies',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Base: {
              required: ['Type'],
              type: 'object',
              anyOf: [{ $ref: '#/components/schemas/Derived1' }, { $ref: '#/components/schemas/Derived2' }],
              discriminator: {
                propertyName: 'Type',
                mapping: {
                  Value1: '#/components/schemas/Derived1',
                  Value2: '#/components/schemas/Derived2',
                },
              },
            },
            Derived1: {
              properties: {
                Type: {
                  enum: ['Value1'],
                  type: 'string',
                },
              },
            },
            Derived2: {
              required: ['Ref'],
              properties: {
                Type: {
                  enum: ['Value2'],
                  type: 'string',
                },
                Ref: {
                  $ref: '#/components/schemas/Base',
                },
              },
            },
          },
        },
      }
      const proxied = createMagicProxy(doc)

      const result = getResolvedRefDeep(proxied)

      expect(result).toEqual({
        openapi: '3.0.1',
        info: { title: 'API with Circular Dependencies', version: '1.0.0' },
        components: {
          schemas: {
            Base: {
              required: ['Type'],
              type: 'object',
              anyOf: [
                {
                  properties: { Type: { enum: ['Value1'], type: 'string' } },
                },
                {
                  required: ['Ref'],
                  properties: {
                    Type: { enum: ['Value2'], type: 'string' },
                    Ref: '[circular]',
                  },
                },
              ],
              discriminator: {
                propertyName: 'Type',
                mapping: {
                  Value1: '#/components/schemas/Derived1',
                  Value2: '#/components/schemas/Derived2',
                },
              },
            },
            Derived1: {
              properties: { Type: { enum: ['Value1'], type: 'string' } },
            },
            Derived2: {
              required: ['Ref'],
              properties: {
                Type: { enum: ['Value2'], type: 'string' },
                Ref: {
                  required: ['Type'],
                  type: 'object',
                  anyOf: [
                    {
                      properties: { Type: { enum: ['Value1'], type: 'string' } },
                    },
                    '[circular]',
                  ],
                  discriminator: {
                    propertyName: 'Type',
                    mapping: {
                      Value1: '#/components/schemas/Derived1',
                      Value2: '#/components/schemas/Derived2',
                    },
                  },
                },
              },
            },
          },
        },
      })
    })
  })
})
