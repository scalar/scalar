import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createParameterMap, deepMerge, extractRequestBody } from './openapi'

describe('openapi', () => {
  describe('deepMerge', () => {
    it('merges objects', () => {
      expect(
        deepMerge(
          {
            foo: 'bar',
          },
          {
            bar: 'foo',
          },
        ),
      ).toMatchObject({
        foo: 'bar',
        bar: 'foo',
      })
    })

    it('merges objects in objects', () => {
      expect(
        deepMerge(
          {
            foo: 'bar',
            nested: {
              foo: 'bar',
            },
          },
          {
            bar: 'foo',
            nested: {
              foo: 'bar',
              bar: 'foo',
            },
          },
        ),
      ).toMatchObject({
        foo: 'bar',
        bar: 'foo',
        nested: {
          foo: 'bar',
          bar: 'foo',
        },
      })
    })

    it("doesn't merge undefined properties", () => {
      expect(
        deepMerge(
          {
            bar: undefined,
          },
          {
            foo: 'bar',
            bar: 'foo',
          },
        ),
      ).toMatchObject({
        foo: 'bar',
        bar: 'foo',
      })
    })
  })

  describe('extractRequestBody', () => {
    it('returns null for an operation without requestBody', () => {
      const operation: OperationObject = {
        summary: 'Test',
        responses: {
          200: {
            description: 'Success',
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toBeNull()
    })

    it('returns null for an operation with empty requestBody content', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {},
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toBeNull()
    })

    it('extracts application/json request body', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toContain('Body')
      expect(result).toContain('name optional string')
    })

    it('extracts application/xml request body', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  xmlField: { type: 'string' },
                },
              },
            },
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toContain('Body')
      expect(result).toContain('xmlField optional string')
    })

    it('extracts multiple content types', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonField: { type: 'string' },
                },
              },
            },
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  xmlField: { type: 'number' },
                },
              },
            },
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toContain('jsonField optional string')
      expect(result).toContain('xmlField optional number')
    })

    it('extracts text/plain content type', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toEqual(['Body'])
    })

    it('extracts multipart/form-data content type', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toContain('Body')
      expect(result).toContain('file optional string')
      expect(result).toContain('description optional string')
    })

    it('handles required properties', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  age: { type: 'number' },
                },
              },
            },
          },
        },
      }
      const result = extractRequestBody(operation)
      expect(result).toContain('name REQUIRED string')
      expect(result).toContain('age optional number')
    })
  })

  describe('createParameterMap', () => {
    it('returns an empty map for an operation without parameters', () => {
      const operation: OperationObject = {
        summary: 'Test',
        tags: ['test'],
        responses: {
          200: {
            description: 'Success',
          },
        },
      }
      const result = createParameterMap(operation)
      expect(result).toEqual({
        path: [],
        query: [],
        header: [],
        cookie: [],
      })
    })

    it('extracts parameters from the default parameters property', () => {
      const operation: OperationObject = {
        parameters: [
          {
            in: 'query',
            name: 'limit',
          },
        ],
      }
      const result = createParameterMap(operation)
      expect(result.query).toHaveLength(1)
      expect(result.query[0]?.name).toBe('limit')
    })

    it('ignores non-dereferenced parameters', () => {
      const operation: OperationObject = {
        parameters: [
          {
            $ref: '#/components/parameters/Limit',
            // @ts-expect-error - just a test
            '$ref-value': undefined,
          },
          {
            in: 'query',
            name: 'limit',
          },
        ],
      }
      const result = createParameterMap(operation)
      expect(result.query).toHaveLength(1)
      expect(result.query[0]?.name).toBe('limit')
    })

    it('correctly categorizes all parameter types', () => {
      const operation: OperationObject = {
        parameters: [
          { in: 'path', name: 'path-param' },
          { in: 'query', name: 'query-param' },
          { in: 'header', name: 'header-param' },
          { in: 'cookie', name: 'cookie-param' },
        ],
      }
      const result = createParameterMap(operation)
      expect(result.path).toHaveLength(1)
      expect(result.path[0]?.name).toBe('path-param')
      expect(result.query).toHaveLength(1)
      expect(result.query[0]?.name).toBe('query-param')
      expect(result.header).toHaveLength(1)
      expect(result.header[0]?.name).toBe('header-param')
      expect(result.cookie).toHaveLength(1)
      expect(result.cookie[0]?.name).toBe('cookie-param')
    })
  })
})
