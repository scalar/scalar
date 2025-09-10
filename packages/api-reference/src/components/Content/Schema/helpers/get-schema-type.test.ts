import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getSchemaType } from './get-schema-type'

describe('get-schema-type', () => {
  describe('getSchemaType', () => {
    it('returns joined types when type is an array', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['string', 'number', 'boolean'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | number | boolean')
    })

    it('returns title when present', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        title: 'User Profile',
        type: 'object',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('User Profile')
    })

    it('returns type with content encoding when both present', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'string',
        contentEncoding: 'base64',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string • base64')
    })

    it('returns type when only type is present', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'integer',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('integer')
    })

    it('returns empty string when no type is present', () => {
      const schema = coerceValue(SchemaObjectSchema, {})

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
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['string', 'null'],
        title: 'Optional String',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | null')
    })

    it('handles empty array type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: [],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles single item array type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['string'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string')
    })

    it('handles content encoding without type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        contentEncoding: 'base64',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles complex schema with all properties', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['string', 'number'],
        title: 'Mixed Value',
        contentEncoding: 'utf8',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | number')
    })

    it('handles array type containing object', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['string', 'object', 'null'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | object | null')
    })

    it('handles array type with only object', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['object'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('object')
    })

    it('handles array schema with object items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: 'object',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array object[]')
    })

    it('handles nullable array schema with object items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['array', 'null'],
        items: {
          type: 'object',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array object[] | null')
    })

    it('handles array type with array and other types', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['array', 'string', 'null'],
        items: {
          type: 'number',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array number[] | string | null')
    })

    it('handles array type with array but no items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['array', 'string'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array | string')
    })

    it('handles array type with array and items but no other types', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['array'],
        items: {
          type: 'boolean',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array boolean[]')
    })

    it('handles array schema with items that have no type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {},
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles array schema with items that have title', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          title: 'User Object',
          type: 'object',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array User Object[]')
    })

    it('handles array schema with items that have content encoding', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: 'string',
          contentEncoding: 'base64',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string • base64[]')
    })

    it('handles array schema with items that are arrays', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array array string[][]')
    })

    it('handles nullable array schema with items that have no type', () => {
      const schema = {
        type: 'array',
        nullable: true,
        items: {},
      }

      const result = getSchemaType(schema as any)

      expect(result).toBe('array | null')
    })

    it('handles array schema without items property', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles nullable array schema without items property', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        nullable: true,
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles schema with only type property', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'string',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string')
    })

    it('handles schema with only content encoding', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        contentEncoding: 'base64',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles schema with nullable property but no type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        nullable: true,
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles schema with items but no type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        items: {
          type: 'string',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles deeply nested array items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
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
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array array array string[][][]')
    })

    it('handles array type with multiple array types', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['array', 'array'],
        items: {
          type: 'string',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles array type with array and complex items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: ['array', 'object'],
        items: {
          type: ['string', 'number'],
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (string | number)[] | object')
    })

    it('handles array schema with nullable items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: 'string',
          nullable: true,
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles array schema with items that have array type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have array type and other properties', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
          title: 'Mixed Item',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have array type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have array type and content encoding', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
          contentEncoding: 'base64',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have only array type', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: ['array'],
          items: {
            type: 'number',
          },
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array array number[][]')
    })

    it('handles array schema with items that have array type but no items', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'array',
        items: {
          type: ['string', 'array'],
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (string | array)[]')
    })

    describe('title property', () => {
      it('uses the title for an array type if items are not defined', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          title: 'CustomArray',
          type: 'array',
        })
        const result = getSchemaType(schema)
        expect(result).toBe('CustomArray')
      })

      it('ignores the title for an array type if items are defined', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          title: 'CustomArray',
          type: 'array',
          items: {
            type: 'string',
          },
        })
        const result = getSchemaType(schema)
        expect(result).toBe('array string[]')
      })
    })

    describe('xml.name property', () => {
      it('returns xml.name when present and no title or name', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'object',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('XmlTag')
      })

      it('prioritizes title over xml.name', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          title: 'Schema Title',
          type: 'object',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('Schema Title')
      })

      it('prioritizes xml.name over type with content encoding', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'string',
          contentEncoding: 'base64',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('XmlTag')
      })

      it('prioritizes xml.name over type only', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'string',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('XmlTag')
      })

      it('uses xml.name for an array type when items are not defined', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'array',
          xml: {
            name: 'XmlArray',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('XmlArray')
      })

      it('ignores xml.name for an array type when items are defined', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: {
            type: 'string',
          },
          xml: {
            name: 'XmlArray',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array string[]')
      })

      it('handles xml.name with array type in type array', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: ['array', 'null'],
          xml: {
            name: 'NullableXmlArray',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array | null')
      })

      it('handles xml.name with complex array type', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: ['string', 'null'],
          xml: {
            name: 'NullableString',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('string | null')
      })

      it('handles xml object without name property', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'object',
          xml: {},
        })

        const result = getSchemaType(schema)

        expect(result).toBe('object')
      })

      it('handles xml.name with empty string', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'object',
          xml: {
            name: '',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('object')
      })

      it('handles xml.name for different schema types', () => {
        const schemas = [
          { type: 'string', xml: { name: 'XmlString' }, expected: 'XmlString' },
          { type: 'number', xml: { name: 'XmlNumber' }, expected: 'XmlNumber' },
          { type: 'boolean', xml: { name: 'XmlBoolean' }, expected: 'XmlBoolean' },
          { type: 'integer', xml: { name: 'XmlInteger' }, expected: 'XmlInteger' },
        ]

        schemas.forEach(({ type, xml, expected }) => {
          const schema = coerceValue(SchemaObjectSchema, { type, xml })
          const result = getSchemaType(schema)
          expect(result).toBe(expected)
        })
      })

      it('handles xml.name with all properties present', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'string',
          title: 'Schema Title',
          contentEncoding: 'base64',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('Schema Title')
      })

      it('handles xml.name in array items', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: {
            type: 'object',
            xml: {
              name: 'XmlItem',
            },
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array XmlItem[]')
      })

      it('handles xml.name in nested array items', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'object',
              xml: {
                name: 'NestedXmlItem',
              },
            },
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array array NestedXmlItem[][]')
      })

      it('prioritizes title over xml.name in array items', () => {
        const schema = coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: {
            type: 'object',
            title: 'Item Title',
            xml: {
              name: 'XmlItem',
            },
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array Item Title[]')
      })
    })
  })
})
