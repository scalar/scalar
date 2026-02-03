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
    required: true, // Set required by default so parameters are not disabled
    ...(examples && { examples }),
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
          required: true,
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
        createParameter(
          { name: 'X-Api-Key', in: 'header', value: 'secret' },
          { default: { value: 'secret', 'x-disabled': true } },
        ),
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

    it('returns empty result when parameters are optional (not required)', () => {
      const params = [
        createParameter(
          { name: 'X-Optional-Header', in: 'header', value: 'optional', required: false },
          { default: { value: 'optional' } },
        ),
      ]

      const result = buildRequestParameters(params)

      // Optional parameters are disabled by default
      expect(result.headers).toEqual({})
    })

    it('includes optional parameters when explicitly enabled via x-disabled: false', () => {
      const params = [
        createParameter(
          { name: 'X-Optional-Header', in: 'header', value: 'optional', required: false },
          { default: { value: 'optional', 'x-disabled': false } },
        ),
      ]

      const result = buildRequestParameters(params)

      // Optional parameters with x-disabled: false should be included
      expect(result.headers['X-Optional-Header']).toBe('optional')
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

    it('handles query parameter with object value', () => {
      const params: ParameterObject[] = [
        {
          name: 'offset',
          description: 'The number of items to skip before starting to collect the result set',
          in: 'query',
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
              examples: {
                default: {
                  value: {
                    test: 'what',
                  },
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // Object values should be serialized as JSON strings
      expect(result.urlParams.get('offset')).toBe('{"test":"what"}')
    })

    it('handles query parameter with text/plain content type', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'text/plain' },
          },
        },
        {
          name: 'description',
          description: 'Plain text description',
          in: 'query',
          required: false,
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
              examples: {
                default: {
                  value: 'This is plain text content',
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // Plain text values should be passed as-is
      expect(result.urlParams.get('description')).toBe('This is plain text content')
    })

    it('handles query parameter with text/xml content type', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'text/xml' },
          },
        },
        {
          name: 'xmlData',
          description: 'XML formatted data',
          in: 'query',
          required: false,
          content: {
            'text/xml': {
              schema: {
                type: 'string',
              },
              examples: {
                default: {
                  value: '<root><item>value</item></root>',
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // XML values should be passed as-is
      expect(result.urlParams.get('xmlData')).toBe('<root><item>value</item></root>')
    })

    it('handles query parameter with application/xml content type', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'application/xml' },
          },
        },
        {
          name: 'payload',
          description: 'Application XML data',
          in: 'query',
          required: false,
          content: {
            'application/xml': {
              schema: {
                type: 'string',
              },
              examples: {
                default: {
                  value: '<?xml version="1.0"?><data><field>test</field></data>',
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // Application XML values should be passed as-is
      expect(result.urlParams.get('payload')).toBe('<?xml version="1.0"?><data><field>test</field></data>')
    })

    it('handles query parameter with application/x-www-form-urlencoded content type', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'application/x-www-form-urlencoded' },
          },
        },
        {
          name: 'formData',
          description: 'URL encoded form data',
          in: 'query',
          required: false,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'string',
              },
              examples: {
                default: {
                  value: 'username=john_doe&email=john@example.com',
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // Form data should be passed as-is when already URL encoded
      expect(result.urlParams.get('formData')).toBe('username=john_doe&email=john@example.com')
    })

    it('handles query parameter with text/html content type', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'text/html' },
          },
        },
        {
          name: 'htmlContent',
          description: 'HTML formatted content',
          in: 'query',
          required: false,
          content: {
            'text/html': {
              schema: {
                type: 'string',
              },
              examples: {
                default: {
                  value: '<div><p>Hello World</p></div>',
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // HTML values should be passed as-is
      expect(result.urlParams.get('htmlContent')).toBe('<div><p>Hello World</p></div>')
    })

    it('handles query parameter with application/octet-stream content type', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'application/octet-stream' },
          },
        },
        {
          name: 'binaryData',
          description: 'Binary data as base64',
          in: 'query',
          required: false,
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
              },
              examples: {
                default: {
                  value: 'SGVsbG8gV29ybGQ=',
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // Binary data (base64 encoded) should be passed as-is
      expect(result.urlParams.get('binaryData')).toBe('SGVsbG8gV29ybGQ=')
    })

    it('serializes query parameter using its own content type, not the Content-Type header', () => {
      const params: ParameterObject[] = [
        {
          name: 'Content-Type',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          examples: {
            default: { value: 'text/plain' },
          },
        },
        {
          name: 'filter',
          description: 'JSON filter object',
          in: 'query',
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
              examples: {
                default: {
                  value: { status: 'active', limit: 10 },
                  'x-disabled': false,
                },
              },
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // The query parameter should be serialized as JSON even though Content-Type header is text/plain
      // This is because the parameter's content type is application/json
      expect(result.urlParams.get('filter')).toBe('{"status":"active","limit":10}')
    })

    it('handles query parameter with array value (defaults to explode: true)', () => {
      const params: ParameterObject[] = [
        {
          name: 'tags',
          description: 'Filter by tags',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          examples: {
            default: {
              value: ['javascript', 'typescript', 'vue'],
              'x-disabled': false,
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // Form style query parameters default to explode: true
      // Array values should be serialized as multiple parameters: tags=javascript&tags=typescript&tags=vue
      expect(result.urlParams.getAll('tags')).toEqual(['javascript', 'typescript', 'vue'])
    })

    it('handles query parameter with array value and explicit explode: false', () => {
      const params: ParameterObject[] = [
        {
          name: 'tags',
          description: 'Filter by tags',
          in: 'query',
          required: false,
          explode: false,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          examples: {
            default: {
              value: ['javascript', 'typescript', 'vue'],
              'x-disabled': false,
            },
          },
        },
      ]

      const result = buildRequestParameters(params)

      // With explicit explode: false, array values should be comma-separated
      expect(result.urlParams.get('tags')).toBe('javascript,typescript,vue')
    })

    it('handles query parameter with array value from named example', () => {
      const params: ParameterObject[] = [
        {
          name: 'domains',
          in: 'query',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
            title: 'Domains',
          },
          examples: {
            list: {
              summary: 'A list of domains',
              value: ['example.com', 'example.org'],
            },
          },
        },
      ]

      const result = buildRequestParameters(params, {}, 'list')

      // Form style query parameters default to explode: true
      // Array values should be serialized as multiple parameters
      expect(result.urlParams.getAll('domains')).toEqual(['example.com', 'example.org'])
    })

    it('handles query parameter with stringified array value from named example', () => {
      const params: ParameterObject[] = [
        {
          name: 'domains',
          in: 'query',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
            title: 'Domains',
          },
          examples: {
            list: {
              summary: 'A list of domains',
              value: JSON.stringify(['example.com', 'example.org']),
            },
          },
        },
      ]

      const result = buildRequestParameters(params, {}, 'list')

      // Form style query parameters default to explode: true
      // Array values should be serialized as multiple parameters
      expect(result.urlParams.getAll('domains')).toEqual(['example.com', 'example.org'])
    })

    it('handles query parameter with stringified object value from named example and no schema', () => {
      const params: ParameterObject[] = [
        {
          name: 'user',
          in: 'query',
          required: true,
          examples: {
            list: {
              value: JSON.stringify({ name: 'John', age: 30 }),
            },
          },
        },
      ]

      const result = buildRequestParameters(params, {}, 'list')

      // Form style query parameters default to explode: true
      // Array values should be serialized as multiple parameters
      expect(result.urlParams.get('user')).toEqual('{"name":"John","age":30}')
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
          {
            name: 'X-Id',
            in: 'header',
            required: true,
            style: 'simple',
            explode: false,
            examples: { default: { value: 5 } },
          },
        ] satisfies ParameterObject[]

        const result = buildRequestParameters(params)
        expect(result.headers['X-Id']).toBe('5')
      })

      it('handles simple style multiple values', () => {
        const params = [
          {
            name: 'X-Tags',
            in: 'header',
            required: true,
            style: 'simple',
            explode: false,
            examples: { default: { value: 'a' } },
          },
          {
            name: 'X-Tags',
            in: 'header',
            required: true,
            style: 'simple',
            explode: false,
            examples: { default: { value: 'b' } },
          },
          {
            name: 'X-Tags',
            in: 'header',
            required: true,
            style: 'simple',
            explode: false,
            examples: { default: { value: 'c' } },
          },
        ] satisfies ParameterObject[]
        const result = buildRequestParameters(params)

        // Simple style without explode: comma-separated values
        expect(result.headers['X-Tags']).toBe('a,b,c')
      })
    })

    describe('form style (default for query and cookie)', () => {
      it('handles form style with primitive value', () => {
        const params = [
          { name: 'id', in: 'query', required: true, style: 'form', examples: { default: { value: 5 } } },
        ] satisfies ParameterObject[]
        const result = buildRequestParameters(params)

        // Form style with explode: true -> color=blue&color=black&color=brown
        expect(result.urlParams.get('id')).toBe('5')
      })

      it('handles form style with array (explode: true - default)', () => {
        const params = [
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            examples: { default: { value: 'blue' } },
          },
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            examples: { default: { value: 'black' } },
          },
          {
            name: 'color',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            examples: { default: { value: 'brown' } },
          },
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
            required: true,
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
            required: true,
            style: 'spaceDelimited',
            explode: false,
            examples: { default: { value: 'blue' } },
          },
          {
            name: 'colors',
            in: 'query',
            required: true,
            style: 'spaceDelimited',
            explode: false,
            examples: { default: { value: 'black' } },
          },
          {
            name: 'colors',
            in: 'query',
            required: true,
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
            required: true,
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
            required: true,
            style: 'pipeDelimited',
            explode: false,
            examples: { default: { value: 'blue' } },
          },
          {
            name: 'colors',
            in: 'query',
            required: true,
            style: 'pipeDelimited',
            explode: false,
            examples: { default: { value: 'black' } },
          },
          {
            name: 'colors',
            in: 'query',
            required: true,
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

    describe('object serialization', () => {
      describe('simple style with objects', () => {
        it('handles simple style object with explode: false in header', () => {
          const params = [
            {
              name: 'X-Metadata',
              in: 'header',
              required: true,
              style: 'simple',
              explode: false,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Simple style with explode: false -> role,admin,firstName,Alex
          expect(result.headers['X-Metadata']).toBe('role,admin,firstName,Alex')
        })

        it('handles simple style object with explode: true in header', () => {
          const params = [
            {
              name: 'X-Metadata',
              in: 'header',
              required: true,
              style: 'simple',
              explode: true,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Simple style with explode: true -> role=admin,firstName=Alex
          expect(result.headers['X-Metadata']).toBe('role=admin,firstName=Alex')
        })

        it('handles simple style object with explode: false in path', () => {
          const params = [
            {
              name: 'id',
              in: 'path',
              required: true,
              style: 'simple',
              explode: false,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Simple style with explode: false -> role,admin,firstName,Alex (URL encoded)
          expect(result.pathVariables.id).toBe('role%2Cadmin%2CfirstName%2CAlex')
        })
      })

      describe('form style with objects', () => {
        it('handles form style object with explode: true in query', () => {
          const params = [
            {
              name: 'filter',
              in: 'query',
              required: true,
              style: 'form',
              explode: true,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Form style with explode: true -> role=admin&firstName=Alex
          // URLSearchParams should have separate entries
          expect(result.urlParams.get('role')).toBe('admin')
          expect(result.urlParams.get('firstName')).toBe('Alex')
        })

        it('handles form style object with explode: false in query', () => {
          const params = [
            {
              name: 'filter',
              in: 'query',
              required: true,
              style: 'form',
              explode: false,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Form style with explode: false -> filter=role,admin,firstName,Alex
          expect(result.urlParams.get('filter')).toBe('role,admin,firstName,Alex')
        })

        it('handles form style object with explode: true in cookie', () => {
          const params = [
            {
              name: 'session',
              in: 'cookie',
              required: true,
              style: 'form',
              explode: true,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Form style with explode: true creates separate cookie entries
          expect(result.cookies).toHaveLength(2)
          expect(result.cookies[0]).toMatchObject({ name: 'role', value: 'admin' })
          expect(result.cookies[1]).toMatchObject({ name: 'firstName', value: 'Alex' })
        })
      })

      describe('deepObject style', () => {
        it('handles deepObject style in query', () => {
          const params = [
            {
              name: 'filter',
              in: 'query',
              required: true,
              style: 'deepObject',
              explode: true,
              examples: { default: { value: { role: 'admin', firstName: 'Alex' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // deepObject style -> filter[role]=admin&filter[firstName]=Alex
          expect(result.urlParams.get('filter[role]')).toBe('admin')
          expect(result.urlParams.get('filter[firstName]')).toBe('Alex')
        })

        it('handles deepObject style with nested objects', () => {
          const params = [
            {
              name: 'user',
              in: 'query',
              required: true,
              style: 'deepObject',
              explode: true,
              examples: {
                default: {
                  value: {
                    name: { first: 'Alex', last: 'Smith' },
                    role: 'admin',
                  },
                },
              },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // deepObject style with nested objects -> user[name][first]=Alex&user[name][last]=Smith&user[role]=admin
          expect(result.urlParams.get('user[name][first]')).toBe('Alex')
          expect(result.urlParams.get('user[name][last]')).toBe('Smith')
          expect(result.urlParams.get('user[role]')).toBe('admin')
        })

        it('ensures we do not use the deepObject style with array items (default to form style)', () => {
          const params = [
            {
              name: 'items',
              in: 'query',
              required: true,
              style: 'deepObject',
              explode: true,
              schema: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
              examples: { default: { value: [1, 2, 3] } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)
          expect(result.urlParams.toString()).toBe('items=1&items=2&items=3')
        })
      })

      describe('edge cases with objects', () => {
        it('handles empty object', () => {
          const params = [
            {
              name: 'filter',
              in: 'query',
              required: true,
              style: 'form',
              explode: false,
              examples: { default: { value: {} } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Empty object should result in empty parameter value
          expect(result.urlParams.get('filter')).toBe('')
        })

        it('handles object with special characters in values', () => {
          const params = [
            {
              name: 'filter',
              in: 'query',
              required: true,
              style: 'form',
              explode: false,
              examples: { default: { value: { name: 'John Doe', email: 'john@example.com' } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Special characters should be preserved in the serialization
          expect(result.urlParams.get('filter')).toBe('name,John Doe,email,john@example.com')
        })

        it('handles object with numeric and boolean values', () => {
          const params = [
            {
              name: 'config',
              in: 'query',
              required: true,
              style: 'form',
              explode: true,
              examples: { default: { value: { limit: 10, active: true, offset: 0 } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // Numeric and boolean values should be converted to strings
          expect(result.urlParams.get('limit')).toBe('10')
          expect(result.urlParams.get('active')).toBe('true')
          expect(result.urlParams.get('offset')).toBe('0')
        })

        it('handles object with null and undefined values', () => {
          const params = [
            {
              name: 'filter',
              in: 'query',
              required: true,
              style: 'form',
              explode: true,
              examples: { default: { value: { name: 'John', age: null, city: undefined } } },
            },
          ] satisfies ParameterObject[]

          const result = buildRequestParameters(params)

          // null and undefined should be handled gracefully
          expect(result.urlParams.get('name')).toBe('John')
          expect(result.urlParams.get('age')).toBe('null')
          // undefined properties may or may not be included depending on implementation
        })
      })
    })
  })

  describe('content-based parameters', () => {
    it('filters out Content-Type header when value is multipart/form-data', () => {
      const params = [
        createParameter(
          { name: 'Content-Type', in: 'header', value: 'multipart/form-data' },
          { default: { value: 'multipart/form-data' } },
        ),
        createParameter({ name: 'X-Api-Key', in: 'header', value: 'secret' }, { default: { value: 'secret' } }),
      ]

      const result = buildRequestParameters(params, {}, 'default')

      // Content-Type should be filtered out for multipart/form-data
      expect(result.headers).not.toHaveProperty('Content-Type')
      // Other headers should still be present
      expect(result.headers['X-Api-Key']).toBe('secret')
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

  describe('content-based parameters', () => {
    /**
     * Tests for parameters that use the `content` field instead of `schema`.
     * According to OpenAPI 3.1, parameters can use either `schema` or `content`.
     * Content parameters only exist in query parameters.
     * When `content` is used, serialization follows the content type (e.g., JSON stringification
     * for application/json), not style-based serialization.
     */

    describe('query parameters with content', () => {
      it('serializes query parameter with application/json content as JSON', () => {
        const params: ParameterObject[] = [
          {
            name: 'filter',
            in: 'query',
            required: true,
            content: {
              'application/json': {
                examples: {
                  default: {
                    value: { status: 'active', limit: 10 },
                  },
                },
              },
            },
          },
        ]

        const result = buildRequestParameters(params)

        // Should be JSON stringified
        expect(result.urlParams.get('filter')).toBe('{"status":"active","limit":10}')
      })

      it('serializes query parameter with application/json content for array', () => {
        const params: ParameterObject[] = [
          {
            name: 'ids',
            in: 'query',
            required: true,
            content: {
              'application/json': {
                examples: {
                  default: {
                    value: [1, 2, 3],
                  },
                },
              },
            },
          },
        ]

        const result = buildRequestParameters(params)

        // Should be JSON stringified
        expect(result.urlParams.get('ids')).toBe('[1,2,3]')
      })

      it('serializes query parameter with text/plain content as string', () => {
        const params: ParameterObject[] = [
          {
            name: 'data',
            in: 'query',
            required: true,
            content: {
              'text/plain': {
                examples: {
                  default: {
                    value: { key: 'value' },
                  },
                },
              },
            },
          },
        ]

        const result = buildRequestParameters(params)

        // Should be converted to string
        expect(result.urlParams.get('data')).toBe('{"key":"value"}')
      })
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

    it('removes parameter with null value', () => {
      const params = [
        createParameter(
          { name: 'X-Null', in: 'header', value: null as unknown as string },
          { default: { value: null } },
        ),
      ]

      const result = buildRequestParameters(params)

      expect(result.headers['X-Null']).toBeUndefined()
    })

    it('headers cast numbers to strings', () => {
      const params = [createParameter({ name: 'X-Count', in: 'header', value: '42' }, { default: { value: 42 } })]
      const result = buildRequestParameters(params)
      expect(result.headers['X-Count']).toBe('42')
    })

    it('headers cast booleans to strings', () => {
      const params = [createParameter({ name: 'X-Flag', in: 'header', value: 'true' }, { default: { value: true } })]
      const result = buildRequestParameters(params)
      expect(result.headers['X-Flag']).toBe('true')
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
