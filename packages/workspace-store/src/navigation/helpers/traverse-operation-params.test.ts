import { describe, expect, it } from 'vitest'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'

import { traverseOperationParams } from './traverse-operation-params'

describe('traverseOperationParams', () => {
  const mockGenerateId: TraverseSpecOptions['generateId'] = (props) => {
    if (props.type === 'parameter') {
      return `param-${props.parameter.in}-${props.parameter.name}`
    }

    return 'unknown-id'
  }

  const parentId = 'parent-operation-id'

  describe('basic functionality', () => {
    it('returns empty array when operation has no parameters', () => {
      const operation: OperationObject = {
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('returns empty array when parameters array is empty', () => {
      const operation: OperationObject = {
        parameters: [],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toEqual([])
    })

    it('extracts a single query parameter', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'parameter',
        id: 'param-query-search',
        in: 'query',
        name: 'search',
        title: 'search',
      })
    })

    it('extracts a single path parameter', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'parameter',
        id: 'param-path-userId',
        in: 'path',
        name: 'userId',
        title: 'userId',
      })
    })

    it('extracts a single header parameter', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'X-API-Key',
            in: 'header',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'parameter',
        id: 'param-header-X-API-Key',
        in: 'header',
        name: 'X-API-Key',
        title: 'X-API-Key',
      })
    })

    it('extracts a single cookie parameter', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'sessionId',
            in: 'cookie',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'parameter',
        id: 'param-cookie-sessionId',
        in: 'cookie',
        name: 'sessionId',
        title: 'sessionId',
      })
    })

    it('extracts multiple parameters', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'search',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'X-API-Key',
            in: 'header',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result).toEqual([
        {
          type: 'parameter',
          id: 'param-path-userId',
          in: 'path',
          name: 'userId',
          title: 'userId',
        },
        {
          type: 'parameter',
          id: 'param-query-search',
          in: 'query',
          name: 'search',
          title: 'search',
        },
        {
          type: 'parameter',
          id: 'param-header-X-API-Key',
          in: 'header',
          name: 'X-API-Key',
          title: 'X-API-Key',
        },
      ])
    })

    it('extracts multiple parameters of the same type', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result).toEqual([
        {
          type: 'parameter',
          id: 'param-query-page',
          in: 'query',
          name: 'page',
          title: 'page',
        },
        {
          type: 'parameter',
          id: 'param-query-limit',
          in: 'query',
          name: 'limit',
          title: 'limit',
        },
        {
          type: 'parameter',
          id: 'param-query-sort',
          in: 'query',
          name: 'sort',
          title: 'sort',
        },
      ])
    })
  })

  describe('$ref handling', () => {
    it('resolves parameter with $ref', () => {
      const operation: OperationObject = {
        parameters: [
          {
            $ref: '#/components/parameters/UserId',
            '$ref-value': {
              name: 'userId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'parameter',
        id: 'param-path-userId',
        in: 'path',
        name: 'userId',
        title: 'userId',
      })
    })

    it('resolves multiple parameters with $refs', () => {
      const operation: OperationObject = {
        parameters: [
          {
            $ref: '#/components/parameters/UserId',
            '$ref-value': {
              name: 'userId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          },
          {
            $ref: '#/components/parameters/ApiKey',
            '$ref-value': {
              name: 'X-API-Key',
              in: 'header',
              schema: {
                type: 'string',
              },
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(2)
      expect(result).toEqual([
        {
          type: 'parameter',
          id: 'param-path-userId',
          in: 'path',
          name: 'userId',
          title: 'userId',
        },
        {
          type: 'parameter',
          id: 'param-header-X-API-Key',
          in: 'header',
          name: 'X-API-Key',
          title: 'X-API-Key',
        },
      ])
    })

    it('resolves mix of $ref and inline parameters', () => {
      const operation: OperationObject = {
        parameters: [
          {
            $ref: '#/components/parameters/UserId',
            '$ref-value': {
              name: 'userId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          },
          {
            name: 'search',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            $ref: '#/components/parameters/ApiKey',
            '$ref-value': {
              name: 'X-API-Key',
              in: 'header',
              schema: {
                type: 'string',
              },
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result).toEqual([
        {
          type: 'parameter',
          id: 'param-path-userId',
          in: 'path',
          name: 'userId',
          title: 'userId',
        },
        {
          type: 'parameter',
          id: 'param-query-search',
          in: 'query',
          name: 'search',
          title: 'search',
        },
        {
          type: 'parameter',
          id: 'param-header-X-API-Key',
          in: 'header',
          name: 'X-API-Key',
          title: 'X-API-Key',
        },
      ])
    })
  })

  describe('complex scenarios', () => {
    it('handles parameters with special characters in names', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'user-id',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'page_number',
            in: 'query',
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'filter[status]',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result.map((r) => r.name)).toEqual(['user-id', 'page_number', 'filter[status]'])
      expect(result.map((r) => r.title)).toEqual(['user-id', 'page_number', 'filter[status]'])
    })

    it('handles all four parameter locations', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'filter',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'Authorization',
            in: 'header',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'sessionToken',
            in: 'cookie',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(4)
      expect(result.map((r) => r.in)).toEqual(['path', 'query', 'header', 'cookie'])
    })

    it('preserves parameter order', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'third',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'first',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'second',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(3)
      expect(result.map((r) => r.name)).toEqual(['third', 'first', 'second'])
    })

    it('handles parameters with various schema types', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'stringParam',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'numberParam',
            in: 'query',
            schema: {
              type: 'number',
            },
          },
          {
            name: 'booleanParam',
            in: 'query',
            schema: {
              type: 'boolean',
            },
          },
          {
            name: 'arrayParam',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          {
            name: 'objectParam',
            in: 'query',
            schema: {
              type: 'object',
            },
          },
        ],
        responses: {},
      }

      const result = traverseOperationParams({
        operation,
        generateId: mockGenerateId,
        parentId,
      })

      expect(result).toHaveLength(5)
      expect(result.map((r) => r.name)).toEqual([
        'stringParam',
        'numberParam',
        'booleanParam',
        'arrayParam',
        'objectParam',
      ])
    })
  })
})
