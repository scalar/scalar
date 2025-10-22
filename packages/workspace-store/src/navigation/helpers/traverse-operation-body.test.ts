import { describe, expect, it } from 'vitest'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'

import { traverseOperationBody } from './traverse-operation-body'

describe('traverseOperationBody', () => {
  const mockGenerateId: TraverseSpecOptions['generateId'] = (props) => {
    if (props.type === 'body') {
      return `body-${props.mediaType}-${props.name}`
    }

    return 'unknown-id'
  }

  const parentId = 'parent-operation-id'

  describe('basic functionality', () => {
    it('should return empty array when operation has no request body', () => {
      const operation: OperationObject = {
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('should return empty array when request body has no content', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {},
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('should extract a single property from request body', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'body',
        id: 'body-application/json-username',
        name: 'username',
        title: 'username',
      })
    })

    it('should extract multiple properties from request body', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                  },
                  email: {
                    type: 'string',
                  },
                  age: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result).toEqual([
        {
          type: 'body',
          id: 'body-application/json-username',
          name: 'username',
          title: 'username',
        },
        {
          type: 'body',
          id: 'body-application/json-email',
          name: 'email',
          title: 'email',
        },
        {
          type: 'body',
          id: 'body-application/json-age',
          name: 'age',
          title: 'age',
        },
      ])
    })

    it('should handle multiple content types', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonField: {
                    type: 'string',
                  },
                },
              },
            },
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  xmlField: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(2)
      expect(result).toEqual([
        {
          type: 'body',
          id: 'body-application/json-jsonField',
          name: 'jsonField',
          title: 'jsonField',
        },
        {
          type: 'body',
          id: 'body-application/xml-xmlField',
          name: 'xmlField',
          title: 'xmlField',
        },
      ])
    })
  })

  describe('edge cases', () => {
    it('should return empty array when content type has no schema', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {},
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('should return empty array when schema is not an object type', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'string',
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('should return empty array when schema is an array type', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('should return empty array when object schema has no properties', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('should return empty array when object schema has empty properties object', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {},
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })
  })

  describe('$ref handling', () => {
    it('should handle request body with $ref', () => {
      const operation: OperationObject = {
        requestBody: {
          $ref: '#/components/requestBodies/UserBody',
          '$ref-value': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'body',
        id: 'body-application/json-username',
        name: 'username',
        title: 'username',
      })
    })

    it('should handle schema with $ref', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
                '$ref-value': {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(2)
      expect(result).toEqual([
        {
          type: 'body',
          id: 'body-application/json-id',
          name: 'id',
          title: 'id',
        },
        {
          type: 'body',
          id: 'body-application/json-name',
          name: 'name',
          title: 'name',
        },
      ])
    })

    it('should handle both request body and schema with $refs', () => {
      const operation: OperationObject = {
        requestBody: {
          $ref: '#/components/requestBodies/UserBody',
          '$ref-value': {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                  '$ref-value': {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'body',
        id: 'body-application/json-email',
        name: 'email',
        title: 'email',
      })
    })
  })

  describe('complex scenarios', () => {
    it('should handle nested object properties correctly', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' },
                    },
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      // Should only extract top-level properties, not nested ones
      expect(result).toHaveLength(2)
      expect(result).toEqual([
        {
          type: 'body',
          id: 'body-application/json-user',
          name: 'user',
          title: 'user',
        },
        {
          type: 'body',
          id: 'body-application/json-metadata',
          name: 'metadata',
          title: 'metadata',
        },
      ])
    })

    it('should handle properties with special characters in names', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  'user-name': {
                    type: 'string',
                  },
                  'email_address': {
                    type: 'string',
                  },
                  'age@value': {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result.map((r) => r.name)).toEqual(['user-name', 'email_address', 'age@value'])
    })

    it('should handle mixed content types with some having valid schemas and others not', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonField: {
                    type: 'string',
                  },
                },
              },
            },
            'application/xml': {
              // No schema
            },
            'text/plain': {
              schema: {
                type: 'string', // Not an object
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  formField: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {},
      }

      const result = traverseOperationBody({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      // Should only extract properties from valid object schemas
      expect(result).toHaveLength(2)
      expect(result).toEqual([
        {
          type: 'body',
          id: 'body-application/json-jsonField',
          name: 'jsonField',
          title: 'jsonField',
        },
        {
          type: 'body',
          id: 'body-application/x-www-form-urlencoded-formField',
          name: 'formField',
          title: 'formField',
        },
      ])
    })
  })
})
