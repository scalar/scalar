import { describe, expect, it } from 'vitest'

import type { Request } from '@/types'

import { createParameterObject, extractParameters } from './parameters'

describe('parameters', () => {
  describe('extractParameters', () => {
    it('extracts query parameters from URL', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users?page=1&limit=10',
          query: [
            {
              key: 'page',
              value: '1',
            },
            {
              key: 'limit',
              value: '10',
            },
          ],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(2)
      expect(result.find((p: any) => p.name === 'page')).toEqual({
        name: 'page',
        in: 'query',
        description: undefined,
        example: '1',
        schema: {
          type: 'integer',
        },
      })
      expect(result.find((p: any) => p.name === 'limit')).toEqual({
        name: 'limit',
        in: 'query',
        description: undefined,
        example: '10',
        schema: {
          type: 'integer',
        },
      })
    })

    it('extracts path parameters from URL variables as strings', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: 'testId',
            },
          ],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'userId',
        in: 'path',
        required: true,
        description: undefined,
        example: 'testId',
        schema: {
          type: 'string',
        },
      })
    })

    it('keeps path parameters as strings even for numeric-looking values', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: '123',
            },
          ],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(1)
      expect(result[0]?.schema?.type).toBe('string')
      expect(result[0]?.example).toBe('123')
    })

    it('keeps path parameters as strings for empty values', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: '',
            },
          ],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(1)
      expect(result[0]?.schema?.type).toBe('string')
      expect(result[0]?.example).toBe('')
    })

    it('extracts path parameters from path array', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users/{{userId}}/posts',
          path: ['users', '{{userId}}', 'posts'],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'userId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      })
    })

    it('extracts header parameters', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
        header: [
          {
            key: 'Authorization',
            value: 'Bearer token',
          },
          {
            key: 'X-Request-ID',
            value: '12345',
          },
        ],
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(2)
      expect(result.find((p: any) => p.name === 'Authorization')).toEqual({
        name: 'Authorization',
        in: 'header',
        example: 'Bearer token',
        schema: {
          type: 'string',
        },
      })
      expect(result.find((p: any) => p.name === 'X-Request-ID')).toEqual({
        name: 'X-Request-ID',
        in: 'header',
        description: undefined,
        example: '12345',
        schema: {
          type: 'integer',
        },
      })
    })

    it('returns empty array for string request', () => {
      const request: Request = 'https://example.com/users'

      const result = extractParameters(request)

      expect(result).toEqual([])
    })

    it('returns empty array when URL is missing', () => {
      const request: Request = {
        method: 'GET',
      }

      const result = extractParameters(request)

      expect(result).toEqual([])
    })

    it('deduplicates parameters with same name', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: '123',
            },
          ],
          path: ['users', '{{userId}}'],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('userId')
    })
  })

  describe('createParameterObject', () => {
    it('creates query parameter object', () => {
      const param = {
        key: 'page',
        value: '1',
        description: 'Page number',
      }

      const result = createParameterObject(param, 'query')

      expect(result).toEqual({
        name: 'page',
        in: 'query',
        description: 'Page number',
        example: '1',
        schema: {
          type: 'integer',
        },
      })
    })

    it('creates path parameter object with required flag and string type', () => {
      const param = {
        key: 'userId',
        value: 'testId',
      }

      const result = createParameterObject(param, 'path')

      expect(result).toEqual({
        name: 'userId',
        in: 'path',
        required: true,
        description: undefined,
        example: 'testId',
        schema: {
          type: 'string',
        },
      })
    })

    it('keeps path parameters as strings even for numeric string values', () => {
      const param = {
        key: 'userId',
        value: '123',
      }

      const result = createParameterObject(param, 'path')

      expect(result.schema?.type).toBe('string')
      expect(result.example).toBe('123')
    })

    it('uses number type for path parameters only when value is explicitly numeric', () => {
      const param = {
        key: 'userId',
        value: 123,
      }

      const result = createParameterObject(param, 'path')

      expect(result.schema?.type).toBe('integer')
      expect(result.example).toBe(123)
    })

    it('creates header parameter object', () => {
      const param = {
        key: 'Authorization',
        value: 'Bearer token',
      }

      const result = createParameterObject(param, 'header')

      expect(result).toEqual({
        name: 'Authorization',
        in: 'header',
        example: 'Bearer token',
        schema: {
          type: 'string',
        },
      })
    })

    it('marks query parameter as required when description contains [required]', () => {
      const param = {
        key: 'page',
        value: '1',
        description: 'Page number [required]',
      }

      const result = createParameterObject(param, 'query')

      expect(result.required).toBe(true)
      expect(result.description).toBe('Page number')
    })

    it('marks query parameter as required when key is "required"', () => {
      const param = {
        key: 'required',
        value: 'true',
      }

      const result = createParameterObject(param, 'query')

      expect(result.required).toBe(true)
    })

    it('removes [required] marker from description', () => {
      const param = {
        key: 'page',
        value: '1',
        description: 'Page number [required]',
      }

      const result = createParameterObject(param, 'query')

      expect(result.description).toBe('Page number')
      expect(result.description).not.toContain('[required]')
    })

    it('infers integer type from numeric value', () => {
      const param = {
        key: 'count',
        value: '42',
      }

      const result = createParameterObject(param, 'query')

      expect(result.schema).toEqual({
        type: 'integer',
      })
    })

    it('infers number type from float value', () => {
      const param = {
        key: 'price',
        value: '3.14',
      }

      const result = createParameterObject(param, 'query')

      expect(result.schema).toEqual({
        type: 'number',
      })
    })

    it('infers boolean type from boolean string', () => {
      const param = {
        key: 'active',
        value: 'true',
      }

      const result = createParameterObject(param, 'query')

      expect(result.schema).toEqual({
        type: 'boolean',
      })
    })

    it('defaults to string type when value is missing', () => {
      const param = {
        key: 'name',
      }

      const result = createParameterObject(param, 'query')

      expect(result.schema).toEqual({
        type: 'string',
      })
    })

    it('handles empty key', () => {
      const param = {
        key: '',
        value: 'test',
      }

      const result = createParameterObject(param, 'query')

      expect(result.name).toBe('')
    })

    it('adds x-scalar-disabled extension for disabled query parameter', () => {
      const param = {
        key: 'page',
        value: '1',
        disabled: true,
      }

      const result = createParameterObject(param, 'query')

      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(result['x-scalar-disabled']).toBe(true)
      expect(result.name).toBe('page')
      expect(result?.example).toBe('1')
    })

    it('adds x-scalar-disabled extension for disabled path parameter', () => {
      const param = {
        key: 'userId',
        value: '123',
        disabled: true,
      }

      const result = createParameterObject(param, 'path')

      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(result['x-scalar-disabled']).toBe(true)
      expect(result?.name).toBe('userId')
      expect(result.required).toBe(true)
    })

    it('adds x-scalar-disabled extension for disabled header parameter', () => {
      const param = {
        key: 'X-Custom-Header',
        value: 'value',
        disabled: true,
      }

      const result = createParameterObject(param, 'header')

      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(result?.['x-scalar-disabled']).toBe(true)
      expect(result.name).toBe('X-Custom-Header')
      expect(result?.example).toBe('value')
    })

    it('does not add x-scalar-disabled extension when disabled is false', () => {
      const param = {
        key: 'page',
        value: '1',
        disabled: false,
      }

      const result = createParameterObject(param, 'query')

      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(result['x-scalar-disabled']).toBeUndefined()
    })

    it('does not add x-scalar-disabled extension when disabled is undefined', () => {
      const param = {
        key: 'page',
        value: '1',
      }

      const result = createParameterObject(param, 'query')

      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(result['x-scalar-disabled']).toBeUndefined()
    })
  })

  describe('extractParameters with disabled parameters', () => {
    it('includes disabled query parameters in output', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users?page=1&limit=10',
          query: [
            {
              key: 'page',
              value: '1',
              disabled: true,
            },
            {
              key: 'limit',
              value: '10',
            },
          ],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(2)
      const pageParam = result.find((p: any) => p.name === 'page')
      expect(pageParam).toBeDefined()
      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(pageParam?.['x-scalar-disabled']).toBe(true)
      const limitParam = result.find((p: any) => p.name === 'limit')
      expect(limitParam).toBeDefined()
      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(limitParam?.['x-scalar-disabled']).toBeUndefined()
    })

    it('includes disabled header parameters in output', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
        header: [
          {
            key: 'Authorization',
            value: 'Bearer token',
            disabled: true,
          },
          {
            key: 'X-Request-ID',
            value: '12345',
          },
        ],
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(2)
      const authParam = result.find((p: any) => p.name === 'Authorization')
      expect(authParam).toBeDefined()
      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(authParam?.['x-scalar-disabled']).toBe(true)
      const requestIdParam = result.find((p: any) => p.name === 'X-Request-ID')
      expect(requestIdParam).toBeDefined()
      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(requestIdParam?.['x-scalar-disabled']).toBeUndefined()
    })

    it('includes disabled path parameters in output', () => {
      const request: Request = {
        method: 'GET',
        url: {
          raw: 'https://example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: '123',
              disabled: true,
            },
          ],
        },
      }

      const result = extractParameters(request)

      expect(result).toHaveLength(1)
      // @ts-expect-error @scalar/openapi-types does not allow extensions here
      expect(result[0]?.['x-scalar-disabled']).toBe(true)
      expect(result[0]?.name).toBe('userId')
    })
  })
})
