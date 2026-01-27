import type {
  ParameterObject,
  ParameterWithSchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { deSerializeParameter } from './de-serialize-parameter'

describe('de-serialize-parameter', () => {
  describe('deSerializeParameter', () => {
    it('parses JSON string to object when content type includes json', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      }
      const example = '{"key":"value","nested":{"prop":123}}'

      const result = deSerializeParameter(example, param)

      expect(result).toEqual({ key: 'value', nested: { prop: 123 } })
    })

    it('parses JSON string to array when schema type is array', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
      }
      const example = '["item1","item2","item3"]'

      const result = deSerializeParameter(example, param)

      expect(result).toEqual(['item1', 'item2', 'item3'])
    })

    it('returns original string when JSON parsing fails for content type', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      }
      const example = '{invalid json string'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{invalid json string')
    })

    it('returns original string when JSON parsing fails for schema type', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'object',
        },
      }
      const example = '{"incomplete": '

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{"incomplete": ')
    })

    it('handles schema with array of types and uses first type', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: ['object', 'null'],
        },
      }
      const example = '{"data":"value"}'

      const result = deSerializeParameter(example, param)

      expect(result).toEqual({ data: 'value' })
    })

    it('parses boolean string when schema type is boolean', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'boolean',
        },
      }
      const example = 'true'

      const result = deSerializeParameter(example, param)

      expect(result).toBe(true)
    })

    it('parses number string when schema type is number', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'number',
        },
      }
      const example = '42.5'

      const result = deSerializeParameter(example, param)

      expect(result).toBe(42.5)
    })

    it('parses integer string when schema type is integer', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'integer',
        },
      }
      const example = '123'

      const result = deSerializeParameter(example, param)

      expect(result).toBe(123)
    })

    it('parses null string when schema type is null', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'null',
        },
      }
      const example = 'null'

      const result = deSerializeParameter(example, param)

      expect(result).toBe(null)
    })

    it('does not parse string when schema type is string', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'string',
        },
      }
      const example = 'just a string'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('just a string')
    })

    it('returns example unchanged when parameter has neither content nor schema', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
      }
      const example = 'some value'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('some value')
    })

    it('returns non-string example unchanged for content type', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      }
      const example = { already: 'parsed' }

      const result = deSerializeParameter(example, param)

      expect(result).toEqual({ already: 'parsed' })
    })

    it('returns non-string example unchanged for schema type', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'object',
        },
      }
      const example = { already: 'parsed' }

      const result = deSerializeParameter(example, param)

      expect(result).toEqual({ already: 'parsed' })
    })

    it('handles content type without json in name', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: {
          'text/plain': {
            schema: { type: 'string' },
          },
        },
      }
      const example = '{"key":"value"}'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{"key":"value"}')
    })

    it('handles empty content object', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: {},
      }
      const example = '{"key":"value"}'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{"key":"value"}')
    })

    it('handles undefined content', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: undefined,
      }
      const example = '{"key":"value"}'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{"key":"value"}')
    })

    it('handles schema without type property', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        // @ts-expect-error - just for testing
        schema: {
          properties: {
            key: { type: 'string' },
          },
        },
      }
      const example = '{"key":"value"}'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{"key":"value"}')
    })

    it('handles empty array type', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: [],
        },
      }
      const example = '{"key":"value"}'

      const result = deSerializeParameter(example, param)

      expect(result).toBe('{"key":"value"}')
    })

    it('handles null and undefined examples', () => {
      const param: ParameterWithSchemaObject = {
        name: 'test',
        in: 'query',
        schema: {
          type: 'object',
        },
      }

      expect(deSerializeParameter(null, param)).toBe(null)
      expect(deSerializeParameter(undefined, param)).toBe(undefined)
    })

    it('handles complex nested JSON with content type', () => {
      const param: ParameterObject = {
        name: 'test',
        in: 'query',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      }
      const example = '{"user":{"name":"John","age":30,"tags":["admin","user"]}}'

      const result = deSerializeParameter(example, param)

      expect(result).toEqual({
        user: {
          name: 'John',
          age: 30,
          tags: ['admin', 'user'],
        },
      })
    })
  })
})
