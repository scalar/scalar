import { describe, expect, it } from 'vitest'

import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

import { traversePaths } from './traverse-paths'

describe('traversePaths', () => {
  // Mock getOperationId function
  const mockGetOperationId: TraverseSpecOptions['getOperationId'] = ({ path, method }) =>
    `${method.toUpperCase()}-${path}`

  // Helper to create a basic OpenAPI document
  const createBasicSpec = (): OpenApiDocument => ({
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
  })

  it('should handle empty paths', () => {
    const spec = createBasicSpec()
    const tagsMap: TagsMap = new Map()
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)
    expect(tagsMap.size).toBe(0)
  })

  it('should correctly process operations with tags', () => {
    const spec = createBasicSpec()
    spec.paths = {
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
      ['Users', { tag: { name: 'Users', description: 'User operations' }, entries: [] }],
    ])

    const titlesMap = new Map<string, string>()
    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)

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
    const spec = createBasicSpec()
    spec.paths = {
      '/health': {
        get: {
          summary: 'Health check',
          operationId: 'healthCheck',
        },
      },
    }

    const tagsMap: TagsMap = new Map()
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)

    expect(tagsMap.size).toBe(1)
    expect(tagsMap.get('default')?.entries.length).toBe(1)
    expect(tagsMap.get('default')?.entries[0]).toMatchObject({
      title: 'Health check',
      path: '/health',
      method: 'get',
    })
  })

  it('should handle operations with tags', () => {
    const spec = createBasicSpec()
    spec.tags = [
      {
        name: 'Foobar',
        description: 'Foobar',
      },
    ]
    spec.paths = {
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

    const tagsMap: TagsMap = new Map([['Foobar', { tag: { name: 'Foobar' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)
    expect(tagsMap.get('Foobar')?.entries.length).toBe(1)
    expect(tagsMap.get('Foobar')?.entries[0]?.title).toBe('Get Hello World')
    expect(tagsMap.get('default')?.entries.length).toBe(1)
    expect(tagsMap.get('default')?.entries[0]?.title).toBe('Post Hello World')
  })

  it('should handle deprecated operations', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/old-endpoint': {
        get: {
          tags: ['Legacy'],
          summary: 'Old endpoint',
          deprecated: true,
        },
      },
    }

    const tagsMap: TagsMap = new Map([['Legacy', { tag: { name: 'Legacy' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)

    expect(tagsMap.get('Legacy')?.entries).toEqual([
      {
        id: 'GET-/old-endpoint',
        method: 'get',
        path: '/old-endpoint',
        ref: '#/paths/~1old-endpoint/get',
        title: 'Old endpoint',
        type: 'operation',
      },
    ])
  })

  it('should skip internal operations', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/internal': {
        get: {
          tags: ['Internal'],
          summary: 'Internal endpoint',
          operationId: 'internalEndpoint',
          'x-internal': true,
        },
      },
    }

    const tagsMap: TagsMap = new Map([['Internal', { tag: { name: 'Internal' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)
    expect(tagsMap.get('Internal')?.entries).toEqual([])
  })

  it('should skip scalar-ignore operations', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/ignored': {
        get: {
          tags: ['Ignored'],
          summary: 'Ignored endpoint',
          operationId: 'ignoredEndpoint',
          'x-scalar-ignore': true,
        },
      },
    }

    const tagsMap: TagsMap = new Map([['Ignored', { tag: { name: 'Ignored' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)
    expect(tagsMap.get('Ignored')?.entries).toEqual([])
  })

  it('should handle operations with missing summary', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/no-summary': {
        get: {
          tags: ['Misc'],
          operationId: 'noSummary',
        },
      },
    }

    const tagsMap: TagsMap = new Map([['Misc', { tag: { name: 'Misc' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)
    expect(tagsMap.get('Misc')?.entries[0]?.title).toBe('/no-summary')
  })

  it('should populate titlesMap correctly', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/test': {
        get: {
          tags: ['Test'],
          summary: 'Test endpoint',
          operationId: 'testEndpoint',
        },
      },
    }

    const tagsMap: TagsMap = new Map([['Test', { tag: { name: 'Test' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)

    expect(titlesMap.get('GET-/test')).toBe('Test endpoint')
  })

  it('should use the path when the summary is empty', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/test': {
        get: {
          tags: ['Test'],
          summary: '',
          operationId: 'testEndpoint',
        },
      },
    }

    const tagsMap: TagsMap = new Map([['Test', { tag: { name: 'Test' }, entries: [] }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsMap, titlesMap, mockGetOperationId)

    expect(titlesMap.get('GET-/test')).toBe('/test')
  })
})
