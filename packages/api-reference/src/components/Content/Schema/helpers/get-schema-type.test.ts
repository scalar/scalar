import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'
import { getSchemaType } from './get-schema-type'

describe('get-schema-type', () => {
  describe('getSchemaType', () => {
    it('returns joined types when type is an array', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['string', 'number', 'boolean'],
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string | number | boolean')
    })

    it('returns title when present', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        title: 'User Profile',
        type: 'object',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('User Profile')
    })

    it('returns name when present and no title', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        name: 'UserSchema',
        type: 'object',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('UserSchema')
    })

    it('returns type with content encoding when both present', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'string',
        contentEncoding: 'base64',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string • base64')
    })

    it('returns type when only type is present', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'integer',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('integer')
    })

    it('returns empty string when no type is present', () => {
      const schema: OpenAPIV3_1.SchemaObject = {}

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('returns empty string when schema is null', () => {
      const result = getSchemaType(null as any)

      expect(result).toBe('')
    })

    it('returns empty string when schema is undefined', () => {
      const result = getSchemaType(undefined as any)

      expect(result).toBe('')
    })

    it('prioritizes array type over title', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['string', 'null'],
        title: 'Optional String',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string | null')
    })

    it('prioritizes title over name', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        title: 'User Object',
        name: 'UserSchema',
        type: 'object',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('User Object')
    })

    it('prioritizes name over type with content encoding', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        name: 'Base64String',
        type: 'string',
        contentEncoding: 'base64',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('Base64String')
    })

    it('handles empty array type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: [],
      }

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles single item array type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['string'],
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string')
    })

    it('handles content encoding without type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        contentEncoding: 'base64',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles complex schema with all properties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['string', 'number'],
        title: 'Mixed Value',
        name: 'MixedSchema',
        contentEncoding: 'utf8',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string | number')
    })

    it('handles array type containing object', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['string', 'object', 'null'],
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string | object | null')
    })

    it('handles array type with only object', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['object'],
      }

      const result = getSchemaType(schema)

      expect(result).toBe('object')
    })

    it('handles array schema with object items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array object[]')
    })

    it('handles nullable array schema with object items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['array', 'null'],
        items: {
          type: 'object',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array object[] | null')
    })

    it('handles array type with array and other types', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['array', 'string', 'null'],
        items: {
          type: 'number',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array number[] | string | null')
    })

    it('handles array type with array but no items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['array', 'string'],
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array | string')
    })

    it('handles array type with array and items but no other types', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['array'],
        items: {
          type: 'boolean',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array boolean[]')
    })

    it('handles array schema with items that have no type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {},
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles array schema with items that have title', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          title: 'User Object',
          type: 'object',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array User Object[]')
    })

    it('handles array schema with items that have name', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          name: 'UserSchema',
          type: 'object',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array UserSchema[]')
    })

    it('handles array schema with items that have content encoding', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: 'string',
          contentEncoding: 'base64',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array string • base64[]')
    })

    it('handles array schema with items that are arrays', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array array string[][]')
    })

    it('handles nullable array schema with items that have no type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        nullable: true,
        items: {},
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array | null')
    })

    it('handles array schema without items property', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles nullable array schema without items property', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        nullable: true,
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles schema with only type property', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'string',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('string')
    })

    it('handles schema with only content encoding', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        contentEncoding: 'base64',
      }

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles schema with nullable property but no type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        nullable: true,
      }

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles schema with items but no type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        items: {
          type: 'string',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles deeply nested array items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array array array string[][][]')
    })

    it('handles array type with multiple array types', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['array', 'array'],
        items: {
          type: 'string',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles array type with array and complex items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: ['array', 'object'],
        items: {
          type: ['string', 'number'],
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array (string | number)[] | object')
    })

    it('handles array schema with nullable items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: 'string',
          nullable: true,
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles array schema with items that have array type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have array type and other properties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
          title: 'Mixed Item',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have array type and name', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
          name: 'MixedSchema',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have array type and content encoding', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
          contentEncoding: 'base64',
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have only array type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: ['array'],
          items: {
            type: 'number',
          },
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array array number[][]')
    })

    it('handles array schema with items that have array type but no items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {
          type: ['string', 'array'],
        },
      }

      const result = getSchemaType(schema)

      expect(result).toBe('array (string | array)[]')
    })

    describe('title property', () => {
      it('uses the title for an array type if items are not defined', () => {
        const schema: OpenAPIV3_1.SchemaObject = {
          title: 'CustomArray',
          type: 'array',
        }
        const result = getSchemaType(schema)
        expect(result).toBe('CustomArray')
      })

      it('ignores the title for an array type if items are defined', () => {
        const schema: OpenAPIV3_1.SchemaObject = {
          title: 'CustomArray',
          type: 'array',
          items: {
            type: 'string',
          },
        }
        const result = getSchemaType(schema)
        expect(result).toBe('array string[]')
      })
    })
  })
})
