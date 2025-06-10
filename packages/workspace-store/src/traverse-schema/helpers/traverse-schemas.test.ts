import { describe, it, expect } from 'vitest'
import { traverseSchemas } from './traverse-schemas'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TraverseSpecOptions } from '@/traverse-schema/types'

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

  it('should return empty array when no schemas exist', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)
    expect(result).toEqual([])
  })

  it('should create entries for valid schemas', () => {
    const content: OpenAPIV3_1.Document = {
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
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(2)
    expect(result).toEqual([
      {
        id: 'model-User',
        title: 'User',
        name: 'User',
        type: 'model',
        'ref': '#/content/components/schemas/User',
      },
      {
        id: 'model-Product',
        title: 'Product',
        name: 'Product',
        type: 'model',
        'ref': '#/content/components/schemas/Product',
      },
    ])

    // Verify titlesMap was populated
    expect(mockTitlesMap.get('model-User')).toBe('User')
    expect(mockTitlesMap.get('model-Product')).toBe('Product')
  })

  it('should skip schemas with x-internal flag', () => {
    const content: OpenAPIV3_1.Document = {
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
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('PublicUser')
  })

  it('should skip schemas with x-scalar-ignore flag', () => {
    const content: OpenAPIV3_1.Document = {
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
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('ValidSchema')
  })

  it('should handle schemas with no properties', () => {
    const content: OpenAPIV3_1.Document = {
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
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'model-EmptySchema',
      title: 'EmptySchema',
      name: 'EmptySchema',
      type: 'model',
      'ref': '#/content/components/schemas/EmptySchema',
    })
  })

  it('should handle schemas with special characters in names', () => {
    const content: OpenAPIV3_1.Document = {
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
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('User-Profile')
    expect(result[0].id).toBe('model-User-Profile')
  })

  it('should handle multiple filtering conditions', () => {
    const content: OpenAPIV3_1.Document = {
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
    }

    const result = traverseSchemas(content, mockTitlesMap, mockGetModelId)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('ValidSchema')
  })
})
