import { describe, expect, it, vi } from 'vitest'

import type { DocumentHistory, HistoryEntry } from '@/entities/history/schema'

import { createHistoryStore } from './index'

/**
 * Helper function to create a minimal HistoryEntry for testing.
 */
const createHistoryEntry = (overrides?: Partial<HistoryEntry>): HistoryEntry => ({
  time: 100,
  timestamp: Date.now(),
  request: {
    url: 'https://api.example.com/pets',
    method: 'GET',
    httpVersion: 'HTTP/1.1',
    headers: [],
    cookies: [],
    headersSize: -1,
    queryString: [],
    bodySize: -1,
  },
  response: {
    status: 200,
    statusText: 'OK',
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headers: [],
    content: {
      size: 100,
      mimeType: 'application/json',
    },
    redirectURL: '',
    headersSize: -1,
    bodySize: 100,
  },
  meta: {
    example: 'default',
  },
  requestMetadata: {
    variables: {},
  },
  ...overrides,
})

describe('createHistoryStore', () => {
  describe('getHistory', () => {
    it('returns undefined when document does not exist', () => {
      const store = createHistoryStore({})

      const result = store.getHistory('nonExistent', '/pets', 'get')

      expect(result).toBeUndefined()
    })

    it('returns undefined when path does not exist', () => {
      const store = createHistoryStore({})
      store.addHistory('doc1', '/users', 'get', createHistoryEntry())

      const result = store.getHistory('doc1', '/pets', 'get')

      expect(result).toBeUndefined()
    })

    it('returns undefined when method does not exist', () => {
      const store = createHistoryStore({})
      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())

      const result = store.getHistory('doc1', '/pets', 'post')

      expect(result).toBeUndefined()
    })

    it('returns history entries for a valid operation', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry()

      store.addHistory('doc1', '/pets', 'get', entry)

      const result = store.getHistory('doc1', '/pets', 'get')

      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        time: entry.time,
        timestamp: entry.timestamp,
      })
    })

    it('returns all entries for an operation', () => {
      const store = createHistoryStore({})
      const entry1 = createHistoryEntry({ timestamp: 1000 })
      const entry2 = createHistoryEntry({ timestamp: 2000 })
      const entry3 = createHistoryEntry({ timestamp: 3000 })

      store.addHistory('doc1', '/pets', 'get', entry1)
      store.addHistory('doc1', '/pets', 'get', entry2)
      store.addHistory('doc1', '/pets', 'get', entry3)

      const result = store.getHistory('doc1', '/pets', 'get')

      expect(result).toHaveLength(3)
      expect(result?.[0]?.timestamp).toBe(1000)
      expect(result?.[1]?.timestamp).toBe(2000)
      expect(result?.[2]?.timestamp).toBe(3000)
    })
  })

  describe('addHistory', () => {
    it('adds a history entry for a new operation', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry()

      store.addHistory('doc1', '/pets', 'get', entry)

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toHaveLength(1)
    })

    it('creates nested structure when adding to new document', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry()

      store.addHistory('newDoc', '/pets', 'get', entry)

      const exported = store.export()
      expect(exported.newDoc).toBeDefined()
      expect(exported.newDoc?.['/pets']).toBeDefined()
      expect(exported.newDoc?.['/pets']?.['get']).toBeDefined()
    })

    it('appends to existing history entries', () => {
      const store = createHistoryStore({})
      const entry1 = createHistoryEntry({ timestamp: 1000 })
      const entry2 = createHistoryEntry({ timestamp: 2000 })

      store.addHistory('doc1', '/pets', 'get', entry1)
      store.addHistory('doc1', '/pets', 'get', entry2)

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toHaveLength(2)
    })

    it('limits history to 5 entries', () => {
      const store = createHistoryStore({})

      for (let i = 1; i <= 7; i++) {
        store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: i }))
      }

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toHaveLength(5)
    })

    it('removes oldest entry when exceeding limit', () => {
      const store = createHistoryStore({})

      for (let i = 1; i <= 7; i++) {
        store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: i }))
      }

      const result = store.getHistory('doc1', '/pets', 'get')
      // The oldest entries (1 and 2) should be removed
      expect(result?.[0]?.timestamp).toBe(3)
      expect(result?.[4]?.timestamp).toBe(7)
    })

    it('handles different methods on the same path', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry({ timestamp: 2 }))

      const getHistory = store.getHistory('doc1', '/pets', 'get')
      const postHistory = store.getHistory('doc1', '/pets', 'post')

      expect(getHistory).toHaveLength(1)
      expect(postHistory).toHaveLength(1)
      expect(getHistory?.[0]?.timestamp).toBe(1)
      expect(postHistory?.[0]?.timestamp).toBe(2)
    })

    it('handles different paths in the same document', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc1', '/users', 'get', createHistoryEntry({ timestamp: 2 }))

      expect(store.getHistory('doc1', '/pets', 'get')).toHaveLength(1)
      expect(store.getHistory('doc1', '/users', 'get')).toHaveLength(1)
    })

    it('handles multiple documents', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc2', '/pets', 'get', createHistoryEntry({ timestamp: 2 }))

      expect(store.getHistory('doc1', '/pets', 'get')?.[0]?.timestamp).toBe(1)
      expect(store.getHistory('doc2', '/pets', 'get')?.[0]?.timestamp).toBe(2)
    })

    it('preserves entry details when adding', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry({
        time: 250,
        timestamp: 123456,
        request: {
          url: 'https://api.example.com/test',
          method: 'POST',
          httpVersion: 'HTTP/2',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          cookies: [{ name: 'session', value: 'abc123' }],
          headersSize: 200,
          queryString: [{ name: 'filter', value: 'active' }],
          bodySize: 50,
          postData: {
            mimeType: 'application/json',
            text: '{"name":"test"}',
          },
        },
        response: {
          status: 201,
          statusText: 'Created',
          httpVersion: 'HTTP/2',
          cookies: [],
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          content: {
            size: 100,
            mimeType: 'application/json',
            text: '{"id":1}',
          },
          redirectURL: '',
          headersSize: 150,
          bodySize: 100,
        },
        meta: {
          example: 'custom-example',
        },
        requestMetadata: {
          variables: { baseUrl: 'https://api.example.com', apiKey: 'secret' },
        },
      })

      store.addHistory('doc1', '/test', 'post', entry)

      const result = store.getHistory('doc1', '/test', 'post')
      expect(result?.[0]).toMatchObject({
        time: 250,
        timestamp: 123456,
        request: {
          method: 'POST',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
        },
        response: {
          status: 201,
          statusText: 'Created',
        },
        meta: {
          example: 'custom-example',
        },
        requestMetadata: {
          variables: { baseUrl: 'https://api.example.com', apiKey: 'secret' },
        },
      })
    })
  })

  describe('clearOperationHistory', () => {
    it('removes history for a specific operation', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry())

      store.clearOperationHistory('doc1', '/pets', 'get')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/pets', 'post')).toBeDefined()
    })

    it('does not affect other operations on the same path', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry({ timestamp: 2 }))
      store.addHistory('doc1', '/pets', 'put', createHistoryEntry({ timestamp: 3 }))

      store.clearOperationHistory('doc1', '/pets', 'get')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/pets', 'post')).toBeDefined()
      expect(store.getHistory('doc1', '/pets', 'put')).toBeDefined()
    })

    it('does not affect other paths in the same document', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc1', '/users', 'get', createHistoryEntry())

      store.clearOperationHistory('doc1', '/pets', 'get')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/users', 'get')).toBeDefined()
    })

    it('does not affect other documents', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc2', '/pets', 'get', createHistoryEntry())

      store.clearOperationHistory('doc1', '/pets', 'get')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc2', '/pets', 'get')).toBeDefined()
    })

    it('handles clearing non-existent operation gracefully', () => {
      const store = createHistoryStore({})

      expect(() => {
        store.clearOperationHistory('nonExistent', '/pets', 'get')
      }).not.toThrow()
    })
  })

  describe('clearPathHistory', () => {
    it('removes history for all operations on a path', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry())
      store.addHistory('doc1', '/pets', 'put', createHistoryEntry())

      store.clearPathHistory('doc1', '/pets')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/pets', 'post')).toBeUndefined()
      expect(store.getHistory('doc1', '/pets', 'put')).toBeUndefined()
    })

    it('does not affect other paths in the same document', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc1', '/users', 'get', createHistoryEntry())

      store.clearPathHistory('doc1', '/pets')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/users', 'get')).toBeDefined()
    })

    it('does not affect other documents', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc2', '/pets', 'get', createHistoryEntry())

      store.clearPathHistory('doc1', '/pets')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc2', '/pets', 'get')).toBeDefined()
    })

    it('handles clearing non-existent path gracefully', () => {
      const store = createHistoryStore({})

      expect(() => {
        store.clearPathHistory('doc1', '/nonExistent')
      }).not.toThrow()
    })
  })

  describe('clearDocumentHistory', () => {
    it('removes all history for a document', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry())
      store.addHistory('doc1', '/users', 'get', createHistoryEntry())

      store.clearDocumentHistory('doc1')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/pets', 'post')).toBeUndefined()
      expect(store.getHistory('doc1', '/users', 'get')).toBeUndefined()
    })

    it('does not affect other documents', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc2', '/pets', 'get', createHistoryEntry())

      store.clearDocumentHistory('doc1')

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc2', '/pets', 'get')).toBeDefined()
    })

    it('handles clearing non-existent document gracefully', () => {
      const store = createHistoryStore({})

      expect(() => {
        store.clearDocumentHistory('nonExistent')
      }).not.toThrow()
    })

    it('removes all nested paths and methods', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry())
      store.addHistory('doc1', '/users', 'get', createHistoryEntry())
      store.addHistory('doc1', '/users', 'post', createHistoryEntry())
      store.addHistory('doc1', '/products', 'get', createHistoryEntry())

      store.clearDocumentHistory('doc1')

      const exported = store.export()
      expect(exported.doc1).toBeUndefined()
    })
  })

  describe('load', () => {
    it('loads history data into the store', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry()
      const data: DocumentHistory = {
        doc1: {
          '/pets': {
            get: [entry],
          },
        },
      }

      store.load(data)

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        time: entry.time,
        timestamp: entry.timestamp,
      })
    })

    it('replaces existing history when loading', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))

      const newEntry = createHistoryEntry({ timestamp: 2 })
      const data: DocumentHistory = {
        doc1: {
          '/users': {
            get: [newEntry],
          },
        },
      }

      store.load(data)

      expect(store.getHistory('doc1', '/pets', 'get')).toBeUndefined()
      expect(store.getHistory('doc1', '/users', 'get')).toHaveLength(1)
    })

    it('loads multiple documents', () => {
      const store = createHistoryStore({})
      const data: DocumentHistory = {
        doc1: {
          '/pets': {
            get: [createHistoryEntry({ timestamp: 1 })],
          },
        },
        doc2: {
          '/users': {
            get: [createHistoryEntry({ timestamp: 2 })],
          },
        },
      }

      store.load(data)

      expect(store.getHistory('doc1', '/pets', 'get')).toBeDefined()
      expect(store.getHistory('doc2', '/users', 'get')).toBeDefined()
    })

    it('loads multiple entries per operation', () => {
      const store = createHistoryStore({})
      const data: DocumentHistory = {
        doc1: {
          '/pets': {
            get: [
              createHistoryEntry({ timestamp: 1 }),
              createHistoryEntry({ timestamp: 2 }),
              createHistoryEntry({ timestamp: 3 }),
            ],
          },
        },
      }

      store.load(data)

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toHaveLength(3)
    })

    it('handles empty data object', () => {
      const store = createHistoryStore({})

      store.load({})

      expect(store.export()).toEqual({})
    })

    it('coerces loaded data according to schema', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry()
      const data: DocumentHistory = {
        doc1: {
          '/pets': {
            get: [entry],
          },
        },
      }

      store.load(data)

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toBeDefined()
      expect(result?.[0]?.request).toBeDefined()
      expect(result?.[0]?.response).toBeDefined()
    })
  })

  describe('export', () => {
    it('exports an empty object when no history exists', () => {
      const store = createHistoryStore({})

      const result = store.export()

      expect(result).toEqual({})
    })

    it('exports history data as a plain object', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry({ timestamp: 1000 })

      store.addHistory('doc1', '/pets', 'get', entry)

      const result = store.export()

      expect(result.doc1).toBeDefined()
      expect(result.doc1?.['/pets']?.['get']).toHaveLength(1)
      expect(result.doc1?.['/pets']?.['get']?.[0]?.timestamp).toBe(1000)
    })

    it('exports multiple documents', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc2', '/users', 'post', createHistoryEntry())

      const result = store.export()

      expect(Object.keys(result)).toHaveLength(2)
      expect(result.doc1).toBeDefined()
      expect(result.doc2).toBeDefined()
    })

    it('exports multiple operations per document', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry({ timestamp: 2 }))
      store.addHistory('doc1', '/users', 'get', createHistoryEntry({ timestamp: 3 }))

      const result = store.export()

      expect(result.doc1?.['/pets']?.['get']).toBeDefined()
      expect(result.doc1?.['/pets']?.['post']).toBeDefined()
      expect(result.doc1?.['/users']?.['get']).toBeDefined()
    })

    it('exports all entries for an operation', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 2 }))
      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 3 }))

      const result = store.export()

      expect(result.doc1?.['/pets']?.['get']).toHaveLength(3)
    })

    it('returns a non-proxy object', () => {
      const store = createHistoryStore({})

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())

      const result = store.export()

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('exports complete entry details', () => {
      const store = createHistoryStore({})
      const entry = createHistoryEntry({
        time: 250,
        request: {
          url: 'https://api.example.com/test',
          method: 'POST',
          httpVersion: 'HTTP/2',
          headers: [{ name: 'Authorization', value: 'Bearer token' }],
          cookies: [],
          headersSize: 100,
          queryString: [],
          bodySize: 50,
        },
        response: {
          status: 201,
          statusText: 'Created',
          httpVersion: 'HTTP/2',
          cookies: [],
          headers: [],
          content: {
            size: 100,
            mimeType: 'application/json',
          },
          redirectURL: '',
          headersSize: 150,
          bodySize: 100,
        },
        meta: {
          example: 'test-example',
        },
        requestMetadata: {
          variables: { key: 'value' },
        },
      })

      store.addHistory('doc1', '/test', 'post', entry)

      const result = store.export()
      const exported = result.doc1?.['/test']?.['post']?.[0]

      expect(exported?.time).toBe(250)
      expect(exported?.request.method).toBe('POST')
      expect(exported?.response.status).toBe(201)
      expect(exported?.meta.example).toBe('test-example')
      expect(exported?.requestMetadata.variables).toEqual({ key: 'value' })
    })
  })

  describe('hooks', () => {
    it('calls onHistoryChange when adding history', () => {
      const onHistoryChange = vi.fn()
      const store = createHistoryStore({ hooks: { onHistoryChange } })

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())

      expect(onHistoryChange).toHaveBeenCalledWith('doc1')
    })

    it('calls onHistoryChange when loading data', () => {
      const onHistoryChange = vi.fn()
      const store = createHistoryStore({ hooks: { onHistoryChange } })

      const data: DocumentHistory = {
        doc1: {
          '/pets': {
            get: [createHistoryEntry()],
          },
        },
      }

      store.load(data)

      expect(onHistoryChange).toHaveBeenCalledWith('doc1')
    })

    it('calls onHistoryChange for multiple document changes', () => {
      const onHistoryChange = vi.fn()
      const store = createHistoryStore({ hooks: { onHistoryChange } })

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      store.addHistory('doc2', '/users', 'post', createHistoryEntry())

      expect(onHistoryChange).toHaveBeenCalledWith('doc1')
      expect(onHistoryChange).toHaveBeenCalledWith('doc2')
      expect(onHistoryChange.mock.calls.length).toBeGreaterThan(0)
    })

    it('does not throw when onHistoryChange is not provided', () => {
      const store = createHistoryStore({})

      expect(() => {
        store.addHistory('doc1', '/pets', 'get', createHistoryEntry())
      }).not.toThrow()
    })

    it('does not call hook when path length is less than 1', () => {
      const onHistoryChange = vi.fn()
      const store = createHistoryStore({ hooks: { onHistoryChange } })

      store.addHistory('doc1', '/pets', 'get', createHistoryEntry())

      // Normal usage should call the hook
      expect(onHistoryChange).toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('handles a complete request history workflow', () => {
      const onHistoryChange = vi.fn()
      const store = createHistoryStore({ hooks: { onHistoryChange } })

      // Add multiple entries
      store.addHistory('petstore', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('petstore', '/pets', 'get', createHistoryEntry({ timestamp: 2 }))
      store.addHistory('petstore', '/pets', 'post', createHistoryEntry({ timestamp: 3 }))

      // Verify they were added
      expect(store.getHistory('petstore', '/pets', 'get')).toHaveLength(2)
      expect(store.getHistory('petstore', '/pets', 'post')).toHaveLength(1)

      // Clear one operation
      store.clearOperationHistory('petstore', '/pets', 'post')
      expect(store.getHistory('petstore', '/pets', 'post')).toBeUndefined()
      expect(store.getHistory('petstore', '/pets', 'get')).toHaveLength(2)

      // Verify hooks were called
      expect(onHistoryChange).toHaveBeenCalledWith('petstore')
    })

    it('allows round-trip export and load', () => {
      const store1 = createHistoryStore({})

      store1.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store1.addHistory('doc1', '/pets', 'post', createHistoryEntry({ timestamp: 2 }))

      const exported = store1.export()

      const store2 = createHistoryStore({})
      store2.load(exported)

      expect(store2.getHistory('doc1', '/pets', 'get')).toHaveLength(1)
      expect(store2.getHistory('doc1', '/pets', 'post')).toHaveLength(1)
      expect(store2.getHistory('doc1', '/pets', 'get')?.[0]?.timestamp).toBe(1)
      expect(store2.getHistory('doc1', '/pets', 'post')?.[0]?.timestamp).toBe(2)
    })

    it('handles multiple operations across multiple documents', () => {
      const store = createHistoryStore({})

      // Document 1
      store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: 1 }))
      store.addHistory('doc1', '/pets', 'post', createHistoryEntry({ timestamp: 2 }))
      store.addHistory('doc1', '/users', 'get', createHistoryEntry({ timestamp: 3 }))

      // Document 2
      store.addHistory('doc2', '/products', 'get', createHistoryEntry({ timestamp: 4 }))
      store.addHistory('doc2', '/products', 'delete', createHistoryEntry({ timestamp: 5 }))

      const exported = store.export()
      expect(Object.keys(exported)).toHaveLength(2)
      expect(exported.doc1?.['/pets']?.['get']).toHaveLength(1)
      expect(exported.doc1?.['/pets']?.['post']).toHaveLength(1)
      expect(exported.doc1?.['/users']?.['get']).toHaveLength(1)
      expect(exported.doc2?.['/products']?.['get']).toHaveLength(1)
      expect(exported.doc2?.['/products']?.['delete']).toHaveLength(1)
    })

    it('respects history limit across multiple adds', () => {
      const store = createHistoryStore({})

      // Add 10 entries to exceed the limit
      for (let i = 1; i <= 10; i++) {
        store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: i }))
      }

      const result = store.getHistory('doc1', '/pets', 'get')
      expect(result).toHaveLength(5)

      // Verify we kept the newest 5
      expect(result?.[0]?.timestamp).toBe(6)
      expect(result?.[4]?.timestamp).toBe(10)
    })

    it('maintains independent history limits per operation', () => {
      const store = createHistoryStore({})

      // Fill up GET history
      for (let i = 1; i <= 7; i++) {
        store.addHistory('doc1', '/pets', 'get', createHistoryEntry({ timestamp: i }))
      }

      // Fill up POST history
      for (let i = 101; i <= 108; i++) {
        store.addHistory('doc1', '/pets', 'post', createHistoryEntry({ timestamp: i }))
      }

      const getHistory = store.getHistory('doc1', '/pets', 'get')
      const postHistory = store.getHistory('doc1', '/pets', 'post')

      expect(getHistory).toHaveLength(5)
      expect(postHistory).toHaveLength(5)

      // Each should have its own set of newest entries
      expect(getHistory?.[0]?.timestamp).toBe(3)
      expect(postHistory?.[0]?.timestamp).toBe(104)
    })
  })
})
