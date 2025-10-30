import { describe, expect, it } from 'vitest'

import type { TagsMap } from '@/navigation/types'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

import { traversePaths } from './traverse-paths'

describe('traversePaths', () => {
  // Helper to create a basic OpenAPI document
  const createDocument = (): OpenApiDocument => ({
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
    'x-scalar-original-document-hash': '',
  })

  it('should handle empty paths', () => {
    const document = createDocument()
    const tagsMap: TagsMap = new Map()

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.size).toBe(0)
  })

  it('should correctly process operations with tags', () => {
    const document = createDocument()
    document.paths = {
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get users',
          operationId: 'getUsers',
        },
        post: {
          tags: ['Users'],
          summary: 'Create user',
          operationId: 'createUser',
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      [
        'Users',
        { id: 'tag/users', parentId: 'doc-1', tag: { name: 'Users', description: 'User operations' }, entries: [] },
      ],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })

    expect(tagsMap.size).toBe(1)
    expect(tagsMap.get('Users')?.entries.length).toBe(2)

    const usersEntries = tagsMap.get('Users')?.entries || []
    expect(usersEntries[0]).toMatchObject({
      title: 'Get users',
      path: '/users',
      method: 'get',
    })
  })

  it('should handle operations without tags', () => {
    const document = createDocument()
    document.paths = {
      '/health': {
        get: {
          summary: 'Health check',
          operationId: 'healthCheck',
        },
      },
    }

    const tagsMap: TagsMap = new Map()

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })

    expect(tagsMap.size).toBe(1)
    expect(tagsMap.get('default')?.entries.length).toBe(1)
    expect(tagsMap.get('default')?.entries[0]).toMatchObject({
      title: 'Health check',
      path: '/health',
      method: 'get',
    })
  })

  it('should handle operations with tags', () => {
    const document = createDocument()
    document.tags = [
      {
        name: 'Foobar',
        description: 'Foobar',
      },
    ]
    document.paths = {
      '/hello': {
        get: {
          summary: 'Get Hello World',
          tags: ['Foobar'],
        },
        post: {
          summary: 'Post Hello World',
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Foobar', { id: 'tag/foobar', parentId: 'doc-1', tag: { name: 'Foobar' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.get('Foobar')?.entries.length).toBe(1)
    expect(tagsMap.get('Foobar')?.entries[0]?.title).toBe('Get Hello World')
    expect(tagsMap.get('default')?.entries.length).toBe(1)
    expect(tagsMap.get('default')?.entries[0]?.title).toBe('Post Hello World')
  })

  it('should handle deprecated operations', () => {
    const document = createDocument()
    document.paths = {
      '/old-endpoint': {
        get: {
          tags: ['Legacy'],
          summary: 'Old endpoint',
          deprecated: true,
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Legacy', { id: 'tag/legacy', parentId: 'doc-1', tag: { name: 'Legacy' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })

    expect(tagsMap.get('Legacy')?.entries).toEqual([
      {
        id: 'GET-/old-endpoint',
        method: 'get',
        'isDeprecated': true,
        path: '/old-endpoint',
        ref: '#/paths/~1old-endpoint/get',
        title: 'Old endpoint',
        type: 'operation',
      },
    ])
  })

  it('should skip internal operations', () => {
    const document = createDocument()
    document.paths = {
      '/internal': {
        get: {
          tags: ['Internal'],
          summary: 'Internal endpoint',
          operationId: 'internalEndpoint',
          'x-internal': true,
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Internal', { id: 'tag/internal', parentId: 'doc-1', tag: { name: 'Internal' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.get('Internal')?.entries).toEqual([])
  })

  it('should skip scalar-ignore operations', () => {
    const document = createDocument()
    document.paths = {
      '/ignored': {
        get: {
          tags: ['Ignored'],
          summary: 'Ignored endpoint',
          operationId: 'ignoredEndpoint',
          'x-scalar-ignore': true,
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Ignored', { id: 'tag/ignored', parentId: 'doc-1', tag: { name: 'Ignored' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.get('Ignored')?.entries).toEqual([])
  })

  it('should handle operations with missing summary', () => {
    const document = createDocument()
    document.paths = {
      '/no-summary': {
        get: {
          tags: ['Misc'],
          operationId: 'noSummary',
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Misc', { id: 'tag/misc', parentId: 'doc-1', tag: { name: 'Misc' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.get('Misc')?.entries[0]?.title).toBe('/no-summary')
  })

  it('should populate titlesMap correctly', () => {
    const document = createDocument()
    document.paths = {
      '/test': {
        get: {
          tags: ['Test'],
          summary: 'Test endpoint',
          operationId: 'testEndpoint',
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Test', { id: 'tag/test', parentId: 'doc-1', tag: { name: 'Test' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.get('Test')?.entries[0]?.title).toBe('Test endpoint')
  })

  it('should use the path when the summary is empty', () => {
    const document = createDocument()
    document.paths = {
      '/test': {
        get: {
          tags: ['Test'],
          summary: '',
          operationId: 'testEndpoint',
        },
      },
    }

    const tagsMap: TagsMap = new Map([
      ['Test', { id: 'tag/test', parentId: 'doc-1', tag: { name: 'Test' }, entries: [] }],
    ])

    traversePaths({
      document,
      tagsMap,
      documentId: 'doc-1',
      generateId: (props) => {
        if (props.type === 'operation') {
          return `${props.method?.toUpperCase()}-${props.path}`
        }
        return 'unknown-id'
      },
    })
    expect(tagsMap.get('Test')?.entries[0]?.title).toBe('/test')
  })
})
