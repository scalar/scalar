/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { createWorkspace, localStoragePlugin } from './create-workspace.ts'

describe('create-workspace', () => {
  it('creates a workspace and exports the state as an OpenAPI document', () => {
    const workspace = createWorkspace()

    workspace.load('default', {
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

    const result = workspace.export('default')

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
    const workspace = createWorkspace()

    // Simulate fetching content from a remote server
    workspace.load('default', async () => {
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

    expect(workspace.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('persists the state to localStorage', async () => {
    const workspace = createWorkspace({
      plugins: [localStoragePlugin()],
    })

    workspace.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    // Wait for the watcher to do its thing
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Parse the localStorage value before comparing
    const state = JSON.parse(localStorage.getItem('state') || '{}')

    expect(state.collections.default.document).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
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

    const workspace = createWorkspace({
      plugins: [localStoragePlugin()],
    })

    expect(workspace.state.collections.default).toBeDefined()
    expect(workspace.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })
})
