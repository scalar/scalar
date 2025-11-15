import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createSearchIndex } from './create-search-index'

describe('createSearchIndex', () => {
  it('returns empty array when documents is empty', () => {
    const result = createSearchIndex([])

    expect(result).toEqual([])
  })

  it('returns empty array when document has no navigation', () => {
    const document: OpenApiDocument = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
    }

    const result = createSearchIndex([document])

    expect(result).toEqual([])
  })

  it('returns empty array when navigation has no children', () => {
    const document: OpenApiDocument = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      'x-scalar-navigation': {
        id: 'root',
        title: 'Root',
        type: 'document',
        name: 'Test API',
        children: [],
      },
    }

    const result = createSearchIndex([document])

    expect(result).toEqual([])
  })

  describe('operations', () => {
    it('indexes operation with all fields', () => {
      const operationEntry: TraversedEntry = {
        id: 'op-1',
        title: 'List Pets',
        type: 'operation',
        ref: '#/paths/~1pets/get',
        method: 'get',
        path: '/pets',
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Pet Store API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        paths: {
          '/pets': {
            get: {
              operationId: 'listPets',
              description: 'List all pets',
              responses: {},
            },
          },
        },
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Pet Store API',
          children: [operationEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'operation',
        title: 'List Pets',
        id: 'op-1',
        description: 'List all pets',
        method: 'get',
        path: '/pets',
        operationId: 'listPets',
        entry: operationEntry,
        documentName: 'Pet Store API',
      })
    })

    it('indexes operation without description', () => {
      const operationEntry: TraversedEntry = {
        id: 'op-1',
        title: 'Get Pet',
        type: 'operation',
        ref: '#/paths/~1pets~1{id}/get',
        method: 'get',
        path: '/pets/{id}',
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Pet Store API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        paths: {
          '/pets/{id}': {
            get: {
              operationId: 'getPet',
              responses: {},
            },
          },
        },
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Pet Store API',
          children: [operationEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'operation',
        title: 'Get Pet',
        id: 'op-1',
        description: '',
        method: 'get',
        path: '/pets/{id}',
        operationId: 'getPet',
        entry: operationEntry,
        documentName: 'Pet Store API',
      })
    })

    it('indexes operation when path does not exist in document', () => {
      const operationEntry: TraversedEntry = {
        id: 'op-1',
        title: 'Missing Operation',
        type: 'operation',
        ref: '#/paths/~1missing/get',
        method: 'get',
        path: '/missing',
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Test API',
          children: [operationEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'operation',
        title: 'Missing Operation',
        id: 'op-1',
        description: '',
        method: 'get',
        path: '/missing',
        operationId: undefined,
        entry: operationEntry,
        documentName: 'Test API',
      })
    })
  })

  describe('tags', () => {
    it('indexes regular tag with description', () => {
      const tagEntry: TraversedEntry = {
        id: 'tag-pets',
        title: 'Pets',
        type: 'tag',
        name: 'pets',
        description: 'Operations related to pets',
        isGroup: false,
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Pet Store API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Pet Store API',
          children: [tagEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'tag-pets',
        title: 'Pets',
        description: 'Operations related to pets',
        type: 'tag',
        entry: tagEntry,
        documentName: 'Pet Store API',
      })
    })

    it('indexes regular tag without description', () => {
      const tagEntry: TraversedEntry = {
        id: 'tag-users',
        title: 'Users',
        type: 'tag',
        name: 'users',
        isGroup: false,
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Test API',
          children: [tagEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'tag-users',
        title: 'Users',
        description: '',
        type: 'tag',
        entry: tagEntry,
        documentName: 'Test API',
      })
    })

    it('indexes tag group', () => {
      const tagGroupEntry: TraversedEntry = {
        id: 'tag-group-animals',
        title: 'Animals',
        type: 'tag',
        name: 'animals',
        isGroup: true,
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Pet Store API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Pet Store API',
          children: [tagGroupEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'tag-group-animals',
        title: 'Animals',
        description: 'Tag Group',
        type: 'tag',
        entry: tagGroupEntry,
        documentName: 'Pet Store API',
      })
    })
  })

  describe('headings', () => {
    it('indexes text entry as heading', () => {
      const textEntry: TraversedEntry = {
        id: 'heading-1',
        title: 'Introduction',
        type: 'text',
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Test API',
          children: [textEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'heading-1',
        type: 'heading',
        title: 'Introduction',
        description: 'Heading',
        entry: textEntry,
        documentName: 'Test API',
      })
    })

    it('indexes text entry without title', () => {
      const textEntry: TraversedEntry = {
        id: 'heading-2',
        title: '',
        type: 'text',
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Test API',
          children: [textEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(1)
      expect(result[0]?.title).toBe('')
    })
  })

  describe('nested entries', () => {
    it('indexes nested operations within tags', () => {
      const operationEntry: TraversedEntry = {
        id: 'op-1',
        title: 'List Pets',
        type: 'operation',
        ref: '#/paths/~1pets/get',
        method: 'get',
        path: '/pets',
      }

      const tagEntry: TraversedEntry = {
        id: 'tag-pets',
        title: 'Pets',
        type: 'tag',
        name: 'pets',
        isGroup: false,
        children: [operationEntry],
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Pet Store API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        paths: {
          '/pets': {
            get: {
              operationId: 'listPets',
              description: 'List all pets',
              responses: {},
            },
          },
        },
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Pet Store API',
          children: [tagEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(2)
      expect(result[0]?.type).toBe('tag')
      expect(result[0]?.id).toBe('tag-pets')
      expect(result[1]?.type).toBe('operation')
      expect(result[1]?.id).toBe('op-1')
    })

    it('indexes deeply nested entries', () => {
      const nestedOperation: TraversedEntry = {
        id: 'op-nested',
        title: 'Nested Operation',
        type: 'operation',
        ref: '#/paths/~1deep/get',
        method: 'get',
        path: '/deep',
      }

      const nestedTag: TraversedEntry = {
        id: 'tag-nested',
        title: 'Nested Tag',
        type: 'tag',
        name: 'nested',
        isGroup: false,
        children: [nestedOperation],
      }

      const parentTag: TraversedEntry = {
        id: 'tag-parent',
        title: 'Parent Tag',
        type: 'tag',
        name: 'parent',
        isGroup: true,
        children: [nestedTag],
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        paths: {
          '/deep': {
            get: {
              operationId: 'getDeep',
              responses: {},
            },
          },
        },
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Test API',
          children: [parentTag],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(3)
      expect(result[0]?.id).toBe('tag-parent')
      expect(result[1]?.id).toBe('tag-nested')
      expect(result[2]?.id).toBe('op-nested')
    })
  })

  describe('multiple documents', () => {
    it('indexes entries from multiple documents', () => {
      const document1: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'API 1', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root-1',
          title: 'Root',
          type: 'document',
          name: 'API 1',
          children: [
            {
              id: 'op-1',
              title: 'Operation 1',
              type: 'operation',
              ref: '#/paths/~1test/get',
              method: 'get',
              path: '/test',
            },
          ],
        },
      }

      const document2: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'API 2', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        'x-scalar-navigation': {
          id: 'root-2',
          title: 'Root',
          type: 'document',
          name: 'API 2',
          children: [
            {
              id: 'tag-1',
              title: 'Tag 1',
              type: 'tag',
              name: 'tag1',
              isGroup: false,
            },
          ],
        },
      }

      const result = createSearchIndex([document1, document2])

      expect(result).toHaveLength(2)
      expect(result[0]?.documentName).toBe('API 1')
      expect(result[0]?.type).toBe('operation')
      expect(result[1]?.documentName).toBe('API 2')
      expect(result[1]?.type).toBe('tag')
    })
  })

  describe('mixed entry types', () => {
    it('indexes all entry types in correct order', () => {
      const operationEntry: TraversedEntry = {
        id: 'op-1',
        title: 'Get Pet',
        type: 'operation',
        ref: '#/paths/~1pets~1{id}/get',
        method: 'get',
        path: '/pets/{id}',
      }

      const tagEntry: TraversedEntry = {
        id: 'tag-pets',
        title: 'Pets',
        type: 'tag',
        name: 'pets',
        isGroup: false,
      }

      const tagGroupEntry: TraversedEntry = {
        id: 'tag-group-animals',
        title: 'Animals',
        type: 'tag',
        name: 'animals',
        isGroup: true,
      }

      const headingEntry: TraversedEntry = {
        id: 'heading-1',
        title: 'Introduction',
        type: 'text',
      }

      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Pet Store API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
        paths: {
          '/pets/{id}': {
            get: {
              operationId: 'getPet',
              description: 'Get a pet by ID',
              responses: {},
            },
          },
        },
        'x-scalar-navigation': {
          id: 'root',
          title: 'Root',
          type: 'document',
          name: 'Pet Store API',
          children: [operationEntry, tagEntry, tagGroupEntry, headingEntry],
        },
      }

      const result = createSearchIndex([document])

      expect(result).toHaveLength(4)
      expect(result[0]?.type).toBe('operation')
      expect(result[1]?.type).toBe('tag')
      expect(result[2]?.type).toBe('tag')
      expect(result[3]?.type).toBe('heading')
    })
  })
})
