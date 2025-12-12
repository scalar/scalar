import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/example'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { buildRequestParameters } from './build-request-parameters'

/**
 * Extended parameter type that includes the value property used by the API client.
 * The standard ParameterObject does not include a value field, but the API client
 * extends it to store the current parameter value for request execution.
 */
type ExtendedParameter = ParameterObject & { value: string }

/** Helper to create a parameter with schema-based examples */
const createParameter = (
  overrides: Partial<ExtendedParameter> & Pick<ExtendedParameter, 'name' | 'in' | 'value'>,
  examples?: Record<string, ExampleObject>,
): ExtendedParameter =>
  ({
    ...(examples && { examples }),
    ...overrides,
  }) as ExtendedParameter

/** Helper to create a parameter with content-based examples */
const createContentParameter = (
  overrides: Partial<ExtendedParameter> & Pick<ExtendedParameter, 'name' | 'in' | 'value'>,
  contentType: string,
  examples?: Record<string, ExampleObject>,
): ExtendedParameter =>
  ({
    content: {
      [contentType]: {
        ...(examples && { examples }),
      },
    },
    ...overrides,
  }) as ExtendedParameter

describe('buildRequestParameters', () => {
  describe('getExample (internal helper)', () => {
    /**
     * Tests for the internal getExample function which extracts examples from parameters.
     * Since getExample is not exported, we test it through buildRequestParameters behavior.
     */
    it('retrieves example from schema-based parameter using the exampleKey', () => {
      const params = [
        createParameter(
          { name: 'X-Api-Key', in: 'header', value: 'prod-key' },
          {
            default: { value: 'default-key' },
            production: { value: 'prod-key' },
            staging: { value: 'staging-key' },
          },
        ),
      ]
      const result = buildRequestParameters(params, {}, 'production')
      expect(result.headers['X-Api-Key']).toBe('prod-key')
    })

    it('retrieves example from content-based parameter using contentType and exampleKey', () => {
      const params: ParameterObject[] = [
        {
          name: 'X-Payload',
          in: 'header',
          content: {
            'application/json': {
              examples: {
                default: { value: '{"type":"json"}' },
              },
            },
            'text/xml': {
              examples: {
                default: { value: '<type>xml</type>' },
              },
            },
          },
        } as ParameterObject,
      ]

      const jsonParams: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          schema: { type: 'string' },
          examples: {
            default: { value: 'application/json' },
          },
        } as ParameterObject,
        ...params,
      ]

      const xmlParams: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          schema: { type: 'string' },
          examples: {
            default: { value: 'text/xml' },
          },
        } as ParameterObject,
        ...params,
      ]

      const jsonResult = buildRequestParameters(jsonParams, {}, 'default')
      const xmlResult = buildRequestParameters(xmlParams, {}, 'default')

      expect(jsonResult.headers['X-Payload']).toBe('{"type":"json"}')
      expect(xmlResult.headers['X-Payload']).toBe('<type>xml</type>')
    })

    it('returns undefined when content type does not exist in content-based parameter', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          schema: { type: 'string' },
          examples: {
            default: { value: 'application/xml' },
          },
        } as ParameterObject,
        {
          name: 'X-Missing-Content-Type',
          in: 'header',
          content: {
            'application/json': {
              examples: {
                default: { value: 'json-value' },
              },
            },
          },
        } as ParameterObject,
      ]

      // Request with a content type that does not exist in the parameter
      const result = buildRequestParameters(params, {}, 'default')

      // Should skip the parameter since no example is found
      expect(result.headers).not.toHaveProperty('X-Missing-Content-Type')
    })

    it('returns undefined when exampleKey does not exist in examples', () => {
      const params = [
        createParameter(
          { name: 'X-Missing-Key', in: 'header', value: 'value' },
          {
            production: { value: 'prod-value' },
            staging: { value: 'staging-value' },
          },
        ),
      ]

      // Request with an exampleKey ('nonexistent') that does not exist
      const result = buildRequestParameters(params, {}, 'nonexistent')

      // Should skip the parameter since no example is found for the key
      expect(result.headers).not.toHaveProperty('X-Missing-Key')
    })

    it('resolves $ref in example objects', () => {
      const params: ParameterObject[] = [
        {
          name: 'X-Ref-Example',
          in: 'header',
          schema: { type: 'string' },
          examples: {
            default: {
              $ref: '#/components/examples/ApiKey',
              '$ref-value': { value: 'resolved-api-key' },
            },
          },
        } as unknown as ParameterObject,
      ]

      const result = buildRequestParameters(params)

      // The $ref should be resolved to its '$ref-value'
      expect(result.headers['X-Ref-Example']).toBe('resolved-api-key')
    })
  })

  describe('basic functionality', () => {
    it('returns empty result when no parameters provided', () => {
      const result = buildRequestParameters()

      expect(result.headers).toEqual({})
      expect(result.cookies).toEqual([])
      expect(result.urlParams.toString()).toBe('')
    })

    it('returns empty result when all examples are disabled', () => {
      const params = [
        createParameter({ name: 'X-Api-Key', in: 'header', value: 'secret' }, { default: { 'x-disabled': true } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers).toEqual({})
    })

    it('returns empty result when example key does not exist', () => {
      const params = [
        createParameter({ name: 'X-Api-Key', in: 'header', value: 'secret' }, { production: { value: 'prod-key' } }),
      ]

      // Default example key is 'default', but we only have 'production'
      const result = buildRequestParameters(params)

      expect(result.headers).toEqual({})
    })
  })

  describe('header parameters', () => {
    it('builds header from schema-based parameter', () => {
      const params = [
        createParameter({ name: 'X-Api-Key', in: 'header', value: 'my-api-key' }, { default: { value: 'my-api-key' } }),
      ]
      const result = buildRequestParameters(params)

      expect(result.headers['X-Api-Key']).toBe('my-api-key')
    })

    it('builds header from content-based parameter', () => {
      const params = [
        createParameter(
          { name: 'Content-Type', in: 'header', value: 'application/json' },
          { default: { value: 'application/json' } },
        ),
        createContentParameter({ name: 'X-Custom-Header', in: 'header', value: 'custom-value' }, 'application/json', {
          default: { value: 'custom-value' },
        }),
      ]

      const result = buildRequestParameters(params, {}, 'default')

      expect(result.headers['X-Custom-Header']).toBe('custom-value')
    })

    it('builds multiple headers', () => {
      const params = [
        createParameter({ name: 'X-Api-Key', in: 'header', value: 'key-123' }, { default: { value: 'key-123' } }),
        createParameter({ name: 'X-Request-Id', in: 'header', value: 'req-456' }, { default: { value: 'req-456' } }),
        createParameter(
          { name: 'Accept', in: 'header', value: 'application/json' },
          { default: { value: 'application/json' } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers).toEqual({
        'X-Api-Key': 'key-123',
        'X-Request-Id': 'req-456',
        Accept: 'application/json',
      })
    })

    it('uses custom example key for headers', () => {
      const params = [
        createParameter(
          { name: 'Authorization', in: 'header', value: 'Bearer staging-token' },
          {
            default: { value: 'Bearer default-token' },
            staging: { value: 'Bearer staging-token' },
            production: { value: 'Bearer prod-token' },
          },
        ),
      ]

      const result = buildRequestParameters(params, {}, 'staging')

      expect(result.headers['Authorization']).toBe('Bearer staging-token')
    })

    it('skips disabled header examples', () => {
      const params = [
        createParameter(
          { name: 'X-Disabled-Header', in: 'header', value: 'should-not-appear' },
          { default: { value: 'should-not-appear', 'x-disabled': true } },
        ),
        createParameter(
          { name: 'X-Enabled-Header', in: 'header', value: 'should-appear' },
          { default: { value: 'should-appear', 'x-disabled': false } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers).not.toHaveProperty('X-Disabled-Header')
      expect(result.headers['X-Enabled-Header']).toBe('should-appear')
    })

    it('handles header with empty value', () => {
      const params = [createParameter({ name: 'X-Empty', in: 'header', value: '' }, { default: { value: '' } })]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Empty']).toBe('')
    })
  })

  describe('query parameters', () => {
    it('builds query parameter from schema-based parameter', () => {
      const params = [createParameter({ name: 'page', in: 'query', value: '1' }, { default: { value: '1' } })]

      const result = buildRequestParameters(params)

      expect(result.urlParams.get('page')).toBe('1')
    })

    it('builds multiple query parameters', () => {
      const params = [
        createParameter({ name: 'page', in: 'query', value: '1' }, { default: { value: '1' } }),
        createParameter({ name: 'limit', in: 'query', value: '10' }, { default: { value: '10' } }),
        createParameter({ name: 'sort', in: 'query', value: 'name' }, { default: { value: 'name' } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.urlParams.get('page')).toBe('1')
      expect(result.urlParams.get('limit')).toBe('10')
      expect(result.urlParams.get('sort')).toBe('name')
      expect(result.urlParams.toString()).toBe('page=1&limit=10&sort=name')
    })

    it('handles duplicate query parameter names', () => {
      const params = [
        createParameter({ name: 'tag', in: 'query', value: 'javascript' }, { default: { value: 'javascript' } }),
        createParameter({ name: 'tag', in: 'query', value: 'typescript' }, { default: { value: 'typescript' } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.urlParams.getAll('tag')).toEqual(['javascript', 'typescript'])
    })

    it('skips disabled query parameters', () => {
      const params = [
        createParameter({ name: 'enabled', in: 'query', value: 'yes' }, { default: { value: 'yes' } }),
        createParameter(
          { name: 'disabled', in: 'query', value: 'no' },
          { default: { value: 'no', 'x-disabled': true } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.urlParams.get('enabled')).toBe('yes')
      expect(result.urlParams.has('disabled')).toBe(false)
    })

    it('handles query parameter with special characters', () => {
      const params = [
        createParameter({ name: 'search', in: 'query', value: 'hello world' }, { default: { value: 'hello world' } }),
        createParameter(
          { name: 'filter', in: 'query', value: 'name=John&age=30' },
          { default: { value: 'name=John&age=30' } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.urlParams.get('search')).toBe('hello world')
      expect(result.urlParams.get('filter')).toBe('name=John&age=30')
    })
  })

  describe('cookie parameters', () => {
    it('builds cookie from schema-based parameter', () => {
      const params = [
        createParameter({ name: 'session_id', in: 'cookie', value: 'abc123' }, { default: { value: 'abc123' } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.cookies).toHaveLength(1)
      expect(result.cookies[0]).toMatchObject({
        name: 'session_id',
      })
    })

    it('builds multiple cookies', () => {
      const params = [
        createParameter({ name: 'session_id', in: 'cookie', value: 'abc123' }, { default: { value: 'abc123' } }),
        createParameter({ name: 'user_pref', in: 'cookie', value: 'dark-mode' }, { default: { value: 'dark-mode' } }),
        createParameter({ name: 'tracking_id', in: 'cookie', value: 'xyz789' }, { default: { value: 'xyz789' } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.cookies).toHaveLength(3)
    })

    it('skips disabled cookie parameters', () => {
      const params = [
        createParameter({ name: 'enabled_cookie', in: 'cookie', value: 'on' }, { default: { value: 'on' } }),
        createParameter(
          { name: 'disabled_cookie', in: 'cookie', value: 'off' },
          { default: { value: 'off', 'x-disabled': true } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.cookies).toHaveLength(1)
      expect(result.cookies[0]).toMatchObject({ name: 'enabled_cookie' })
    })
  })

  describe('mixed parameter types', () => {
    it('handles parameters of all types together', () => {
      const params = [
        createParameter(
          { name: 'Authorization', in: 'header', value: 'Bearer token' },
          { default: { value: 'Bearer token' } },
        ),
        createParameter({ name: 'page', in: 'query', value: '1' }, { default: { value: '1' } }),
        createParameter({ name: 'session', in: 'cookie', value: 'sess123' }, { default: { value: 'sess123' } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['Authorization']).toBe('Bearer token')
      expect(result.urlParams.get('page')).toBe('1')
      expect(result.cookies).toHaveLength(1)
    })

    it('ignores path parameters (they are handled separately)', () => {
      const params = [
        createParameter({ name: 'userId', in: 'path', value: '123' }, { default: { value: '123' } }),
        createParameter(
          { name: 'Accept', in: 'header', value: 'application/json' },
          { default: { value: 'application/json' } },
        ),
      ]

      const result = buildRequestParameters(params)

      // Path parameters should not appear in any result bucket
      expect(result.headers).not.toHaveProperty('userId')
      expect(result.urlParams.has('userId')).toBe(false)
      expect(result.cookies.find((c) => c.name === 'userId')).toBeUndefined()

      // Header should still work
      expect(result.headers['Accept']).toBe('application/json')
    })
  })

  describe('OpenAPI style variations', () => {
    /**
     * OpenAPI defines several serialization styles for parameters:
     * - simple: comma-separated values (default for path and header)
     * - form: ampersand-separated key=value pairs (default for query and cookie)
     * - matrix: semicolon-prefixed key=value pairs
     * - label: dot-prefixed values
     * - spaceDelimited: space-separated values
     * - pipeDelimited: pipe-separated values
     * - deepObject: nested object notation
     *
     * @see https://spec.openapis.org/oas/v3.1.1.html#style-values
     */

    describe('simple style (default for path and header)', () => {
      it('handles simple style with primitive value', () => {
        const params = [
          { name: 'X-Id', in: 'header', style: 'simple', explode: false, examples: { default: { value: 5 } } },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)
        expect(result.headers['X-Id']).toBe(5)
      })

      it('handles simple style multiple values', () => {
        const params = [
          { name: 'X-Tags', in: 'header', style: 'simple', explode: false, examples: { default: { value: 'a' } } },
          { name: 'X-Tags', in: 'header', style: 'simple', explode: false, examples: { default: { value: 'b' } } },
          { name: 'X-Tags', in: 'header', style: 'simple', explode: false, examples: { default: { value: 'c' } } },
        ] satisfies ParameterObject[]
        const result = buildRequestParameters(params)

        // Simple style without explode: comma-separated values
        expect(result.headers['X-Tags']).toBe('a,b,c')
      })
    })

    describe('form style (default for query and cookie)', () => {
      it('handles form style with primitive value', () => {
        const params = [
          { name: 'id', in: 'query', style: 'form', examples: { default: { value: 5 } } },
        ] satisfies ParameterObject[]
        const result = buildRequestParameters(params)

        // Form style with explode: true -> color=blue&color=black&color=brown
        expect(result.urlParams.get('id')).toBe('5')
      })

      it('handles form style with array (explode: true - default)', () => {
        const params = [
          { name: 'color', in: 'query', style: 'form', explode: true, examples: { default: { value: 'blue' } } },
          { name: 'color', in: 'query', style: 'form', explode: true, examples: { default: { value: 'black' } } },
          { name: 'color', in: 'query', style: 'form', explode: true, examples: { default: { value: 'brown' } } },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)

        // Form style with explode: true -> color=blue&color=black&color=brown
        expect(result.urlParams.getAll('color')).toEqual(['blue', 'black', 'brown'])
      })

      it('handles form style with array (explode: false)', () => {
        const params = [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: false,
            examples: { default: { value: ['blue', 'black', 'brown'] } },
          },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)

        // Form style with explode: false -> color=blue,black,brown
        expect(result.urlParams.get('color')).toBe('blue,black,brown')
      })
    })

    describe('spaceDelimited style', () => {
      it('handles spaceDelimited style with array', () => {
        const params = [
          {
            name: 'colors',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
            examples: { default: { value: 'blue' } },
          },
          {
            name: 'colors',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
            examples: { default: { value: 'black' } },
          },
          {
            name: 'colors',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
            examples: { default: { value: 'brown' } },
          },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)

        // spaceDelimited style -> colors=blue black brown
        expect(result.urlParams.get('colors')).toBe('blue black brown')
      })

      it('maintains spaceDelimited style that the user has provided', () => {
        const params = [
          {
            name: 'colors',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
            examples: { default: { value: ['blue black brown'] } },
          },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)

        // spaceDelimited style -> colors=blue black brown
        expect(result.urlParams.get('colors')).toBe('blue black brown')
      })
    })

    describe('pipeDelimited style', () => {
      it('handles pipeDelimited style with array', () => {
        const params = [
          {
            name: 'colors',
            in: 'query',
            style: 'pipeDelimited',
            explode: false,
            examples: { default: { value: 'blue' } },
          },
          {
            name: 'colors',
            in: 'query',
            style: 'pipeDelimited',
            explode: false,
            examples: { default: { value: 'black' } },
          },
          {
            name: 'colors',
            in: 'query',
            style: 'pipeDelimited',
            explode: false,
            examples: { default: { value: 'brown' } },
          },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)

        // pipeDelimited style -> colors=blue|black|brown
        expect(result.urlParams.get('colors')).toBe('blue|black|brown')
      })
    })
  })

  describe('content-based parameters', () => {
    it('extracts example from content with matching content type', () => {
      const params = [
        {
          name: 'Content-Type',
          in: 'header',
          schema: { type: 'string' },
          examples: {
            default: { value: 'application/json' },
          },
        },
        {
          name: 'X-Payload',
          in: 'header',
          content: { 'application/json': { examples: { default: { value: 'stuff' } } } },
        },
      ] satisfies ParameterObject[]
      const result = buildRequestParameters(params, {}, 'default')

      expect(result.headers['X-Payload']).toBe('stuff')
    })

    it('returns empty when content type does not match', () => {
      const params = [
        createParameter(
          { name: 'Content-Type', in: 'header', value: 'text/plain' },
          { default: { value: 'text/plain' } },
        ),
        createContentParameter({ name: 'X-Payload', in: 'header', value: '{"key":"value"}' }, 'application/json', {
          default: { value: { key: 'value' } },
        }),
      ]
      const result = buildRequestParameters(params, {}, 'default')

      // No matching content type, so no example found, parameter skipped
      expect(result.headers).not.toHaveProperty('X-Payload')
    })
  })

  describe('environment variable replacement', () => {
    it('replaces env var in parameter value', () => {
      const params = [
        createParameter({ name: 'X-Api-Key', in: 'header', value: '{{apiKey}}' }, { default: { value: '{{apiKey}}' } }),
      ]

      const result = buildRequestParameters(params, { apiKey: 'secret-key-123' })

      expect(result.headers['X-Api-Key']).toBe('secret-key-123')
    })

    it('replaces env var in parameter name', () => {
      const params = [
        createParameter(
          { name: '{{headerName}}', in: 'header', value: 'my-value' },
          { default: { value: 'my-value' } },
        ),
      ]

      const result = buildRequestParameters(params, { headerName: 'X-Custom-Header' })

      expect(result.headers['X-Custom-Header']).toBe('my-value')
    })
  })

  describe('edge cases', () => {
    it('handles parameter with undefined value', () => {
      const params = [
        createParameter(
          { name: 'X-Maybe', in: 'header', value: undefined as unknown as string },
          { default: { value: undefined } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Maybe']).toBeUndefined()
    })

    it('handles parameter with null value', () => {
      const params = [
        createParameter(
          { name: 'X-Null', in: 'header', value: null as unknown as string },
          { default: { value: null } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Null']).toBeNull()
    })

    it('handles parameter with numeric value as is', () => {
      const params = [createParameter({ name: 'X-Count', in: 'header', value: '42' }, { default: { value: 42 } })]
      const result = buildRequestParameters(params)
      expect(result.headers['X-Count']).toBe(42)
    })

    it('handles parameter with boolean value as is', () => {
      const params = [createParameter({ name: 'X-Flag', in: 'header', value: 'true' }, { default: { value: true } })]
      const result = buildRequestParameters(params)
      expect(result.headers['X-Flag']).toBe(true)
    })

    it('handles parameter names with special characters', () => {
      const params = [
        createParameter(
          { name: 'X-Special-Header_Name.Test', in: 'header', value: 'special' },
          { default: { value: 'special' } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Special-Header_Name.Test']).toBe('special')
    })

    it('handles very long parameter values', () => {
      const longValue = 'a'.repeat(10000)
      const params = [
        createParameter({ name: 'X-Long', in: 'header', value: longValue }, { default: { value: longValue } }),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Long']).toBe(longValue)
    })

    it('handles Unicode characters in values', () => {
      const params = [
        createParameter(
          { name: 'X-Unicode', in: 'header', value: '日本語テスト 🎉' },
          { default: { value: '日本語テスト 🎉' } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Unicode']).toBe('日本語テスト 🎉')
    })

    it('handles empty string example key', () => {
      const params = [
        createParameter({ name: 'X-Empty-Key', in: 'header', value: 'value' }, { '': { value: 'value' } }),
      ]

      const result = buildRequestParameters(params, {}, '')

      expect(result.headers['X-Empty-Key']).toBe('value')
    })

    it('preserves order of parameters', () => {
      const params = [
        createParameter({ name: 'z-header', in: 'header', value: 'z' }, { default: { value: 'z' } }),
        createParameter({ name: 'a-header', in: 'header', value: 'a' }, { default: { value: 'a' } }),
        createParameter({ name: 'm-header', in: 'header', value: 'm' }, { default: { value: 'm' } }),
      ]

      const result = buildRequestParameters(params)

      const headerKeys = Object.keys(result.headers)
      expect(headerKeys).toEqual(['z-header', 'a-header', 'm-header'])
    })
  })
})
