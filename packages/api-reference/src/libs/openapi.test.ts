import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'
import { createParameterMap, deepMerge } from './openapi'

describe('openapi', () => {
  describe('deepMerge', () => {
    it('merges objects', async () => {
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

    it('merges objects in objects', async () => {
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

    it("doesn't merge undefined properties", async () => {
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
        body: [],
        formData: [],
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
      expect(result.query[0].name).toBe('limit')
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
      expect(result.query[0].name).toBe('limit')
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
      expect(result.path[0].name).toBe('path-param')
      expect(result.query).toHaveLength(1)
      expect(result.query[0].name).toBe('query-param')
      expect(result.header).toHaveLength(1)
      expect(result.header[0].name).toBe('header-param')
      expect(result.cookie).toHaveLength(1)
      expect(result.cookie[0].name).toBe('cookie-param')
    })
  })
})
