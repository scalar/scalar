import { beforeEach, describe, expect, it } from 'vitest'

import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import { coerceValue } from '@/schemas/typebox-coerce'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import { OpenAPIDocumentSchema } from '@/schemas/v3.1/strict/openapi-document'

import { traverseSchemas } from './traverse-schemas'

describe('traverseSchemas', () => {
  // Mock getModelId function
  const mockGetModelId: TraverseSpecOptions['getModelId'] = (params) => {
    if (!params) {
      return 'model'
    }
    return `model-${params.name}`
  }

  // Mock titlesMap
  const mockTitlesMap = new Map<string, string>()

  let mockTagsMap: TagsMap

  beforeEach(() => {
    // Mock tagsMap with correct structure
    mockTagsMap = new Map([
      [
        'default',
        {
          tag: { name: 'default' },
          entries: [],
        },
      ],
      [
        'users',
        {
          tag: { name: 'users' },
          entries: [],
        },
      ],
      [
        'products',
        {
          tag: { name: 'products' },
          entries: [],
        },
      ],
    ])
  })

  it('should return empty array when no schemas exist', () => {
    const content: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    }

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)
    expect(result).toEqual([])
  })

  it('should create entries for valid schemas', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              price: { type: 'number' },
            },
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(2)
    expect(result).toEqual([
      {
        type: 'model',
        ref: '#/content/components/schemas/User',
        id: 'model-User',
        title: 'User',
        name: 'User',
      },
      {
        type: 'model',
        ref: '#/content/components/schemas/Product',
        id: 'model-Product',
        title: 'Product',
        name: 'Product',
      },
    ])

    // Verify titlesMap was populated
    expect(mockTitlesMap.get('model-User')).toBe('User')
    expect(mockTitlesMap.get('model-Product')).toBe('Product')
  })

  it('should skip schemas with x-internal flag', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          PublicUser: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          InternalUser: {
            'x-internal': true,
            type: 'object',
            properties: {
              secret: { type: 'string' },
            },
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('PublicUser')
  })

  it('should skip schemas with x-scalar-ignore flag', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          ValidSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          IgnoredSchema: {
            'x-scalar-ignore': true,
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('ValidSchema')
  })

  it('should handle schemas with no properties', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          EmptySchema: {
            type: 'object',
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      type: 'model',
      ref: '#/content/components/schemas/EmptySchema',
      id: 'model-EmptySchema',
      title: 'EmptySchema',
      name: 'EmptySchema',
    })
  })

  it('should handle schemas with special characters in names', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          'User-Profile': {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('User-Profile')
    expect(result[0]?.id).toBe('model-User-Profile')
  })

  it('should handle multiple filtering conditions', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          ValidSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          InternalSchema: {
            'x-internal': true,
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          IgnoredSchema: {
            'x-scalar-ignore': true,
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('ValidSchema')
  })

  it('uses the title attribute of the schema', () => {
    const content = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          ValidSchema: {
            title: 'Foobar',
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          InternalSchema: {
            'x-internal': true,
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          IgnoredSchema: {
            'x-scalar-ignore': true,
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    })

    const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Foobar')
  })

  describe('x-tags', () => {
    it('should handle schemas with x-tags', () => {
      const content = coerceValue(OpenAPIDocumentSchema, {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
              'x-tags': ['users'],
            },
            Product: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                price: { type: 'number' },
              },
              'x-tags': ['products'],
            },
            UntaggedSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        },
      })

      const result = traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

      // Verify the schemas are in the correct tags
      expect(mockTagsMap.get('users')?.entries).toHaveLength(1)
      expect(mockTagsMap.get('products')?.entries).toHaveLength(1)

      // Verify the entries in each tag
      const userEntry = mockTagsMap.get('users')?.entries[0]
      expect(userEntry).toMatchObject({
        id: 'model-User',
        title: 'User',
        name: 'User',
      })

      const productEntry = mockTagsMap.get('products')?.entries[0]
      expect(productEntry).toMatchObject({
        id: 'model-Product',
        title: 'Product',
        name: 'Product',
      })

      const untaggedEntry = result[0]
      expect(untaggedEntry).toMatchObject({
        id: 'model-UntaggedSchema',
        title: 'UntaggedSchema',
        name: 'UntaggedSchema',
      })
    })

    it('should handle schemas with multiple x-tags', () => {
      const content = coerceValue(OpenAPIDocumentSchema, {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            UserProduct: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                price: { type: 'number' },
              },
              'x-tags': ['users', 'products'],
            },
          },
        },
      })

      traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

      // Verify the schema is in both tags
      expect(mockTagsMap.get('users')?.entries).toHaveLength(1)
      expect(mockTagsMap.get('products')?.entries).toHaveLength(1)

      // Verify the entries in each tag
      const userEntry = mockTagsMap.get('users')?.entries[0]
      expect(userEntry).toMatchObject({
        id: 'model-UserProduct',
        title: 'UserProduct',
        name: 'UserProduct',
      })

      const productEntry = mockTagsMap.get('products')?.entries[0]
      expect(productEntry).toMatchObject({
        id: 'model-UserProduct',
        title: 'UserProduct',
        name: 'UserProduct',
      })
    })

    it('should handle schemas with non-existent x-tags', () => {
      const content = coerceValue(OpenAPIDocumentSchema, {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            UnknownTaggedSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
              'x-tags': ['non-existent-tag'],
            },
          },
        },
      })

      traverseSchemas(content, mockTagsMap, mockTitlesMap, mockGetModelId)

      // Verify the entry in the default tag
      expect(mockTagsMap.get('non-existent-tag')?.entries).toHaveLength(1)
      expect(mockTagsMap.get('non-existent-tag')?.entries[0]).toMatchObject({
        id: 'model-UnknownTaggedSchema',
        title: 'UnknownTaggedSchema',
        name: 'UnknownTaggedSchema',
      })
    })
  })
})
