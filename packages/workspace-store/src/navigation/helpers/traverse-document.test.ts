import { describe, expect, it } from 'vitest'

import type { TraversedTag } from '@/schemas/navigation'
import { coerceValue } from '@/schemas/typebox-coerce'
import { type OpenApiDocument, SchemaObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

import { traverseDocument } from './traverse-document'

describe('traverseDocument', () => {
  const mockOptions: DocumentConfiguration = {
    'x-scalar-reference-config': {
      features: {
        showModels: true,
      },
      operationsSorter: 'alpha',
      tagSort: 'alpha',
    },
  }

  it('should handle empty document', () => {
    const emptyDoc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },

      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', emptyDoc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toEqual([])
  })

  it('should traverse document with description', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: '# Test Description\n## Section 1\nContent',
      },
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(1)
    expect(result.children[0]).toEqual({
      'id': 'doc-1/description/test-description',
      title: 'Test Description',
      type: 'text',
      children: [
        {
          'id': 'doc-1/description/section-1',
          title: 'Section 1',
          type: 'text',
        },
      ],
    })
  })

  it('should handle paths and operations', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            tags: ['test'],
            summary: 'Test Operation',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'test',
          description: 'Test Tag',
        },
      ],
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(1) // One tag group
    expect(result.children).toEqual([
      {
        'description': 'Test Tag',
        'id': 'doc-1/tag/test',
        'isGroup': false,
        'name': 'test',
        'title': 'test',
        isWebhooks: false,
        'type': 'tag',
        xKeys: {},
        'children': [
          {
            'id': 'doc-1/tag/test/get/test',
            'method': 'get',
            'path': '/test',
            isDeprecated: false,
            'ref': '#/paths/~1test/get',
            'title': 'Test Operation',
            'type': 'operation',
          },
        ],
      },
    ])
  })

  it('should handle webhooks', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      webhooks: {
        'test-webhook': {
          post: {
            summary: 'Test Webhook',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(1) // Webhooks section
    expect((result.children[0] as TraversedTag).children).toHaveLength(1)
    expect((result.children[0] as TraversedTag).children?.[0]).toEqual({
      'id': 'doc-1/webhook/post/test-webhook',
      'isDeprecated': false,
      'method': 'post',
      'name': 'test-webhook',
      'ref': '#/webhooks/test-webhook/post',
      'title': 'Test Webhook',
      'type': 'webhook',
    })
  })

  it('should handle schemas when not hidden', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          TestModel: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          }),
        },
      },
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(1) // Models section
    expect((result.children[0] as TraversedTag).children).toHaveLength(1)
    expect((result.children[0] as TraversedTag).children?.[0]).toEqual({
      'id': 'doc-1/model/testmodel',
      'name': 'TestModel',
      'ref': '#/components/schemas/TestModel',
      'title': 'TestModel',
      'type': 'model',
    })
  })

  it('should not include schemas when hidden', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          TestModel: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          }),
        },
      },
      'x-scalar-original-document-hash': '',
    }

    const optionsWithHiddenModels = {
      'x-scalar-reference-config': {
        ...mockOptions['x-scalar-reference-config'],
        features: {
          showModels: false,
        },
      },
    }

    const result = traverseDocument('doc-1', doc, optionsWithHiddenModels)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(0)
  })

  it('should handle multiple tags and operations', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test1': {
          get: {
            tags: ['tag1'],
            summary: 'Test Operation 1',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
        '/test2': {
          post: {
            tags: ['tag2'],
            summary: 'Test Operation 2',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'tag1',
          description: 'Tag 1',
        },
        {
          name: 'tag2',
          description: 'Tag 2',
        },
      ],
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(2) // Two tag groups
    expect(result.children).toEqual([
      {
        'id': 'doc-1/tag/tag1',
        'description': 'Tag 1',
        'isGroup': false,
        'name': 'tag1',
        isWebhooks: false,
        'title': 'tag1',
        'type': 'tag',
        xKeys: {},
        'children': [
          {
            'id': 'doc-1/tag/tag1/get/test1',
            'method': 'get',
            'path': '/test1',
            isDeprecated: false,
            'ref': '#/paths/~1test1/get',
            'title': 'Test Operation 1',
            'type': 'operation',
          },
        ],
      },
      {
        'description': 'Tag 2',
        'id': 'doc-1/tag/tag2',
        'isGroup': false,
        'name': 'tag2',
        isWebhooks: false,
        'title': 'tag2',
        'type': 'tag',
        xKeys: {},
        'children': [
          {
            'id': 'doc-1/tag/tag2/post/test2',
            'method': 'post',
            'path': '/test2',
            isDeprecated: false,
            'ref': '#/paths/~1test2/post',
            'title': 'Test Operation 2',
            'type': 'operation',
          },
        ],
      },
    ])
  })

  it('should handle operations without tags', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Untagged Operation',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children).toHaveLength(1) // One tag group for untagged operations
    expect(result.children).toEqual([
      {
        'id': 'doc-1/tag/default/get/test',
        'isDeprecated': false,
        'method': 'get',
        'path': '/test',
        'ref': '#/paths/~1test/get',
        'title': 'Untagged Operation',
        'type': 'operation',
      },
    ])
  })

  it('should respect tag sorting configuration', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test1': {
          get: {
            tags: ['z-tag'],
            summary: 'Test Operation 1',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
        '/test2': {
          post: {
            tags: ['a-tag'],
            summary: 'Test Operation 2',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'z-tag',
          description: 'Z Tag',
        },
        {
          name: 'a-tag',
          description: 'A Tag',
        },
      ],
      'x-scalar-original-document-hash': '',
    }

    const result = traverseDocument('doc-1', doc, mockOptions)
    expect(result.id).toBe('doc-1')
    expect(result.children[0]?.title).toBe('a-tag')
    expect(result.children[1]?.title).toBe('z-tag')
  })
})
