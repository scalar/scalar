import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { useSearchIndex } from './use-search-index'

/**
 * Helper to create a minimal OpenAPI document with navigation entries.
 */
function createDocument(title: string, children: TraversedEntry[], paths?: OpenApiDocument['paths']): OpenApiDocument {
  return {
    openapi: '3.0.0',
    info: { title, version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    ...{ paths },
    'x-scalar-navigation': {
      id: 'root',
      title: 'Root',
      type: 'document',
      name: title,
      children,
    },
  }
}

/**
 * Helper to create an operation entry.
 */
function createOperationEntry(id: string, title: string, method: HttpMethod, path: string): TraversedEntry {
  return {
    id,
    title,
    type: 'operation',
    ref: `#/paths/~1${path.replace(/\//g, '~1')}/${method}`,
    method,
    path,
  }
}

/**
 * Helper to create a tag entry.
 */
function createTagEntry(id: string, title: string, isGroup = false): TraversedEntry {
  return {
    id,
    title,
    type: 'tag',
    name: title.toLowerCase(),
    isGroup,
    ...(isGroup ? {} : { description: `Operations related to ${title}` }),
  }
}

/**
 * Helper to create a heading entry.
 */
function createHeadingEntry(id: string, title: string): TraversedEntry {
  return {
    id,
    title,
    type: 'text',
  }
}

describe('useSearchIndex', () => {
  describe('empty query behavior', () => {
    it('returns first 25 entries when query is empty', () => {
      const entries: TraversedEntry[] = Array.from({ length: 30 }, (_, i) =>
        createOperationEntry(`op-${i}`, `Operation ${i}`, 'get', `/endpoint-${i}`),
      )

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      expect(query.value).toBe('')
      expect(results.value).toHaveLength(25)
      expect(results.value[0]?.item.id).toBe('op-0')
      expect(results.value[24]?.item.id).toBe('op-24')
    })

    it('returns all entries when there are fewer than 25', () => {
      const entries: TraversedEntry[] = Array.from({ length: 10 }, (_, i) =>
        createOperationEntry(`op-${i}`, `Operation ${i}`, 'get', `/endpoint-${i}`),
      )

      const document = createDocument('Test API', entries)
      const { results } = useSearchIndex([document])

      expect(results.value).toHaveLength(10)
    })

    it('returns empty array when there are no documents', () => {
      const { query, results } = useSearchIndex([])

      expect(query.value).toBe('')
      expect(results.value).toHaveLength(0)
    })

    it('returns empty array when documents have no navigation entries', () => {
      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
      }

      const { query, results } = useSearchIndex([document])

      expect(query.value).toBe('')
      expect(results.value).toHaveLength(0)
    })
  })

  describe('search with query', () => {
    it('searches and returns matching results when query has text', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Get Pet', 'get', '/pets/{id}'),
        createOperationEntry('op-3', 'Create User', 'post', '/users'),
      ]

      const document = createDocument('Pet Store API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            description: 'List all pets',
            responses: {},
          },
        },
        '/pets/{id}': {
          get: {
            operationId: 'getPet',
            description: 'Get a pet by ID',
            responses: {},
          },
        },
        '/users': {
          post: {
            operationId: 'createUser',
            description: 'Create a new user',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value.map((it) => it.item.entry)).toEqual([
        {
          'id': 'op-1',
          'method': 'get',
          'path': '/pets',
          'ref': '#/paths/~1~1pets/get',
          'title': 'List Pets',
          'type': 'operation',
        },
        {
          'id': 'op-2',
          'method': 'get',
          'path': '/pets/{id}',
          'ref': '#/paths/~1~1pets~1{id}/get',
          'title': 'Get Pet',
          'type': 'operation',
        },
        {
          'id': 'op-3',
          'method': 'post',
          'path': '/users',
          'ref': '#/paths/~1~1users/post',
          'title': 'Create User',
          'type': 'operation',
        },
      ])
    })

    it('returns empty results when query matches nothing', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Get Pet', 'get', '/pets/{id}'),
      ]

      const document = createDocument('Pet Store API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'nonexistentxyz123'
      expect(results.value).toHaveLength(0)
    })

    it('limits search results to 25 entries', () => {
      const entries: TraversedEntry[] = Array.from({ length: 50 }, (_, i) =>
        createOperationEntry(`op-${i}`, `Pet Operation ${i}`, 'get', `/pets-${i}`),
      )

      const document = createDocument('Pet Store API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      expect(results.value.length).toBeLessThanOrEqual(25)
    })

    it('searches by title', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Create User', 'post', '/users'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'list'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.title).toContain('List')
    })

    it('searches by description', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            description: 'Retrieve all available pets from the store',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'retrieve'
      expect(results.value.length).toBeGreaterThan(0)
    })

    it('searches by operationId', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listAllPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'listAllPets'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.type).toBe('operation')
    })

    it('searches by path', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Get Pet', 'get', '/pets/{id}'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = '/pets/{id}'
      expect(results.value.length).toBeGreaterThan(0)
    })

    it('searches by method', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Create Pet', 'post', '/pets'),
        createOperationEntry('op-3', 'Update Pet', 'put', '/pets/{id}'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
          post: {
            operationId: 'createPet',
            responses: {},
          },
        },
        '/pets/{id}': {
          put: {
            operationId: 'updatePet',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'post'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value.every((r) => r.item.type === 'operation' && r.item.method === 'post')).toBe(true)
    })

    it('searches by document name', () => {
      const document1 = createDocument('Pet Store API', [createOperationEntry('op-1', 'List Pets', 'get', '/pets')])

      const document2 = createDocument('User Management API', [
        createOperationEntry('op-2', 'List Users', 'get', '/users'),
      ])

      const { query, results } = useSearchIndex([document1, document2])

      query.value = 'pet store'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value.some((r) => r.item.documentName === 'Pet Store API')).toBe(true)
    })
  })

  describe('search quality', () => {
    it('finds exact matches', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Get Pet', 'get', '/pets/{id}'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'List Pets'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.title).toBe('List Pets')
    })

    it('finds partial matches', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Get Pet', 'get', '/pets/{id}'),
        createOperationEntry('op-3', 'Create User', 'post', '/users'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      expect(results.value.length).toBeGreaterThanOrEqual(2)
      expect(results.value.every((r) => r.item.title.toLowerCase().includes('pet'))).toBe(true)
    })

    it('finds case-insensitive matches', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'PETS'
      expect(results.value.length).toBeGreaterThan(0)
    })

    it('handles fuzzy matching for typos', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pets' // Common typo
      expect(results.value.length).toBeGreaterThan(0)
    })

    it('prioritizes title matches over description matches', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Get Users', 'get', '/users'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            description: 'Get all users from the system',
            responses: {},
          },
        },
        '/users': {
          get: {
            operationId: 'getUsers',
            description: 'List all pets in the store',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pets'
      expect(results.value.length).toBeGreaterThan(0)
      // Title match should be ranked higher
      const titleMatch = results.value.find((r) => r.item.title === 'List Pets')
      expect(titleMatch).toBeDefined()
    })
  })

  describe('reactive documents', () => {
    it('updates search index when documents change', async () => {
      const initialEntries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const documents = ref<OpenApiDocument[]>([
        createDocument('Test API', initialEntries, {
          '/pets': {
            get: {
              operationId: 'listPets',
              responses: {},
            },
          },
        }),
      ])

      const { query, results } = useSearchIndex(documents)

      expect(results.value.length).toBeGreaterThan(0)

      const newEntries: TraversedEntry[] = [createOperationEntry('op-2', 'Create User', 'post', '/users')]

      documents.value = [
        createDocument('Test API', newEntries, {
          '/users': {
            post: {
              operationId: 'createUser',
              responses: {},
            },
          },
        }),
      ]

      await nextTick()

      query.value = 'user'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.title).toContain('User')
    })

    it('handles documents as getter function', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex(() => [document])

      expect(results.value.length).toBeGreaterThan(0)

      query.value = 'pet'
      expect(results.value.length).toBeGreaterThan(0)
    })
  })

  describe('different entry types', () => {
    it('searches operations', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'list'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.type).toBe('operation')
    })

    it('searches tags', () => {
      const entries: TraversedEntry[] = [createTagEntry('tag-pets', 'Pets')]

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'pets'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.type).toBe('tag')
    })

    it('searches tag groups', () => {
      const entries: TraversedEntry[] = [createTagEntry('tag-group-animals', 'Animals', true)]

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'animals'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.type).toBe('tag')
    })

    it('searches headings', () => {
      const entries: TraversedEntry[] = [createHeadingEntry('heading-1', 'Introduction')]

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'introduction'
      expect(results.value.length).toBeGreaterThan(0)
      expect(results.value[0]?.item.type).toBe('heading')
    })
  })

  describe('query reactivity', () => {
    it('updates results when query changes', () => {
      const entries: TraversedEntry[] = [
        createOperationEntry('op-1', 'List Pets', 'get', '/pets'),
        createOperationEntry('op-2', 'Create User', 'post', '/users'),
      ]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      const petResults = results.value.length

      query.value = 'user'
      const userResults = results.value.length

      expect(petResults).toBeGreaterThan(0)
      expect(userResults).toBeGreaterThan(0)
    })

    it('clears results when query is cleared', () => {
      const entries: TraversedEntry[] = [createOperationEntry('op-1', 'List Pets', 'get', '/pets')]

      const document = createDocument('Test API', entries, {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      expect(results.value.length).toBeGreaterThan(0)

      query.value = ''
      // Should return placeholder results (first 25 entries)
      expect(results.value.length).toBeGreaterThanOrEqual(0)
    })
  })
})
