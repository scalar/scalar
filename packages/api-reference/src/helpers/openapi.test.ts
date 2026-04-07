import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { deepMerge, extractParameters, extractRequestBody } from './openapi'

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

  describe('extractParameters', () => {
    it('returns empty array for empty parameters', () => {
      const result = extractParameters([])
      expect(result).toEqual([])
    })

    it('formats a required path parameter', () => {
      const result = extractParameters([{ in: 'path', name: 'userId', required: true }])
      expect(result).toEqual(['userId REQUIRED path'])
    })

    it('formats an optional query parameter', () => {
      const result = extractParameters([{ in: 'query', name: 'limit' }])
      expect(result).toEqual(['limit optional query'])
    })

    it('includes parameter type from schema', () => {
      const result = extractParameters([{ in: 'query', name: 'limit', schema: { type: 'integer' } }])
      expect(result).toEqual(['limit optional query integer'])
    })

    it('includes parameter description', () => {
      const result = extractParameters([{ in: 'query', name: 'limit', description: 'Maximum number of results' }])
      expect(result).toEqual(['limit optional query Maximum number of results'])
    })

    it('formats parameter with schema and description', () => {
      const result = extractParameters([
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' },
          description: 'Unique user identifier',
        },
      ])
      expect(result).toEqual(['userId REQUIRED path string Unique user identifier'])
    })

    it('extracts parameters from all categories', () => {
      const result = extractParameters([
        { in: 'path', name: 'id', required: true },
        { in: 'query', name: 'filter' },
        { in: 'header', name: 'X-Api-Key', required: true },
        { in: 'cookie', name: 'session' },
      ])
      expect(result).toHaveLength(4)
      expect(result).toEqual([
        'id REQUIRED path',
        'filter optional query',
        'X-Api-Key REQUIRED header',
        'session optional cookie',
      ])
    })

    it('handles array type in schema', () => {
      const result = extractParameters([{ in: 'query', name: 'tags', schema: { type: ['string', 'null'] } }])
      expect(result).toEqual(['tags optional query string|null'])
    })
  })
})
