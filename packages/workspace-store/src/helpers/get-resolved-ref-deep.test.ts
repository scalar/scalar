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

      // Use type assertion to work around strict typing
      const result = getResolvedRefDeep(arrayRef)

      expect(result).toEqual([{ id: 1, name: 'John' }])
    })

    it('should handle circular-like structures (different refs)', () => {
      const circularLike = {
        parent: {
          $ref: '#/components/schemas/Parent',
          '$ref-value': {
            id: 1,
            child: {
              $ref: '#/components/schemas/Child',
              '$ref-value': {
                id: 2,
                parentId: 1,
              },
            },
          },
        },
      }

      const result = getResolvedRefDeep(circularLike)

      expect(result).toEqual({
        parent: {
          id: 1,
          child: {
            id: 2,
            parentId: 1,
          },
        },
      })
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
        // @ts-expect-error nobody cares
        department: departmentRef,
      }

      departmentRef['$ref-value'] = {
        id: 'eng',
        name: 'Engineering',
        // @ts-expect-error nobody cares
        manager: userRef,
        // @ts-expect-error nobody cares
        employees: [userRef],
      }

      const testData = {
        user: userRef,
        department: departmentRef,
      }

      // Should handle circular references gracefully without infinite loops
      const result = getResolvedRefDeep(testData)
      expect(result).toBeDefined()
      expect(result.user.id).toBe(1)
      expect(result.user.name).toBe('John')
      expect(result.department.id).toBe('eng')
      expect(result.department.name).toBe('Engineering')
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
        // @ts-expect-error nobody cares
        parent: selfRef,
        // @ts-expect-error nobody cares
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
        // @ts-expect-error nobody cares
        next: nodeBRef,
      }

      nodeBRef['$ref-value'] = {
        id: 'B',
        // @ts-expect-error nobody cares
        next: nodeCRef,
      }

      nodeCRef['$ref-value'] = {
        id: 'C',
        // @ts-expect-error nobody cares
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
      const openApiResponse = {
        $ref: '#/components/responses/UserListResponse',
        '$ref-value': {
          description: 'A list of users',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserList',
                '$ref-value': {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                        '$ref-value': {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                            profile: {
                              $ref: '#/components/schemas/Profile',
                              '$ref-value': {
                                type: 'object',
                                properties: {
                                  bio: { type: 'string' },
                                  avatar: { type: 'string' },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    meta: {
                      $ref: '#/components/schemas/Pagination',
                      '$ref-value': {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = getResolvedRefDeep(openApiResponse)

      expect(result).toEqual({
        description: 'A list of users',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      profile: {
                        type: 'object',
                        properties: {
                          bio: { type: 'string' },
                          avatar: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                meta: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      })
    })

    it('should resolve OpenAPI operation with parameter refs', () => {
      const openApiOperation = {
        summary: 'Get user by ID',
        parameters: [
          {
            $ref: '#/components/parameters/UserId',
            '$ref-value': {
              name: 'userId',
              in: 'path',
              required: true,
              schema: {
                $ref: '#/components/schemas/IntegerId',
                '$ref-value': { type: 'integer', minimum: 1 },
              },
            },
          },
          {
            name: 'include',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            $ref: '#/components/responses/UserResponse',
            '$ref-value': {
              description: 'User found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
                    '$ref-value': { type: 'object' },
                  },
                },
              },
            },
          },
        },
      }

      const result = getResolvedRefDeep(openApiOperation)

      expect(result).toEqual({
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'include',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
      })
    })
  })
})
