import type { SchemaObject } from '@scalar/types/openapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas'
import { assert, describe, expect, it } from 'vitest'

import { getSchemaType } from './get-schema-type'

/** Load a schema through the workspace store without coercion overwriting union types. */
const loadSchemaThroughWorkspaceStore = async (schema: any): Promise<SchemaObject> => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'test',
    document: {
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      // Skip coerce merge so JSON Schema union types (e.g. type: ['string', 'array']) are preserved.
      'x-scalar-navigation': { entries: [] },
      components: {
        schemas: {
          TestSchema: schema,
        },
      },
    },
  })

  const document = store.workspace.documents.test
  if (!isOpenApiDocument(document)) {
    throw new Error('Document is not an OpenAPI document')
  }

  const storedSchema = document.components?.schemas?.TestSchema
  assert(storedSchema)

  return storedSchema
}

describe('get-schema-type', () => {
  describe('getSchemaType', () => {
    it('returns joined types when type is an array', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['string', 'number', 'boolean'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | number | boolean')
    })

    it('returns raw type when title is present', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        title: 'User Profile',
        type: 'object',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('object')
    })

    it('returns type with content encoding when both present', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'string',
        contentEncoding: 'base64',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string • base64')
    })

    it('returns type when only type is present', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'integer',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('integer')
    })

    it('returns empty string when no type is present', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({})

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

    it('prioritizes array type over title', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['string', 'null'],
        title: 'Optional String',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | null')
    })

    it('handles empty array type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: [],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles single item array type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['string'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string')
    })

    it('handles content encoding without type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        contentEncoding: 'base64',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles complex schema with all properties', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['string', 'number'],
        title: 'Mixed Value',
        contentEncoding: 'utf8',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | number')
    })

    it('handles array type containing object', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['string', 'object', 'null'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string | object | null')
    })

    it('handles array type with only object', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['object'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('object')
    })

    it('handles array schema with object items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {
          type: 'object',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array object[]')
    })

    it('handles nullable array schema with object items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['array', 'null'],
        items: {
          type: 'object',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array object[] | null')
    })

    it('handles array type with array and other types', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['array', 'string', 'null'],
        items: {
          type: 'number',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array number[] | string | null')
    })

    it('handles array type with array but no items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['array', 'string'],
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array | string')
    })

    it('handles array type with array and items but no other types', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['array'],
        items: {
          type: 'boolean',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array boolean[]')
    })

    it('handles array schema with items that have no type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {},
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles array schema with items that have title', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {
          title: 'User Object',
          type: 'object',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array object[]')
    })

    it('handles array schema with items that have content encoding', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {
          type: 'string',
          contentEncoding: 'base64',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string • base64[]')
    })

    it('handles array schema with items that are arrays', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
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

    it('handles nullable array schema with items that have no type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        nullable: true,
        items: {},
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array | null')
    })

    it('handles array schema without items property', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles nullable array schema without items property', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        nullable: true,
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array')
    })

    it('handles schema with only type property', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'string',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('string')
    })

    it('handles schema with only content encoding', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        contentEncoding: 'base64',
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles schema with nullable property but no type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        nullable: true,
      })

      const result = getSchemaType(schema)

      expect(result).toBe('')
    })

    it('handles schema with items but no type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        items: {
          type: 'string',
        },
      })

      const result = getSchemaType(schema)

      // Without coercion, `type` is not inferred from `items` alone.
      expect(result).toBe('')
    })

    it('handles deeply nested array items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
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

    it('handles array type with multiple array types', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['array', 'array'],
        items: {
          type: 'string',
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles array type with array and complex items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: ['array', 'object'],
        items: {
          type: ['string', 'number'],
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (string | number)[] | object')
    })

    it('handles array schema with nullable items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {
          type: 'string',
          nullable: true,
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array string[]')
    })

    it('handles array schema with items that have array type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
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

    it('handles array schema with items that have array type and other properties', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
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

    it('handles array schema with items that have array type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
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

    it('handles array schema with items that have array type and content encoding', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {
          type: ['string', 'array'],
          items: {
            type: 'number',
          },
          contentEncoding: 'base64',
        } as any,
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (array number[] | string)[]')
    })

    it('handles array schema with items that have only array type', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
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

    it('handles array schema with items that have array type but no items', async () => {
      const schema = await loadSchemaThroughWorkspaceStore({
        type: 'array',
        items: {
          type: ['string', 'array'],
        },
      })

      const result = getSchemaType(schema)

      expect(result).toBe('array (string | array)[]')
    })

    describe('title property', () => {
      it('returns array type if items are not defined', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          title: 'CustomArray',
          type: 'array',
        })
        const result = getSchemaType(schema)
        expect(result).toBe('array')
      })

      it('ignores the title for an array type if items are defined', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
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
      it('returns raw type when xml.name is present', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'object',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('object')
      })

      it('returns raw type when both title and xml.name are present', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          title: 'Schema Title',
          type: 'object',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('object')
      })

      it('returns type with content encoding when xml.name is present', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'string',
          contentEncoding: 'base64',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('string • base64')
      })

      it('returns raw type when xml.name is present on primitive schemas', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'string',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('string')
      })

      it('returns array for an array type when items are not defined', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'array',
          xml: {
            name: 'XmlArray',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array')
      })

      it('ignores xml.name for an array type when items are defined', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
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

      it('handles xml.name with array type in type array', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: ['array', 'null'],
          xml: {
            name: 'NullableXmlArray',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array | null')
      })

      it('handles xml.name with complex array type', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: ['string', 'null'],
          xml: {
            name: 'NullableString',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('string | null')
      })

      it('handles xml object without name property', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'object',
          xml: {},
        })

        const result = getSchemaType(schema)

        expect(result).toBe('object')
      })

      it('handles xml.name with empty string', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'object',
          xml: {
            name: '',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('object')
      })

      it('handles xml.name for different schema types', async () => {
        const schemas = [
          { type: 'string', xml: { name: 'XmlString' }, expected: 'string' },
          { type: 'number', xml: { name: 'XmlNumber' }, expected: 'number' },
          { type: 'boolean', xml: { name: 'XmlBoolean' }, expected: 'boolean' },
          { type: 'integer', xml: { name: 'XmlInteger' }, expected: 'integer' },
        ]

        for (const { type, xml, expected } of schemas) {
          const schema = await loadSchemaThroughWorkspaceStore({ type, xml } as SchemaObject)
          const result = getSchemaType(schema)
          expect(result).toBe(expected)
        }
      })

      it('handles xml.name with all properties present', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'string',
          title: 'Schema Title',
          contentEncoding: 'base64',
          xml: {
            name: 'XmlTag',
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('string • base64')
      })

      it('handles xml.name in array items', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
          type: 'array',
          items: {
            type: 'object',
            xml: {
              name: 'XmlItem',
            },
          },
        })

        const result = getSchemaType(schema)

        expect(result).toBe('array object[]')
      })

      it('handles xml.name in nested array items', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
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

        expect(result).toBe('array array object[][]')
      })

      it('returns structural item type when both title and xml.name exist in array items', async () => {
        const schema = await loadSchemaThroughWorkspaceStore({
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

        expect(result).toBe('array object[]')
      })
    })
  })
})
