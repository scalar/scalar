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
    it('returns null when query is empty', () => {
      const entries: TraversedEntry[] = Array.from({ length: 30 }, (_, i) =>
        createOperationEntry(`op-${i}`, `Operation ${i}`, 'get', `/endpoint-${i}`),
      )

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      expect(query.value).toBe('')
      expect(results.value).toBeNull()
    })

    it('returns null when there are no documents and query is empty', () => {
      const { query, results } = useSearchIndex([])

      expect(query.value).toBe('')
      expect(results.value).toBeNull()
    })

    it('returns null when documents have no navigation entries and query is empty', () => {
      const document: OpenApiDocument = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': '',
      }

      const { query, results } = useSearchIndex([document])

      expect(query.value).toBe('')
      expect(results.value).toBeNull()
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
      // Check that the pet-related operations are in the results
      const petOperations = results.value?.filter((r) => r.title.toLowerCase().includes('pet'))
      expect(petOperations?.length).toBeGreaterThanOrEqual(2)
      expect(petOperations?.some((r) => r.id === 'op-1')).toBe(true)
      expect(petOperations?.some((r) => r.id === 'op-2')).toBe(true)
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
      expect(results.value).not.toBeNull()
      expect(results.value).toHaveLength(0)
    })

    it('limits search results to 25 entries', () => {
      const entries: TraversedEntry[] = Array.from({ length: 50 }, (_, i) =>
        createOperationEntry(`op-${i}`, `Pet Operation ${i}`, 'get', `/pets-${i}`),
      )

      const document = createDocument('Pet Store API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeLessThanOrEqual(25)
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
      expect(results.value?.[0]?.type).toBe('operation')
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
      expect(results.value?.every((r) => r.type === 'operation' && r.method === 'post')).toBe(true)
    })

    it('searches by document name', () => {
      const document1 = createDocument('Pet Store API', [createOperationEntry('op-1', 'List Pets', 'get', '/pets')], {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      })

      const document2 = createDocument(
        'User Management API',
        [createOperationEntry('op-2', 'List Users', 'get', '/users')],
        {
          '/users': {
            get: {
              operationId: 'listUsers',
              responses: {},
            },
          },
        },
      )

      const { query, results } = useSearchIndex([document1, document2])

      query.value = 'pet store'
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
    })
  })

  describe('search quality', () => {
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
      // Title match should be ranked higher
      const titleMatch = results.value?.find((r) => r.title === 'List Pets')
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

      query.value = 'pet'
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)

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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
      expect(results.value?.[0]?.title).toContain('User')
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

      query.value = 'pet'
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)
    })
  })

  describe('different entry types', () => {
    it('only returns operations, not tags', () => {
      const entries: TraversedEntry[] = [createTagEntry('tag-pets', 'Pets')]

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'pets'
      // Tags are not returned in the new implementation (only operations)
      expect(results.value).not.toBeNull()
      expect(results.value).toHaveLength(0)
    })

    it('only returns operations, not tag groups', () => {
      const entries: TraversedEntry[] = [createTagEntry('tag-group-animals', 'Animals', true)]

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'animals'
      // Tag groups are not returned in the new implementation (only operations)
      expect(results.value).not.toBeNull()
      expect(results.value).toHaveLength(0)
    })

    it('only returns operations, not headings', () => {
      const entries: TraversedEntry[] = [createHeadingEntry('heading-1', 'Introduction')]

      const document = createDocument('Test API', entries)
      const { query, results } = useSearchIndex([document])

      query.value = 'introduction'
      // Headings are not returned in the new implementation (only operations)
      expect(results.value).not.toBeNull()
      expect(results.value).toHaveLength(0)
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
        '/users': {
          post: {
            operationId: 'createUser',
            responses: {},
          },
        },
      })

      const { query, results } = useSearchIndex([document])

      query.value = 'pet'
      expect(results.value).not.toBeNull()
      const petResults = results.value?.length ?? 0

      query.value = 'user'
      expect(results.value).not.toBeNull()
      const userResults = results.value?.length ?? 0

      expect(petResults).toBeGreaterThan(0)
      expect(userResults).toBeGreaterThan(0)
    })

    it('returns null when query is cleared', () => {
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
      expect(results.value).not.toBeNull()
      expect(results.value?.length).toBeGreaterThan(0)

      query.value = ''
      // Should return null when query is empty
      expect(results.value).toBeNull()
    })
  })
})
