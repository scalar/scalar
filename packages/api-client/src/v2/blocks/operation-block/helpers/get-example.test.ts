import type {
  ParameterObject,
  ParameterWithContentObject,
  ParameterWithSchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getExample } from './get-example'

describe('getExample', () => {
  describe('content-based parameters', () => {
    it('returns example value when content param has application/json with object value', () => {
      const param = {
        content: {
          'application/json': {
            example: { name: 'John', age: 30 },
          },
        },
      }

      const result = getExample(param, undefined, 'application/json')
      expect(result).toEqual({ value: { name: 'John', age: 30 } })
    })

    it('falls back to content.*.examples when param.examples is missing', () => {
      const param = {
        name: 'q',
        in: 'query',
        content: {
          'application/json': {
            examples: {
              sample: { value: { ok: true } },
            },
          },
        },
      }

      const result = getExample(param, 'sample', 'application/json')
      expect(result?.value).toEqual({ ok: true })
    })

    it('uses first media type and first example key when not provided', () => {
      const param = {
        name: 'q',
        in: 'query',
        content: {
          'text/plain': {
            examples: {
              e1: { value: 'hello' },
              e2: { value: 'world' },
            },
          },
        },
      }

      const result = getExample(param, undefined, undefined)
      expect(result?.value).toEqual('hello')
    })

    it('doesnt fallback when wrong example key is provided at param level', () => {
      const param = {
        name: 'q',
        in: 'query',
        // @ts-expect-error - this is a test
        examples: {
          a: { value: 'nope' },
        },
        content: {
          'application/json': {
            examples: { b: { value: 'yep' } },
          },
        },
      } satisfies ParameterWithContentObject

      const result = getExample(param, 'missing', 'application/json')
      expect(result?.value).toBeUndefined()
    })

    it('returns example value when content param has application/xml with string value', () => {
      const param = {
        content: {
          'application/xml': {
            example: '<user><name>John</name></user>',
          },
        },
      }

      const result = getExample(param, undefined, 'application/xml')
      expect(result).toEqual({ value: '<user><name>John</name></user>' })
    })

    it('returns example from examples object when exampleKey is provided', () => {
      const param = {
        content: {
          'application/json': {
            examples: {
              user1: { value: { name: 'Alice' } },
              user2: { value: { name: 'Bob' } },
            },
          },
        },
      }

      const result = getExample(param, 'user2', 'application/json')
      expect(result).toEqual({ value: { name: 'Bob' } })
    })

    it('returns first example from examples object when no exampleKey is provided', () => {
      const param = {
        content: {
          'application/json': {
            examples: {
              user1: { value: { name: 'Alice' } },
              user2: { value: { name: 'Bob' } },
            },
          },
        },
      }

      const result = getExample(param, undefined, 'application/json')
      expect(result).toEqual({ value: { name: 'Alice' } })
    })

    it('uses first content type when contentType is not provided', () => {
      const param = {
        content: {
          'application/xml': {
            example: '<data>xml</data>',
          },
          'application/json': {
            example: { data: 'json' },
          },
        },
      }

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: '<data>xml</data>' })
    })

    it('does not parse the string object if theres no content type', () => {
      const stringified = JSON.stringify({ data: 'json' })
      const param = {
        example: stringified,
      } as unknown as ParameterWithContentObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: stringified })
    })

    it('does not parse the string array if theres no content type', () => {
      const stringified = JSON.stringify([1, 2, 3])
      const param = {
        example: stringified,
      } as unknown as ParameterWithContentObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: stringified })
    })

    it('returns undefined when no example is found in content', () => {
      const param = {
        content: {
          'application/json': {},
        },
      }

      const result = getExample(param, undefined, 'application/json')
      expect(result).toBeUndefined()
    })
  })

  describe('schema-based parameters', () => {
    it('returns example when schema type is object and value is an object', () => {
      const param = {
        schema: {
          type: 'object',
          example: { id: 1, name: 'Product' },
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: { id: 1, name: 'Product' } })
    })

    it('returns first value from schema.examples array', () => {
      const param = {
        schema: {
          type: 'object',
          examples: [
            { id: 2, title: 'Task' },
            { id: 3, title: 'Another Task' },
          ],
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: { id: 2, title: 'Task' } })
    })

    it('returns example when schema type is array', () => {
      const param = {
        schema: {
          type: 'array',
          example: [1, 2, 3, 4],
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: [1, 2, 3, 4] })
    })

    it('parses the boolean when schema type is boolean', () => {
      const param = {
        schema: {
          type: 'boolean',
          example: true,
        },
      } as ParameterWithSchemaObject
      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: true })
    })

    it('returns example from examples field at parameter level', () => {
      const param = {
        examples: {
          example1: { value: 'first' },
          example2: { value: 'second' },
        },
      } as unknown as ParameterWithSchemaObject

      const result = getExample(param, 'example2', undefined)
      expect(result).toEqual({ value: 'second' })
    })

    it('returns first example from examples object when no exampleKey is provided', () => {
      const param = {
        examples: {
          example1: { value: 'first' },
          example2: { value: 'second' },
        },
      } as unknown as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: 'first' })
    })

    it('returns default value from schema when no examples are provided', () => {
      const param = {
        schema: {
          type: 'string',
          default: 'default value',
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: 'default value' })
    })

    it('returns first enum value from schema when no examples are provided', () => {
      const param = {
        schema: {
          type: 'string',
          enum: ['active', 'inactive', 'pending'],
        },
      } as unknown as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: 'active' })
    })

    it('prioritizes default over enum over examples array over example field', () => {
      const param = {
        schema: {
          type: 'string',
          default: 'default value',
          enum: ['enum value'],
          examples: ['examples array value'],
          example: 'example field value',
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: 'default value' })
    })

    it('returns undefined when no example is found in schema', () => {
      const param = {
        schema: {
          type: 'string',
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toBeUndefined()
    })

    it('returns schema default value when exampleKey does not exist', () => {
      const param = {
        name: 'limit',
        in: 'query',
        examples: {
          large: { value: 100 },
        },
        schema: {
          type: 'integer',
          default: 10,
        },
      } satisfies ParameterObject

      const result = getExample(param, 'nonexistent', undefined)
      expect(result?.value).toEqual(10)
    })

    it('returns schema default value for boolean type', () => {
      const param = {
        name: 'includeArchived',
        in: 'query',
        examples: {},
        schema: {
          type: 'boolean',
          default: false,
        },
      } satisfies ParameterObject

      const result = getExample(param, 'default', undefined)
      expect(result?.value).toEqual(false)
    })

    it('returns schema default value when default is 0', () => {
      const param = {
        name: 'offset',
        in: 'query',
        examples: {},
        schema: {
          type: 'integer',
          default: 0,
        },
      } satisfies ParameterObject

      const result = getExample(param, 'default', undefined)
      expect(result?.value).toEqual(0)
    })

    it('returns schema default value when default is empty string', () => {
      const param = {
        name: 'search',
        in: 'query',
        examples: {},
        schema: {
          type: 'string',
          default: '',
        },
      } satisfies ParameterObject

      const result = getExample(param, 'default', undefined)
      expect(result?.value).toEqual('')
    })

    it('returns undefined when schema has no default and no matching example', () => {
      const param = {
        name: 'page',
        in: 'query',
        examples: {
          first: { value: 1 },
        },
        schema: {
          type: 'integer',
        },
      } satisfies ParameterObject

      const result = getExample(param, 'nonexistent', undefined)
      expect(result).toBeUndefined()
    })

    it('returns first value from schema.enum when no other examples exist', () => {
      const param = {
        name: 'priority',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
      } satisfies ParameterObject

      const result = getExample(param, undefined, undefined)
      expect(result?.value).toEqual('low')
    })

    it('returns value from examples for array parameter', () => {
      const param = {
        name: 'domains',
        in: 'query',
        required: true,
        examples: {
          list: {
            summary: 'A list of domains',
            value: ['example.com', 'example.org'],
            'x-disabled': false,
          },
        },
        schema: {
          type: 'array',
          title: 'Domains',
          items: {
            type: 'string',
          },
        },
      } satisfies ParameterObject

      const result = getExample(param, 'list', undefined)
      expect(result?.value).toEqual(['example.com', 'example.org'])
    })
  })

  describe('other cases', () => {
    it('resolves $ref values when example is a reference', () => {
      const param = {
        name: 'data',
        in: 'query',
        examples: {
          sample: {
            '$ref': '#/components/examples/SampleData',
            '$ref-value': { value: 'resolved-example-data' },
          },
        },
      } satisfies ParameterObject

      const result = getExample(param, 'sample', undefined)
      expect(result?.value).toEqual('resolved-example-data')
    })

    it('returns value from param.examples by provided key', () => {
      const param = {
        name: 'q',
        in: 'query',
        examples: {
          a: { value: 123 },
          b: { value: 456 },
        },
      } satisfies ParameterObject

      const result = getExample(param, 'b', undefined)
      expect(result?.value).toEqual(456)
    })

    it('returns deprecated param.example when present and no others match', () => {
      const param = {
        name: 'q',
        in: 'query',
        example: 'fallback',
      } satisfies ParameterObject

      const result = getExample(param, undefined, undefined)
      expect(result?.value).toEqual('fallback')
    })

    it('returns undefined when no examples or example fields exist', () => {
      const param = {
        name: 'q',
        in: 'query',
      } satisfies ParameterObject

      const result = getExample(param, undefined, undefined)
      expect(result).toBeUndefined()
    })

    it('handles empty object gracefully', () => {
      const param = {} as ParameterObject
      const result = getExample(param, undefined, undefined)
      expect(result).toBeUndefined()
    })

    it('handles null values in example', () => {
      const param = {
        schema: {
          type: 'string',
          example: null,
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value: null })
    })

    it('handles falsy values in example (false, 0, empty string, null)', () => {
      const falsyTests = [
        { value: false, type: 'boolean' },
        { value: 0, type: 'number' },
        { value: '', type: 'string' },
        { value: null, type: 'string' },
      ]

      falsyTests.forEach(({ value, type }) => {
        const param = {
          schema: {
            type,
            example: value,
          },
        } as ParameterWithSchemaObject

        const result = getExample(param, undefined, undefined)
        expect(result).toEqual({ value })
      })
    })
  })
})
