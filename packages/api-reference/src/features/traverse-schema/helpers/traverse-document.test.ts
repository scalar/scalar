import { describe, expect, it } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { traverseDocument } from './traverse-document'
import type { TraversedTag, TraverseSpecOptions } from '@/features/traverse-schema/types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { ref } from 'vue'

describe('traverseDocument', () => {
  const mockConfig = ref<ApiReferenceConfiguration>({
    hideModels: false,
    hideClientButton: false,
    showSidebar: true,
    theme: 'default',
    persistAuth: false,
    layout: 'modern',
    isEditable: false,
    isLoading: false,
    hideDownloadButton: false,
    hideTestRequestButton: false,
    hideSearch: false,
    hideDarkModeToggle: false,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    withDefaultFonts: true,
    defaultOpenAllTags: false,
  })

  const mockOptions: TraverseSpecOptions = {
    config: mockConfig,
    getSectionId: () => 'section-1',
    getHeadingId: (heading) => heading.value,
    getOperationId: (operation) => operation.summary ?? '',
    getWebhookId: (webhook) => webhook?.name ?? 'webhooks',
    getModelId: (model) => model?.name ?? '',
    getTagId: (tag) => tag.name ?? '',
  }

  it('should handle empty document', () => {
    const emptyDoc: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    }

    const result = traverseDocument(emptyDoc, mockOptions)
    expect(result.entries).toHaveLength(0)
    expect(result.titles).toBeInstanceOf(Map)
    expect(result.titles.size).toBe(0)
  })

  it('should traverse document with description', () => {
    const doc: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: '# Test Description\n## Section 1\nContent',
      },
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1)
    expect(result.titles.get('Test Description')).toBe('Test Description')
  })

  it('should handle paths and operations', () => {
    const doc: OpenAPIV3_1.Document = {
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
    expect(result.titles.get('Test Operation')).toBe('Test Operation')
  })

  it('should handle webhooks', () => {
    const doc: OpenAPIV3_1.Document = {
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
    expect(result.titles.get('test-webhook')).toBe('Test Webhook')
    expect((result.entries[0] as TraversedTag).children).toHaveLength(1)
    expect((result.entries[0] as TraversedTag).children?.[0].title).toBe('Test Webhook')
  })

  it('should handle schemas when not hidden', () => {
    const doc: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          TestModel: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const result = traverseDocument(doc, mockOptions)
    expect(result.entries).toHaveLength(1) // Models section
    expect(result.titles.get('TestModel')).toBe('TestModel')
  })

  it('should not include schemas when hidden', () => {
    const doc: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          TestModel: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const optionsWithHiddenModels = {
      ...mockOptions,
      config: ref<ApiReferenceConfiguration>({
        ...mockConfig.value,
        hideModels: true,
      }),
    }

    const result = traverseDocument(doc, optionsWithHiddenModels)
    expect(result.entries).toHaveLength(0)
  })

  it('should handle multiple tags and operations', () => {
    const doc: OpenAPIV3_1.Document = {
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
    expect(result.titles.get('Test Operation 1')).toBe('Test Operation 1')
    expect(result.titles.get('Test Operation 2')).toBe('Test Operation 2')
  })

  it('should handle operations without tags', () => {
    const doc: OpenAPIV3_1.Document = {
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
    expect(result.titles.get('Untagged Operation')).toBe('Untagged Operation')
  })

  it('should respect tag sorting configuration', () => {
    const doc: OpenAPIV3_1.Document = {
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
    expect(result.entries[0].title).toBe('a-tag')
    expect(result.entries[1].title).toBe('z-tag')
  })
})
