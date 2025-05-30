import { describe, it, expect } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { traversePaths } from './traverse-paths'
import type { UseNavState } from '@/hooks/useNavState'

describe('traversePaths', () => {
  // Mock getOperationId function
  const mockGetOperationId: UseNavState['getOperationId'] = ({ path, method }) => `${method.toUpperCase()}-${path}`

  // Helper to create a basic OpenAPI document
  const createBasicSpec = (): OpenAPIV3_1.Document => ({
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
  })

  it('should handle empty paths', () => {
    const spec = createBasicSpec()
    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)

    expect(result.size).toBe(1) // Only default tag
    expect(result.get('default')).toEqual([])
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

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>([
      ['Users', { name: 'Users', description: 'User operations' }],
    ])
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)

    expect(result.size).toBe(2) // Users tag + default tag
    expect(result.get('Users')?.length).toBe(2)
    expect(result.get('default')?.length).toBe(0)

    const usersEntries = result.get('Users') || []
    expect(usersEntries[0]).toMatchObject({
      title: 'Get users',
      path: '/users',
      httpVerb: 'get',
      operationId: 'getUsers',
      deprecated: false,
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

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)

    expect(result.size).toBe(1)
    expect(result.get('default')?.length).toBe(1)
    expect(result.get('default')?.[0]).toMatchObject({
      title: 'Health check',
      path: '/health',
      httpVerb: 'get',
      operationId: 'healthCheck',
    })
  })

  it('should handle deprecated operations', () => {
    const spec = createBasicSpec()
    spec.paths = {
      '/old-endpoint': {
        get: {
          tags: ['Legacy'],
          summary: 'Old endpoint',
          operationId: 'oldEndpoint',
          deprecated: true,
        },
      },
    }

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>([['Legacy', { name: 'Legacy' }]])
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)

    expect(result.get('Legacy')?.[0].deprecated).toBe(true)
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

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>([['Internal', { name: 'Internal' }]])
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)
    expect(result.get('Internal')).toBeUndefined()
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

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>([['Ignored', { name: 'Ignored' }]])
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)
    expect(result.get('Ignored')).toBeUndefined()
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

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>([['Misc', { name: 'Misc' }]])
    const titlesMap = new Map<string, string>()

    const result = traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)

    expect(result.get('Misc')?.[0].title).toBe('/no-summary')
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

    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>([['Test', { name: 'Test' }]])
    const titlesMap = new Map<string, string>()

    traversePaths(spec, tagsDict, titlesMap, mockGetOperationId)

    expect(titlesMap.get('GET-/test')).toBe('Test endpoint')
  })
})
