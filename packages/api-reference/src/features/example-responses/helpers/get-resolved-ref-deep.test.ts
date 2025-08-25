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
      if (result.user === '[circular]') {
        throw new Error('User is circular')
      }
      expect(result?.user?.id).toBe(1)
      expect(result?.user?.name).toBe('John')
      if (result.department === '[circular]') {
        throw new Error('Department is circular')
      }
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

    it('should handle complex OpenAPI document with multiple circular references that could break WeakSet tracking', () => {
      // This test creates a complex OpenAPI document using createMagicProxy
      // that mimics real-world scenarios where the WeakSet removal logic could fail

      // Create a complex OpenAPI document with deeply nested circular references
      const openAPIDoc = {
        openapi: '3.0.1',
        info: {
          title: 'API with Complex Circular Dependencies',
          version: '1.0.0',
        },
        components: {
          schemas: {
            // Base schema that will be referenced by multiple others
            BaseEntity: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                metadata: { $ref: '#/components/schemas/Metadata' },
                relationships: { $ref: '#/components/schemas/Relationships' },
              },
            },

            // Metadata schema that references back to entities
            Metadata: {
              type: 'object',
              properties: {
                created: { type: 'string', format: 'date-time' },
                updated: { type: 'string', format: 'date-time' },
                source: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                tags: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Tag' },
                },
              },
            },

            // Tag schema that references entities
            Tag: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                entities: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                },
                category: { $ref: '#/components/schemas/Category' },
              },
            },

            // Category schema with circular references
            Category: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                parent: { $ref: '#/components/schemas/Category' }, // Self-reference
                children: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' }, // Self-reference
                },
                entities: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                },
              },
            },

            // Relationships schema with complex circular references
            Relationships: {
              type: 'object',
              properties: {
                owner: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                members: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                },
                groups: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Group' },
                },
                permissions: { $ref: '#/components/schemas/Permissions' },
              },
            },

            // Group schema with circular references
            Group: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                members: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                },
                subgroups: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Group' }, // Self-reference
                },
                parent: { $ref: '#/components/schemas/Group' }, // Self-reference
                permissions: { $ref: '#/components/schemas/Permissions' },
              },
            },

            // Permissions schema with circular references
            Permissions: {
              type: 'object',
              properties: {
                read: { type: 'boolean' },
                write: { type: 'boolean' },
                admin: { type: 'boolean' },
                entities: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                },
                groups: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Group' }, // Circular reference
                },
                inheritedFrom: { $ref: '#/components/schemas/Permissions' }, // Self-reference
              },
            },

            // Extended entity with additional circular references
            ExtendedEntity: {
              allOf: [
                { $ref: '#/components/schemas/BaseEntity' },
                {
                  type: 'object',
                  properties: {
                    extendedData: { $ref: '#/components/schemas/ExtendedData' },
                    history: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/HistoryEntry' },
                    },
                  },
                },
              ],
            },

            // Extended data with circular references
            ExtendedData: {
              type: 'object',
              properties: {
                source: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                related: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                },
                config: { $ref: '#/components/schemas/Config' },
              },
            },

            // History entry with circular references
            HistoryEntry: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                action: { type: 'string' },
                entity: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                user: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                changes: { $ref: '#/components/schemas/Changes' },
              },
            },

            // Changes schema with circular references
            Changes: {
              type: 'object',
              properties: {
                before: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                after: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                diff: { type: 'object' },
              },
            },

            // Config schema with circular references
            Config: {
              type: 'object',
              properties: {
                settings: { type: 'object' },
                defaults: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                rules: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Rule' },
                },
              },
            },

            // Rule schema with circular references
            Rule: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                condition: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                action: { $ref: '#/components/schemas/Action' },
                target: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
              },
            },

            // Action schema with circular references
            Action: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                parameters: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
                result: { $ref: '#/components/schemas/BaseEntity' }, // Circular reference
              },
            },
          },
        },
        paths: {
          '/entities': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/BaseEntity' },
                      },
                    },
                  },
                },
              },
            },
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/BaseEntity' },
                  },
                },
              },
              responses: {
                '201': {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ExtendedEntity' },
                    },
                  },
                },
              },
            },
          },
          '/entities/{id}': {
            get: {
              parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ExtendedEntity' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      // Create a magic proxy from the OpenAPI document
      // This should create the same type of structure that causes issues in real-world usage
      const proxiedDoc = createMagicProxy(openAPIDoc)

      // This complex structure with multiple circular references should test the WeakSet tracking
      // The function might hit the issue described in the GitHub discussion where
      // visited.delete(raw) calls remove objects from circular reference protection too early
      const result = getResolvedRefDeep(proxiedDoc)

      // The function should either handle this gracefully or potentially hit the stack overflow
      expect(result).toBeDefined()

      // Check basic structure
      if (result && typeof result === 'object') {
        expect(result.openapi).toBe('3.0.1')
        expect(result.info).toBeDefined()
        expect(result.components).toBeDefined()
        expect(result.paths).toBeDefined()

        // Check that schemas are resolved
        if (result.components && typeof result.components === 'object') {
          expect(result.components.schemas).toBeDefined()

          // Check that some key schemas are resolved
          if (result.components.schemas && typeof result.components.schemas === 'object') {
            expect(result.components.schemas.BaseEntity).toBeDefined()
            expect(result.components.schemas.Metadata).toBeDefined()
            expect(result.components.schemas.Category).toBeDefined()
            expect(result.components.schemas.Group).toBeDefined()
            expect(result.components.schemas.Permissions).toBeDefined()
            expect(result.components.schemas.ExtendedEntity).toBeDefined()
          }
        }

        // Check that paths are resolved
        if (result.paths && typeof result.paths === 'object') {
          expect(result.paths['/entities']).toBeDefined()
          expect(result.paths['/entities/{id}']).toBeDefined()
        }
      }
    })
  })
})
