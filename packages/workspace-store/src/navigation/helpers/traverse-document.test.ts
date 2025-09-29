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
      getHeadingId: (heading) => heading.value,
      getOperationId: (operation) => operation.summary ?? '',
      getWebhookId: (webhook) => webhook?.name ?? 'webhooks',
      getModelId: (model) => model?.name ?? '',
      getTagId: (tag) => tag.name ?? '',
    },
  }

  it('should handle empty document', () => {
    const emptyDoc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    }

    const result = traverseDocument(emptyDoc, mockOptions)
    expect(result.entries).toEqual([])
  })

  it('should traverse document with description', () => {
    const doc: OpenApiDocument = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: '# Test Description\n## Section 1\nContent',
      },
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]).toEqual({
      'id': 'Test Description',
      title: 'Test Description',
      type: 'text',
      children: [
        {
          'id': 'Section 1',
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
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1) // One tag group
    expect(result.entries).toEqual([
      {
        'description': 'Test Tag',
        'id': 'test',
        'isGroup': false,
        'name': 'test',
        'title': 'test',
        'type': 'tag',
        xKeys: {},
        'children': [
          {
            'id': 'Test Operation',
            'method': 'get',
            'path': '/test',
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
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1) // Webhooks section
    expect((result.entries[0] as TraversedTag).children).toHaveLength(1)
    expect((result.entries[0] as TraversedTag).children?.[0]).toEqual({
      'id': 'test-webhook',
      'isDeprecated': undefined,
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
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1) // Models section
    expect((result.entries[0] as TraversedTag).children).toHaveLength(1)
    expect((result.entries[0] as TraversedTag).children?.[0]).toEqual({
      'id': 'TestModel',
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
    }

    const optionsWithHiddenModels = {
      'x-scalar-reference-config': {
        ...mockOptions['x-scalar-reference-config'],
        features: {
          showModels: false,
        },
      },
    }

    const result = traverseDocument(doc, optionsWithHiddenModels)
    expect(result.entries).toHaveLength(0)
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
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(2) // Two tag groups
    expect(result.entries).toEqual([
      {
        'description': 'Tag 1',
        'id': 'tag1',
        'isGroup': false,
        'name': 'tag1',
        'title': 'tag1',
        'type': 'tag',
        xKeys: {},
        'children': [
          {
            'id': 'Test Operation 1',
            'method': 'get',
            'path': '/test1',
            'ref': '#/paths/~1test1/get',
            'title': 'Test Operation 1',
            'type': 'operation',
          },
        ],
      },
      {
        'description': 'Tag 2',
        'id': 'tag2',
        'isGroup': false,
        'name': 'tag2',
        'title': 'tag2',
        'type': 'tag',
        xKeys: {},
        'children': [
          {
            'id': 'Test Operation 2',
            'method': 'post',
            'path': '/test2',
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
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1) // One tag group for untagged operations
    expect(result.entries).toEqual([
      {
        'id': 'Untagged Operation',
        'isDeprecated': undefined,
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
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries[0]?.title).toBe('a-tag')
    expect(result.entries[1]?.title).toBe('z-tag')
  })
})
