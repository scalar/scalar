import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import {
  deepMerge,
  extractBodyDescriptions,
  extractBodyFieldNames,
  extractParameterDescriptions,
  extractParameterNames,
} from './openapi'

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

    it('does not merge undefined properties', () => {
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

  describe('extractParameterNames', () => {
    it('returns empty array for empty parameters', () => {
      expect(extractParameterNames([])).toEqual([])
    })

    it('returns just the name for a path parameter', () => {
      expect(extractParameterNames([{ in: 'path', name: 'userId', required: true }])).toEqual(['userId'])
    })

    it('returns just the name for a query parameter', () => {
      expect(extractParameterNames([{ in: 'query', name: 'limit', schema: { type: 'integer' } }])).toEqual(['limit'])
    })

    it('drops filter-style metadata tokens', () => {
      const result = extractParameterNames([
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' },
          description: 'Unique user identifier',
        },
      ])
      expect(result).toEqual(['userId'])
      expect(result.join(' ')).not.toContain('REQUIRED')
      expect(result.join(' ')).not.toContain('path')
      expect(result.join(' ')).not.toContain('string')
    })

    it('extracts names across all parameter locations', () => {
      const result = extractParameterNames([
        { in: 'path', name: 'id', required: true },
        { in: 'query', name: 'filter' },
        { in: 'header', name: 'X-Api-Key', required: true },
        { in: 'cookie', name: 'session' },
      ])
      expect(result).toEqual(['id', 'filter', 'X-Api-Key', 'session'])
    })

    it('deduplicates repeated names', () => {
      const result = extractParameterNames([
        { in: 'query', name: 'tag' },
        { in: 'query', name: 'tag' },
      ])
      expect(result).toEqual(['tag'])
    })
  })

  describe('extractParameterDescriptions', () => {
    it('returns empty array when no descriptions are present', () => {
      expect(extractParameterDescriptions([{ in: 'query', name: 'limit' }])).toEqual([])
    })

    it('returns the descriptions in order', () => {
      const result = extractParameterDescriptions([
        { in: 'query', name: 'limit', description: 'Maximum number of results' },
        { in: 'path', name: 'userId', required: true, description: 'Unique user identifier' },
      ])
      expect(result).toEqual(['Maximum number of results', 'Unique user identifier'])
    })

    it('skips parameters without a description', () => {
      const result = extractParameterDescriptions([
        { in: 'query', name: 'limit' },
        { in: 'query', name: 'offset', description: 'Number of records to skip' },
      ])
      expect(result).toEqual(['Number of records to skip'])
    })
  })

  describe('extractBodyFieldNames', () => {
    it('returns empty array for an operation without requestBody', () => {
      const operation: OperationObject = {
        summary: 'Test',
        responses: { 200: { description: 'OK' } },
      }
      expect(extractBodyFieldNames(operation)).toEqual([])
    })

    it('returns empty array for empty requestBody content', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: { content: {} },
      }
      expect(extractBodyFieldNames(operation)).toEqual([])
    })

    it('extracts top-level property names from application/json', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual(['name', 'email'])
    })

    it('extracts names across multiple content types and deduplicates', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonField: { type: 'string' },
                  shared: { type: 'string' },
                },
              },
            },
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  xmlField: { type: 'number' },
                  shared: { type: 'number' },
                },
              },
            },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual(['jsonField', 'shared', 'xmlField'])
    })

    it('extracts names from one level of nested objects', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  address: {
                    type: 'object',
                    properties: {
                      street: { type: 'string' },
                      city: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual(['address', 'street', 'city'])
    })

    it('returns empty array for non-object schemas (e.g. text/plain)', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'text/plain': { schema: { type: 'string' } },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual([])
    })

    it('does not include filter-style metadata tokens', () => {
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
      const result = extractBodyFieldNames(operation)
      expect(result).toEqual(['name', 'age'])
      expect(result.join(' ')).not.toContain('REQUIRED')
      expect(result.join(' ')).not.toContain('optional')
      expect(result.join(' ')).not.toContain('string')
    })
  })

  describe('extractBodyDescriptions', () => {
    it('returns empty array when no property has a description', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
      }
      expect(extractBodyDescriptions(operation)).toEqual([])
    })

    it('extracts top-level property descriptions', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'User display name' },
                  email: { type: 'string', description: 'User email address' },
                },
              },
            },
          },
        },
      }
      expect(extractBodyDescriptions(operation)).toEqual(['User display name', 'User email address'])
    })
  })
})
