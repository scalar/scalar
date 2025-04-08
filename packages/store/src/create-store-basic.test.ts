/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createStore, localStoragePlugin } from './create-store-basic.ts'

describe('create-store-basic', () => {
  it('creates a store and exports the state as an OpenAPI document', () => {
    const store = createStore()

    store.actions.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Test response',
              },
            },
          },
        },
      },
    })

    const result = store.actions.export('default')

    expect(result).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Test response',
              },
            },
          },
        },
      },
    })
  })

  it('imports content asynchronously', async () => {
    const store = createStore()

    // Simulate fetching content from a remote server
    store.actions.load('default', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))

      return {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(store.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('persists the state to localStorage', async () => {
    const store = createStore({
      plugins: [localStoragePlugin()],
    })

    store.actions.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    // Wait for the watcher to do its thing
    await nextTick()

    // Parse the localStorage value before comparing
    const state = JSON.parse(localStorage.getItem('state') || '{}')

    expect(state).toMatchObject({
      collections: {
        default: {
          openapi: '3.1.1',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
          paths: {},
        },
      },
    })
  })

  it('restores the state from localStorage', async () => {
    localStorage.setItem(
      'state',
      JSON.stringify({
        collections: {
          default: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {},
          },
        },
      }),
    )

    const store = createStore({
      plugins: [localStoragePlugin()],
    })

    expect(store.state.collections.default).toBeDefined()
    expect(store.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })
})
