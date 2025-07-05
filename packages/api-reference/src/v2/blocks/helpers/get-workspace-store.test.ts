import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWorkspaceStore, type GetWorkspaceStoreProps } from './get-workspace-store'
import { createWorkspaceStore, type WorkspaceStore } from '@scalar/workspace-store/client'
import { flushPromises } from '@vue/test-utils'

describe('get-workspace-store', () => {
  let originalWindow: typeof global.window

  beforeEach(() => {
    // Store the original window object
    originalWindow = global.window
  })

  afterEach(() => {
    // Restore the original window object
    global.window = originalWindow
  })

  describe('SSR/SSG environment handling', () => {
    it('throws error when no store is provided in SSR environment', () => {
      // Mock window as undefined to simulate SSR environment
      // @ts-ignore - we're intentionally setting window to undefined
      global.window = undefined

      expect(() => {
        getWorkspaceStore({})
      }).toThrow('[openapi-blocks] the store prop is required when using SSR/SSG')
    })

    it('works when store is provided in SSR environment', () => {
      // Mock window as undefined to simulate SSR environment
      // @ts-ignore - we're intentionally setting window to undefined
      global.window = undefined

      const mockStore = createWorkspaceStore()

      const result = getWorkspaceStore({ store: mockStore })
      expect(result).toBe(mockStore)
    })

    it('works without store prop in client environment', () => {
      // Ensure window is defined (client environment)
      expect(typeof window).toBe('object')

      const result = getWorkspaceStore({})
      expect(result).toBeDefined()
      expect(typeof result.workspace).toBe('object')
      expect(typeof result.addDocument).toBe('function')
    })
  })

  describe('store creation and management', () => {
    it('creates a new store when none is provided', () => {
      const result = getWorkspaceStore({})

      expect(result).toBeDefined()
      expect(typeof result.workspace).toBe('object')
      expect(typeof result.addDocument).toBe('function')
    })

    it('uses provided store instead of creating new one', () => {
      const customStore = createWorkspaceStore()

      const result = getWorkspaceStore({ store: customStore })
      expect(result).toBe(customStore)
    })

    it('creates singleton store on subsequent calls without store prop', () => {
      // First call
      const result1 = getWorkspaceStore({})
      expect(result1).toBeDefined()

      // Second call should reuse the same store
      const result2 = getWorkspaceStore({})
      expect(result2).toBe(result1)

      // Third times a charm
      const result3 = getWorkspaceStore({})
      expect(result3).toBe(result1)
    })
  })

  describe('document loading', () => {
    const mockAddDocument = vi.fn().mockResolvedValue(undefined)
    const mockStore = {
      workspace: { documents: {} },
      addDocument: mockAddDocument,
    } as unknown as WorkspaceStore

    it('loads document with URL when provided', async () => {
      const props: GetWorkspaceStoreProps = {
        url: 'https://api.example.com/openapi.json',
        store: mockStore,
      }

      const store = getWorkspaceStore(props)

      expect(store).toBe(mockStore)
      expect(mockAddDocument).toHaveBeenCalledWith({
        url: 'https://api.example.com/openapi.json',
        name: 'https://api.example.com/openapi.json',
      })
    })

    it('loads document with explicit name when provided', async () => {
      const props: GetWorkspaceStoreProps = {
        name: 'my-api',
        url: 'https://api.example.com/openapi.json',
        store: mockStore,
      }

      getWorkspaceStore(props)
      expect(mockAddDocument).toHaveBeenCalledWith({
        name: 'my-api',
        url: 'https://api.example.com/openapi.json',
      })
    })

    it('loads document with object when provided', async () => {
      const document = {
        openapi: '3.0.0',
        info: { title: 'Test API' },
      }

      const props: GetWorkspaceStoreProps = {
        document,
      }

      const store = getWorkspaceStore(props)
      await flushPromises()

      expect(store.workspace.documents['Test API'].info.title).toBe('Test API')
      expect(store.workspace.documents['Test API'].openapi).toBe('3.1.1') // Its been upgraded
    })

    it('generates default name when no name, URL, or title is provided', async () => {
      const props: GetWorkspaceStoreProps = {
        document: {
          openapi: '3.0.0',
          info: { version: '1.0.0' },
        },
      }

      const store = getWorkspaceStore(props)

      expect(store).toBeDefined()
      expect(typeof store.addDocument).toBe('function')
    })

    it('does not load document if it already exists in store', async () => {
      // Create a store with an existing document
      const storeWithDocument = createWorkspaceStore({
        documents: [
          {
            name: 'existing-doc',
            document: {
              openapi: '3.0.0',
              info: { title: 'Existing API', version: '1.0.0' },
            },
          },
        ],
      })

      const props: GetWorkspaceStoreProps = {
        store: storeWithDocument,
        name: 'existing-doc',
      }

      const result = getWorkspaceStore(props)
      expect(result).toBe(storeWithDocument)
    })
  })

  describe('edge cases and error handling', () => {
    it('handles empty props object', () => {
      const result = getWorkspaceStore({})

      expect(result).toBeDefined()
      expect(typeof result.workspace).toBe('object')
      expect(typeof result.addDocument).toBe('function')
    })

    it('handles props with only store property', () => {
      const mockStore = createWorkspaceStore()

      const result = getWorkspaceStore({ store: mockStore })
      expect(result).toBe(mockStore)
    })

    it('handles multiple documents with different names', async () => {
      const props1: GetWorkspaceStoreProps = {
        name: 'doc1',
        url: 'https://api1.example.com/openapi.json',
      }

      const props2: GetWorkspaceStoreProps = {
        name: 'doc2',
        url: 'https://api2.example.com/openapi.json',
      }

      const store1 = getWorkspaceStore(props1)
      const store2 = getWorkspaceStore(props2)

      expect(store1).toBeDefined()
      expect(store2).toBeDefined()
      expect(store1).toBe(store2)
    })
  })

  describe('real document loading scenarios', () => {
    it('loads a simple OpenAPI document', async () => {
      const document = {
        openapi: '3.0.0',
        info: {
          title: 'Pet Store API',
          version: '1.0.0',
        },
        paths: {
          '/pets': {
            get: {
              summary: 'List pets',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      }

      const store = getWorkspaceStore({ document })
      await flushPromises()

      expect(store.workspace.documents['Pet Store API'].info.title).toBe('Pet Store API')
    })

    it('loads document with URL and custom name', async () => {
      const props: GetWorkspaceStoreProps = {
        name: 'pet-store-api',
        url: 'https://petstore.swagger.io/v2/swagger.json',
      }

      const store = getWorkspaceStore(props)
      expect(store).toBeDefined()
    })

    it('handles document with complex structure', async () => {
      const document = {
        openapi: '3.0.0',
        info: {
          title: 'Complex API',
          version: '2.0.0',
          description: 'A complex API with multiple components',
        },
        servers: [{ url: 'https://api.example.com/v1' }, { url: 'https://staging-api.example.com/v1' }],
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
            },
          },
        },
        paths: {
          '/users': {
            get: {
              summary: 'List users',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const store = getWorkspaceStore({ document })
      await flushPromises()
      expect(store.workspace.documents['Complex API'].info.title).toBe('Complex API')
    })
  })

  describe('store integration', () => {
    it('creates store with initial documents', async () => {
      const initialStore = createWorkspaceStore({
        documents: [
          {
            name: 'initial-doc',
            document: {
              openapi: '3.0.0',
              info: { title: 'Initial API', version: '1.0.0' },
            },
          },
        ],
      })

      const store = getWorkspaceStore({ store: initialStore })
      await flushPromises()
      expect(store.workspace.documents['initial-doc'].info.title).toBe('Initial API')
    })

    it('creates store with workspace metadata', () => {
      const storeWithMeta = createWorkspaceStore({
        meta: {
          'x-scalar-active-document': 'main-api',
          'x-scalar-theme': 'dark',
        },
      })

      const result = getWorkspaceStore({ store: storeWithMeta })
      expect(result).toBe(storeWithMeta)
      expect(result.workspace['x-scalar-theme']).toBe('dark')
    })

    it('creates store with configuration', async () => {
      const storeWithConfig = createWorkspaceStore({
        config: {
          'x-scalar-reference-config': {
            meta: {
              title: 'Test API Reference',
            },
          },
        },
      })

      const result = getWorkspaceStore({ store: storeWithConfig })
      await flushPromises()
      expect(result.config['x-scalar-reference-config']?.meta?.title).toBe('Test API Reference')
    })
  })
})
